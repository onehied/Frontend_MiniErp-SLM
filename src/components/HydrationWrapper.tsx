'use client';

import { useAuthStore } from '@/store/auth';
import { useEffect, useState } from 'react';

export default function HydrationWrapper({ children }: { children: React.ReactNode }) {
  const setHasHydrated = useAuthStore((state) => state.setHasHydrated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [clientSide, setClientSide] = useState(false);

  useEffect(() => {
    setClientSide(true);
    if (!hasHydrated) {
      setHasHydrated(true);
    }
  }, [setHasHydrated, hasHydrated]);

  if (!clientSide) {
    return null;
  }

  return <>{children}</>;
}
