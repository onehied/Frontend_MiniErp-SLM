'use client';

import { useAuthStore } from '@/store/auth';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const SKIPPED_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
]);

export default function NavigationTracker() {
  const pathname = usePathname();
  const { token, hasHydrated } = useAuthStore();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!hasHydrated || !token || !pathname || SKIPPED_PATHS.has(pathname)) {
      return;
    }

    if (lastTrackedPath.current === pathname) {
      return;
    }

    lastTrackedPath.current = pathname;

    void fetch(`${API_URL}/activity-logs/navigation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        path: pathname,
        title: typeof document !== 'undefined' ? document.title : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname, token, hasHydrated]);

  return null;
}
