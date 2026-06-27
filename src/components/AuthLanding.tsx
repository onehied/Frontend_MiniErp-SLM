'use client';

import { authAPI } from '@/lib/api-calls';
import { getApiOrigin } from '@/lib/api-origin';
import { useAuthStore } from '@/store/auth';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound, LogIn, Mail, UserPlus } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot';

function normalizeMode(value: string | null): AuthMode {
  if (value === 'register') return 'register';
  if (value === 'forgot' || value === 'forget-password' || value === 'forgot-password') return 'forgot';
  return 'login';
}

export default function AuthLanding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = useMemo(() => normalizeMode(searchParams.get('form')), [searchParams]);
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const { setUser, setToken, setRefreshToken, token, hasHydrated } = useAuthStore();

  const extractErrorMessage = (value: unknown, fallback: string) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    return fallback;
  };

  // Verifikasi token ke server sebelum redirect ke dashboard.
  // Jika token ada tapi sudah expired/invalid, server akan balas 401,
  // interceptor akan memanggil logout() dan redirect ke /?form=login
  // sehingga tidak terjadi loop.
  useEffect(() => {
    if (!hasHydrated) return;

    if (token) {
      authAPI.getMe()
        .then(() => {
          // Token valid → redirect ke dashboard
          router.replace('/dashboard');
        })
        .catch(() => {
          // Token expired / tidak valid → sudah ditangani interceptor (logout + redirect)
        });
    }
  }, [token, router, hasHydrated]);

  // Show loading until hydrated
  if (!hasHydrated) {
    return null;
  }

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', name: '', email: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loginFieldErrors, setLoginFieldErrors] = useState({ email: '', password: '' });
  const fieldClassName =
    'input-field border-slate-300/90 bg-white/95 px-4 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500';

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
    setLoginFieldErrors({ email: '', password: '' });

    const params = new URLSearchParams(searchParams.toString());
    params.set('form', nextMode);
    router.replace(`/?${params.toString()}`);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoginFieldErrors({ email: '', password: '' });
    setLoading(true);

    try {
      const response = await authAPI.login(loginForm.email, loginForm.password);
      const { access_token, refresh_token, user } = response.data;

      setToken(access_token);
      setRefreshToken(refresh_token);
      setUser(user);

      router.push('/dashboard');
    } catch (err: any) {
      const message = extractErrorMessage(
        err?.response?.data?.message,
        'Login failed',
      );

      if (message === 'Email tidak terdaftar.') {
        setLoginFieldErrors({ email: 'Email tidak terdaftar.', password: '' });
      } else if (message === 'Password salah.') {
        setLoginFieldErrors({ email: '', password: 'Password salah.' });
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      window.location.href = `${getApiOrigin()}/api/auth/google`;
    } catch (err: any) {
      setError(err?.message || 'Login Google gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!registerForm.username || registerForm.username.trim().length < 3) {
      setError('Username is required and must be at least 3 characters');
      return;
    }

    if (!registerForm.name || registerForm.name.trim().length < 3) {
      setError('Name is required and must be at least 3 characters');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(registerForm.email)) {
      setError('Email format is invalid');
      return;
    }

    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register(
        registerForm.username,
        registerForm.email,
        registerForm.name,
        registerForm.password,
      );
      const { access_token, refresh_token, user } = response.data;

      setToken(access_token);
      setRefreshToken(refresh_token);
      setUser(user);

      router.push('/dashboard');
    } catch (err: any) {
      setError(
        extractErrorMessage(err?.response?.data?.message, 'Registration failed'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!/^\S+@\S+\.\S+$/.test(forgotEmail)) {
      setError('Email format is invalid');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.forgotPassword(forgotEmail);
      setSuccess(
        response.data?.message ||
          'Link reset password telah dikirim ke email Anda.',
      );
    } catch (err: any) {
      setError(
        extractErrorMessage(
          err?.response?.data?.message,
          'Gagal mengirim link reset password.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <Image
        src="/slm-auth-bg.jpg"
        alt="SLM background"
        fill
        quality={52}
        priority
        sizes="100vw"
        className="auth-bg-zoom object-cover opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/88 via-slate-950/76 to-slate-900/35" />

      <div className="absolute left-8 right-[34rem] top-1/2 z-10 hidden -translate-y-1/2 text-left lg:block xl:left-14 xl:right-[38rem]">
        <div className="mb-5">
          <Image
            src="/slm-logo-white.svg"
            alt="SLM logo"
            width={220}
            height={48}
            className="h-10 w-auto transition duration-500 hover:scale-[1.03] hover:opacity-95"
            priority
          />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/80 xl:text-sm">
          Sinarmas LDA Maritime
        </p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-white xl:text-5xl">
          Secure, Agile, Friendly and Experienced.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 xl:text-lg">
          Integrated maritime logistics platform for operations, customer, and invoice management.
        </p>
      </div>

      <div className="relative z-10 flex min-h-screen items-center px-4 py-6 sm:px-6 lg:justify-end lg:px-10">
        <div className="w-full max-w-2xl rounded-[32px] border border-slate-200/90 bg-white p-5 shadow-2xl backdrop-blur-xl sm:p-8 lg:mr-6 lg:w-[520px] dark:border-slate-700 dark:bg-slate-950/90">
          <div className="mb-5 text-left lg:hidden">
            <Image
              src="/slm-logo.svg"
              alt="SLM logo"
              width={180}
              height={40}
              className="mb-3 h-8 w-auto transition duration-500 hover:scale-[1.03]"
              priority
            />
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-700 dark:text-slate-300">
              Sinarmas LDA Maritime
            </p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-3xl">
              Secure, Agile, Friendly and Experienced.
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Integrated maritime logistics platform for operations, customer, and invoice management.
            </p>
          </div>

          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {mode === 'login' ? 'Login Account' : mode === 'register' ? 'Create Account' : 'Forgot Password'}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {mode === 'login'
                ? 'Masuk ke dashboard mini ERP Anda.'
                : mode === 'register'
                  ? 'Lengkapi data untuk membuat akun baru.'
                  : 'Masukkan email terdaftar untuk reset password.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              {success}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-100">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                  className={fieldClassName}
                  placeholder="Your email"
                  required
                />
                {loginFieldErrors.email && (
                  <p className="mt-1 text-sm font-medium text-rose-600 dark:text-rose-400">{loginFieldErrors.email}</p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-slate-800 dark:text-slate-100">Password</label>
                  <button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    className="tooltip-trigger text-sm font-semibold text-sky-700 hover:text-sky-800 dark:text-sky-300"
                    data-tooltip="Buka form lupa password"
                  >
                    Forget Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                    className={`${fieldClassName} pr-12`}
                    placeholder="Your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="tooltip-trigger absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    data-tooltip={showLoginPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {loginFieldErrors.password && (
                  <p className="mt-1 text-sm font-medium text-rose-600 dark:text-rose-400">{loginFieldErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="tooltip-trigger inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f4c81] px-4 py-3 font-semibold text-white transition hover:bg-[#0b3e69] disabled:opacity-60"
                data-tooltip="Login menggunakan email dan password"
              >
                <LogIn size={16} />
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="tooltip-trigger inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                data-tooltip="Login menggunakan akun Google"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7.1 0-.7-.1-1.4-.2-2.1H12z" />
                  <path fill="#34A853" d="M12 22c2.6 0 4.8-.8 6.4-2.3l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.7-1.7-5.5-4.1H3.3v2.5C4.9 19.8 8.2 22 12 22z" />
                  <path fill="#4A90E2" d="M6.5 14.1c-.2-.6-.3-1.3-.3-2.1s.1-1.4.3-2.1V7.4H3.3C2.5 8.9 2 10.4 2 12s.5 3.1 1.3 4.6l3.2-2.5z" />
                  <path fill="#FBBC05" d="M12 5.8c1.4 0 2.7.5 3.7 1.5l2.8-2.8C16.8 2.9 14.6 2 12 2 8.2 2 4.9 4.2 3.3 7.4l3.2 2.5c.8-2.4 3-4.1 5.5-4.1z" />
                </svg>
                {loading ? 'Memproses...' : 'Sign in with Google'}
              </button>

              <button
                type="button"
                onClick={() => switchMode('register')}
                className="tooltip-trigger inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                data-tooltip="Buka form registrasi"
              >
                <UserPlus size={16} />
                Register
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-100">Username</label>
                  <input
                    type="text"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, username: e.target.value }))}
                    className={fieldClassName}
                    placeholder="Masukkan username"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-100">Full Name</label>
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, name: e.target.value }))}
                    className={fieldClassName}
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-100">Email</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                  className={fieldClassName}
                  placeholder="Masukkan email"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-100">Password</label>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                    className={`${fieldClassName} pr-12`}
                    placeholder="Masukkan password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword((prev) => !prev)}
                    className="tooltip-trigger absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                    data-tooltip={showRegisterPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="tooltip-trigger inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                data-tooltip="Daftarkan akun baru"
              >
                <UserPlus size={16} />
                {loading ? 'Registering...' : 'Register'}
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="tooltip-trigger inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                data-tooltip="Kembali ke form login"
              >
                <LogIn size={16} />
                Back to Login
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-100">Email</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className={fieldClassName}
                  placeholder="Masukkan email terdaftar"
                  required
                />
              </div>

              <p className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <Mail size={14} />
                Gunakan email yang terdaftar untuk proses reset password.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="tooltip-trigger inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
                data-tooltip="Kirim permintaan reset password"
              >
                <KeyRound size={16} />
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => switchMode('login')}
                className="tooltip-trigger inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                data-tooltip="Kembali ke form login"
              >
                <LogIn size={16} />
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
