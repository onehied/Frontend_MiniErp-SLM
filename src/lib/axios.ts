'use client';

import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const AUTH_STORAGE_KEY = 'auth-storage';

interface PersistedAuthState {
  token?: string | null;
  refreshToken?: string | null;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
}

interface BackendSuccessWrapper<T = unknown> {
  status: 'success';
  statusCode: number;
  data: T;
}

function getPersistedAuthState(): PersistedAuthState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as { state?: PersistedAuthState };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

function getAccessToken() {
  return useAuthStore.getState().token ?? getPersistedAuthState()?.token ?? null;
}

function getRefreshToken() {
  return (
    useAuthStore.getState().refreshToken ??
    getPersistedAuthState()?.refreshToken ??
    null
  );
}

function setAccessToken(token: string) {
  useAuthStore.getState().setToken(token);
}

function clearSession() {
  useAuthStore.getState().logout();

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function redirectToLogin() {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
}

function extractMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object') {
    return fallback;
  }

  const message = (data as { message?: string | string[] }).message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }

  return fallback;
}

function unwrapSuccessData<T>(data: T | BackendSuccessWrapper<T>) {
  if (
    data &&
    typeof data === 'object' &&
    'status' in data &&
    'data' in data
  ) {
    return (data as BackendSuccessWrapper<T>).data;
  }

  return data as T;
}

function normalizeSuccessResponse<T>(response: AxiosResponse<T | BackendSuccessWrapper<T>>) {
  return {
    ...response,
    data: unwrapSuccessData(response.data),
  };
}

const api = axios.create({
  baseURL: API_URL,
});

const refreshClient = axios.create({
  baseURL: API_URL,
});

let refreshPromise: Promise<string | null> | null = null;

async function requestTokenRefresh() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/auth/refresh', { refresh_token: refreshToken })
      .then((response) => {
        const payload = unwrapSuccessData<{ access_token: string }>(response.data);
        const nextAccessToken = payload?.access_token;

        if (!nextAccessToken) {
          return null;
        }

        setAccessToken(nextAccessToken);
        return nextAccessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => normalizeSuccessResponse(response),
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const statusCode = error.response?.status;
    const requestUrl = String(originalRequest?.url || '');
    const isAuthRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/google/login') ||
      requestUrl.includes('/auth/refresh');

    if (
      statusCode === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      const nextAccessToken = await requestTokenRefresh();

      if (nextAccessToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        (originalRequest.headers as Record<string, string>).Authorization =
          `Bearer ${nextAccessToken}`;

        return api(originalRequest);
      }
    }

    if (statusCode === 401 && !isAuthRequest) {
      clearSession();
      toast.error('Sesi login berakhir. Silakan login kembali.');
      redirectToLogin();
    }

    if (statusCode === 403) {
      toast.error(
        extractMessage(error.response?.data, 'Anda tidak memiliki akses ke fitur ini.'),
      );
    }

    if (statusCode === 404) {
      toast.error(
        extractMessage(error.response?.data, 'Data atau endpoint yang diminta tidak ditemukan.'),
      );
    }

    if (statusCode === 500) {
      toast.error(
        extractMessage(error.response?.data, 'Terjadi kesalahan pada server.'),
      );
    }

    return Promise.reject(error);
  },
);

export default api;
