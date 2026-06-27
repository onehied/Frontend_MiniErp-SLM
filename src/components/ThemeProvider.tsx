'use client';

import { useEffect, useState } from 'react';

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const root = document.documentElement;
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = storedTheme === 'dark' || (!storedTheme && prefersDark);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}
