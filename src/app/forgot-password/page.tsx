'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import { authAPI } from '@/lib/api-calls';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Format email tidak valid.');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.forgotPassword(email);
      setSuccess(
        response.data?.message ||
          'Link reset password telah dikirim ke email Anda.',
      );
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || 'Gagal mengirim email reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Forgot Password
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Masukkan email yang terdaftar untuk menerima link reset password.
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
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-field pl-10"
                placeholder="nama@email.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Mengirim...' : 'Kirim Link Reset'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Kembali ke Login
          </button>
        </form>
      </div>
    </main>
  );
}
