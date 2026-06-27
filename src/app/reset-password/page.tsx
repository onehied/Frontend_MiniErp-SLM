'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api-calls';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Token reset password tidak ditemukan.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.resetPassword(token, password);
      setSuccess(response.data?.message || 'Password berhasil diubah.');
      setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || 'Gagal mengubah password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Reset Password
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Masukkan password baru untuk akun Anda.
        </p>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            {success}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-100">
              Password Baru
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-field"
              placeholder="Minimal 6 karakter"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-100">
              Konfirmasi Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="input-field"
              placeholder="Ulangi password baru"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </main>
  );
}
