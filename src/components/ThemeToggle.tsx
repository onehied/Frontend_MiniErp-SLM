'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const initialTheme = stored === 'dark' ? 'dark' : 'light';
    setTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;

    if (nextTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800 transition"
    >
      Switch to {theme === 'dark' ? 'light' : 'dark'} mode
    </button>
  );
}
