import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  roles: string[];
  avatarUrl?: string;
  phone?: string;
  googleLinked?: boolean;
  googleEmail?: string | null;
  googleName?: string | null;
  googleAvatarUrl?: string | null;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      hasHydrated: false,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setRefreshToken: (token) => set({ refreshToken: token }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      logout: () => set({ user: null, token: null, refreshToken: null }),
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isLoading: state.isLoading,
        error: state.error,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    },
  ),
);
