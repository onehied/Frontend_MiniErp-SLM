'use client';

import { useAuthStore } from '@/store/auth';
import { LogOut, MoonStar, SunMedium, UserCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import ProfileModal from './ProfileModal';

export default function UserTopActions() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const nextTheme = stored === 'dark' ? 'dark' : 'light';

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setTheme(nextTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout?',
      text: 'Anda yakin ingin keluar dari akun ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Logout',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        router.push('/login');
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="tooltip-trigger inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          data-tooltip="Lihat dan edit profil"
        >
        <UserCircle2 size={16} className="text-sky-700" />
        <span className="max-w-[160px] truncate">{user?.name || 'User'}</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="tooltip-trigger inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          data-tooltip={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <SunMedium size={17} /> : <MoonStar size={17} />}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="tooltip-trigger inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 shadow-sm hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200 dark:hover:bg-rose-900/60"
          data-tooltip="Logout"
        >
          <LogOut size={17} />
        </button>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
