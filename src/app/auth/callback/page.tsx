'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authAPI } from '@/lib/api-calls';

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken, setRefreshToken, setUser } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const error = searchParams.get('error');

    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!accessToken || !refreshToken) {
      router.replace('/login');
      return;
    }

    const completeLogin = async () => {
      setToken(accessToken);
      setRefreshToken(refreshToken);

      try {
        const response = await authAPI.getMe();
        setUser(response.data);
      } catch {
        // Ignore; axios interceptor will handle invalid tokens if any.
      }

      router.replace('/dashboard');
    };

    completeLogin();
  }, [router, searchParams, setRefreshToken, setToken, setUser]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-700 shadow-2xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
        Memproses login Google...
      </div>
    </main>
  );
}
