'use client';

import { authAPI } from '@/lib/api-calls';
import { requestGoogleIdToken } from '@/lib/google-identity';
import { useAuthStore } from '@/store/auth';
import { Camera, Link2, Mail, Save, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState({
    username: '',
    name: '',
    phone: '',
    avatarUrl: '',
  });
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    if (!open || !user) {
      return;
    }

    setProfile({
      username: user.username,
      name: user.name,
      phone: user.phone || '',
      avatarUrl: user.avatarUrl || '',
    });
  }, [open, user]);

  useEffect(() => {
    if (!open) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [open, onClose]);

  if (!open || !user) {
    return null;
  }

  const extractMessage = (value: unknown, fallback: string) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    return fallback;
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setError('');

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Format foto harus JPG, PNG, atau WEBP.');
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Ukuran foto maksimal 2 MB.');
      }

      setPhotoUploading(true);

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
        reader.readAsDataURL(file);
      });

      setProfile((prev) => ({ ...prev, avatarUrl: base64 }));

      const response = await authAPI.uploadProfileImage(file);
      const nextUser = {
        ...user,
        avatarUrl: response.data.avatarUrl,
      };

      setUser(nextUser);
      setProfile((prev) => ({
        ...prev,
        avatarUrl: nextUser.avatarUrl || base64,
      }));
    } catch (err: any) {
      setError(
        extractMessage(
          err?.response?.data?.message || err?.message,
          'Gagal upload foto profile.',
        ),
      );
    } finally {
      setPhotoUploading(false);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!profile.username.trim() || !profile.name.trim()) {
      setError('Username dan name wajib diisi');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await authAPI.updateProfile({
        username: profile.username.trim(),
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        avatarUrl: profile.avatarUrl,
      });

      const nextUser = {
        ...user,
        ...response.data,
      };

      setUser(nextUser);
      onClose();
    } catch (err: any) {
      setError(
        extractMessage(err?.response?.data?.message, 'Gagal menyimpan profile.'),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLinkGoogle = async () => {
    try {
      setGoogleLoading(true);
      const idToken = await requestGoogleIdToken(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '');
      const response = await authAPI.linkGoogle(idToken);
      const linkedUser = response.data;

      const nextUser = {
        ...user,
        googleLinked: linkedUser.googleLinked,
        googleEmail: linkedUser.googleEmail,
        googleName: linkedUser.googleName,
        googleAvatarUrl: linkedUser.googleAvatarUrl,
      };

      setUser(nextUser);

      await Swal.fire({
        icon: 'success',
        title: 'Akun Google tertaut',
        text: 'Akun Google berhasil ditautkan.',
      });
    } catch (err: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Gagal menautkan akun',
        text: err?.response?.data?.message || err?.message || 'Tidak dapat menautkan akun Google.',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Hapus tautan Google?',
      text: 'Akun Google akan dilepas dari profile ini.',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    });

    if (!confirm.isConfirmed) {
      return;
    }

    try {
      setGoogleLoading(true);
      const response = await authAPI.unlinkGoogle();
      const unlinkedUser = response.data;

      const nextUser = {
        ...user,
        googleLinked: unlinkedUser.googleLinked,
        googleEmail: unlinkedUser.googleEmail,
        googleName: unlinkedUser.googleName,
        googleAvatarUrl: unlinkedUser.googleAvatarUrl,
      };

      setUser(nextUser);

      await Swal.fire({
        icon: 'success',
        title: 'Tautan dihapus',
        text: 'Akun Google berhasil dilepas.',
      });
    } catch (err: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Gagal menghapus tautan',
        text: err?.response?.data?.message || 'Tidak dapat menghapus tautan Google.',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4" onClick={onClose}>
      <div className="w-full max-w-5xl rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-2xl sm:px-7 sm:py-6 dark:border-slate-700 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between sm:mb-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-[1.7rem] dark:text-white">Profile</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Detail user login</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                Integrasi Akun
              </div>
              <div className="min-h-[136px] rounded-[18px] border border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-900/70">
                {user.googleLinked ? (
                  <div className="flex h-full flex-col justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {user.googleAvatarUrl ? (
                        <Image
                          src={user.googleAvatarUrl}
                          alt="Google avatar"
                          width={40}
                          height={40}
                          className="rounded-full border border-slate-200"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                          G
                        </div>
                      )}
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{user.googleName || 'Google User'}</p>
                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-300">{user.googleEmail || '-'}</p>
                      </div>
                    </div>
                    <div>
                      {user.googleLinked ? (
                        <button
                          type="button"
                          onClick={handleUnlinkGoogle}
                          disabled={googleLoading}
                          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          <Trash2 size={14} />
                          {googleLoading ? 'Memproses...' : 'Hapus Tautan'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Belum tertaut</p>
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-300">Hubungkan akun Google untuk akses yang lebih cepat dan sinkron avatar.</p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleLinkGoogle}
                        disabled={googleLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                      >
                        <Link2 size={14} />
                        {googleLoading ? 'Memproses...' : 'Tautkan Google'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                Informasi Kontak
              </div>
              <div className="space-y-3 rounded-[18px] border border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-900/70">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">Phone</label>
                  <input
                    className="input-field min-h-[52px] rounded-[18px] px-4 text-base placeholder:text-slate-400"
                    value={profile.phone}
                    onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">Email</label>
                  <div className="flex min-h-[52px] items-center gap-3 rounded-[12px] border border-slate-200 bg-white px-4 text-base text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <Mail size={16} />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {/* <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Email tidak bisa diubah.</p> */}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                Avatar
              </div>
              <div className="flex min-h-[136px] items-center gap-4 rounded-[18px] border border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-900/70">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[18px] bg-slate-100 dark:bg-slate-800">
                  {profile.avatarUrl ? (
                    <Image src={profile.avatarUrl} alt="Profile preview" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-slate-400">
                      {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{profile.name || 'User Profile'}</p>
                  <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-600">
                    <Camera size={14} />
                    {photoUploading ? 'Uploading...' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    JPG, PNG, WEBP. Maksimal 2 MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                Informasi Dasar
              </div>
              <div className="space-y-3 rounded-[18px] border border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-900/70">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">Username</label>
                  <input
                    className="input-field min-h-[52px] rounded-[18px] px-4 text-base placeholder:text-slate-400"
                    value={profile.username}
                    onChange={(e) => setProfile((prev) => ({ ...prev, username: e.target.value }))}
                    placeholder="Minimum 3 characters"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">Name</label>
                  <input
                    className="input-field min-h-[52px] rounded-[18px] px-4 text-base placeholder:text-slate-400"
                    value={profile.name}
                    onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn-secondary rounded-xl px-5 py-2.5 text-base" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-base" onClick={handleSave} disabled={saving || photoUploading}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
