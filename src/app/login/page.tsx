'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Halaman /login hanya berfungsi sebagai pengalih:
 * - Jika sudah login → ke dashboard
 * - Jika belum login → ke halaman utama dengan form login (/?form=login)
 * Tidak ada form di sini agar tidak ada race condition redirect.
 */
export default function LoginPage() {
  const router = useRouter();
  const { token, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/?form=login');
    }
  }, [token, router, hasHydrated]);

  return null;
}
