'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

const IDLE_LIMIT_MS = 30 * 60 * 1000;

export default function IdleSessionManager() {
  const router = useRouter();
  const { token, logout, hasHydrated } = useAuthStore();
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  const clearTimers = () => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const handleForcedLogout = () => {
    clearTimers();
    setWarningOpen(false);
    setSecondsLeft(60);
    logout();
    router.replace('/login');
  };

  const startIdleTimer = () => {
    clearTimers();
    idleTimeoutRef.current = setTimeout(() => {
      setWarningOpen(true);
      setSecondsLeft(60);

      countdownIntervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleForcedLogout();
            return 0;
          }

          return prev - 1;
        });
      }, 1000);
    }, IDLE_LIMIT_MS);
  };

  const resetTimer = () => {
    if (!token) {
      return;
    }

    setWarningOpen(false);
    setSecondsLeft(60);
    startIdleTimer();
  };

  useEffect(() => {
    if (!hasHydrated || !token) {
      clearTimers();
      setWarningOpen(false);
      return;
    }

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'scroll',
      'keydown',
      'touchstart',
    ];

    const handleActivity = () => resetTimer();

    startIdleTimer();

    events.forEach((eventName) =>
      window.addEventListener(eventName, handleActivity, { passive: true }),
    );

    return () => {
      clearTimers();
      events.forEach((eventName) =>
        window.removeEventListener(eventName, handleActivity),
      );
    };
  }, [hasHydrated, token]);

  if (!warningOpen || !token) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Sesi Tidak Aktif
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Sesi Anda akan berakhir dalam 60 detik karena tidak ada aktivitas.
        </p>
        <p className="mt-2 text-sm font-semibold text-amber-600">
          Logout otomatis dalam {secondsLeft} detik.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={resetTimer}
            className="btn-update flex-1"
          >
            Tetap Login
          </button>
          <button
            type="button"
            onClick={handleForcedLogout}
            className="btn-back flex-1"
          >
            Logout Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
