'use client';

import Sidebar from '@/components/Sidebar';
import Notification from '@/components/Notification';
import { rolesAPI, usersAPI } from '@/lib/api-calls';
import { useEffect, useState } from 'react';
import { Eye, Pencil, Plus, RotateCcw, ShieldCheck, Trash2, X } from 'lucide-react';
import UserTopActions from '@/components/UserTopActions';
import TableActionsMenu from '@/components/TableActionsMenu';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import TableSkeleton from '@/components/TableSkeleton';

export default function UsersPage() {
  const router = useRouter();
  const { token, hasHydrated } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({ page: 1, limit: 10, search: '' });
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1, limit: 10 });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loadingViewId, setLoadingViewId] = useState<string | null>(null);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (hasHydrated && !token) {
      router.push('/login');
    }
  }, [token, router, hasHydrated]);

  const [form, setForm] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
  });

  const [editForm, setEditForm] = useState({
    id: '',
    username: '',
    name: '',
    email: '',
    status: 'ACTIVE',
    password: '',
  });

  const loadData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        usersAPI.getAll(query),
        rolesAPI.getAll(),
      ]);
      setUsers(usersRes.data.items);
      setMeta(usersRes.data.meta);
      setRoles(rolesRes.data);
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [query.page, query.limit, query.search]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      setShowCreateModal(false);
      setShowEditModal(false);
      setShowViewModal(false);
      setShowDeleteModal(false);
      setSelectedUser(null);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.username || form.username.trim().length < 3) {
      setNotification({ type: 'error', message: 'Username is required (min 3 chars)' });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setNotification({ type: 'error', message: 'Email format is invalid' });
      return;
    }

    if (!form.password || form.password.length < 6) {
      setNotification({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }

    try {
      setSubmittingCreate(true);
      await usersAPI.create(form);
      setNotification({ type: 'success', message: 'User created successfully' });
      setForm({ username: '', name: '', email: '', password: '' });
      setShowCreateModal(false);
      loadData();
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to create user' });
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser?.id) {
      return;
    }

    try {
      setDeletingUserId(selectedUser.id);
      await usersAPI.delete(selectedUser.id);
      setNotification({ type: 'success', message: 'User deleted successfully' });
      setShowDeleteModal(false);
      setSelectedUser(null);
      loadData();
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to delete user' });
    } finally {
      setDeletingUserId(null);
    }
  };

  const openDeleteModal = (user: any) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      await usersAPI.assignRole(userId, roleId);
      setNotification({ type: 'success', message: 'Role assigned successfully' });
      loadData();
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to assign role' });
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      await usersAPI.removeRole(userId, roleId);
      setNotification({ type: 'success', message: 'Role removed successfully' });
      loadData();
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to remove role' });
    }
  };

  const openViewModal = async (id: string) => {
    try {
      setLoadingViewId(id);
      const res = await usersAPI.getById(id);
      setSelectedUser(res.data);
      setShowViewModal(true);
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to load user detail' });
    } finally {
      setLoadingViewId(null);
    }
  };

  const openEditModal = async (id: string) => {
    try {
      const res = await usersAPI.getById(id);
      const data = res.data;

      setEditForm({
        id: data.id,
        username: data.username,
        name: data.name,
        email: data.email,
        status: data.status,
        password: '',
      });
      setShowEditModal(true);
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to load user for edit' });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editForm.username || editForm.username.trim().length < 3) {
      setNotification({ type: 'error', message: 'Username is required (min 3 chars)' });
      return;
    }

    if (!editForm.name || editForm.name.trim().length < 3) {
      setNotification({ type: 'error', message: 'Name is required (min 3 chars)' });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(editForm.email)) {
      setNotification({ type: 'error', message: 'Email format is invalid' });
      return;
    }

    if (editForm.password && editForm.password.length < 6) {
      setNotification({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }

    try {
      setSubmittingEdit(true);
      await usersAPI.update(editForm.id, {
        username: editForm.username,
        name: editForm.name,
        email: editForm.email,
        status: editForm.status,
        ...(editForm.password ? { password: editForm.password } : {}),
      });

      setNotification({ type: 'success', message: 'User updated successfully' });
      setShowEditModal(false);
      setEditForm({
        id: '',
        username: '',
        name: '',
        email: '',
        status: 'ACTIVE',
        password: '',
      });
      loadData();
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to update user' });
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleResetFilters = () => {
    setQuery((prev) => ({ ...prev, page: 1, search: '' }));
  };

  const hasActiveFilters = Boolean(query.search.trim());

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container py-6 md:py-8 space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">User Management</h1>
            <UserTopActions />
          </div>

          {notification && (
            <Notification
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          )}

          <section className="card">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className="input-field tooltip-trigger w-full sm:max-w-sm"
                  placeholder="Search users"
                  value={query.search}
                  onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, search: e.target.value }))}
                  data-tooltip="Filter user berdasarkan username, nama, atau email"
                />
                {hasActiveFilters ? (
                  <button
                    type="button"
                    className="tooltip-trigger inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    onClick={handleResetFilters}
                    data-tooltip="Reset filter user"
                    aria-label="Reset filter user"
                  >
                    <RotateCcw size={16} />
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                className="btn-primary tooltip-trigger inline-flex items-center gap-2"
                onClick={() => setShowCreateModal(true)}
                data-tooltip="Buat user baru"
              >
                <Plus size={16} />
                Create User
              </button>
            </div>

            {loading ? (
              <TableSkeleton rows={6} columns={7} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-2">Username</th>
                      <th className="text-left py-3 px-2">Name</th>
                      <th className="text-left py-3 px-2">Email</th>
                      <th className="text-left py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">Roles</th>
                      <th className="text-left py-3 px-2">Assign Role</th>
                      <th className="text-left py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-2">{user.username}</td>
                        <td className="py-3 px-2">{user.name}</td>
                        <td className="py-3 px-2">{user.email}</td>
                        <td className="py-3 px-2">{user.status}</td>
                        <td className="py-3 px-2">
                          <div className="flex flex-wrap gap-2">
                            {user.roles.map((role: any) => (
                              <button
                                key={role.id}
                                className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-xs text-sky-700"
                                onClick={() => handleRemoveRole(user.id, role.id)}
                              >
                                <ShieldCheck size={12} />
                                {role.roleName} x
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <select
                            className="input-field"
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignRole(user.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                          >
                            <option value="">Select role</option>
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>{role.roleName}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-2">
                          <TableActionsMenu
                            actions={[
                              {
                                label: loadingViewId === user.id ? 'Loading...' : 'View',
                                icon: Eye,
                                onClick: () => openViewModal(user.id),
                                className: 'text-sky-700 dark:text-sky-300',
                              },
                              {
                                label: 'Edit',
                                icon: Pencil,
                                onClick: () => openEditModal(user.id),
                                className: 'text-amber-700 dark:text-amber-300',
                              },
                              {
                                label: 'Delete',
                                icon: Trash2,
                                onClick: () => openDeleteModal(user),
                                className: 'text-rose-700 dark:text-rose-300',
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 flex flex-col items-center gap-3 md:flex-row md:justify-between">
                  <span className="text-sm order-1 md:order-none">Page {meta.page} of {Math.max(meta.totalPages, 1)}</span>
                  <div className="flex gap-2 order-3 md:order-none">
                    <button className="btn-secondary" disabled={meta.page <= 1} onClick={() => setQuery((prev) => ({ ...prev, page: prev.page - 1 }))}>Prev</button>
                    <button className="btn-secondary" disabled={meta.page >= meta.totalPages} onClick={() => setQuery((prev) => ({ ...prev, page: prev.page + 1 }))}>Next</button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {showViewModal && selectedUser && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => {
              setShowViewModal(false);
              setSelectedUser(null);
            }}>
              <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">View User</h2>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedUser(null);
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Username</p>
                    <p className="mt-1 font-medium text-slate-800">{selectedUser.username}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Name</p>
                    <p className="mt-1 font-medium text-slate-800">{selectedUser.name}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                    <p className="mt-1 font-medium text-slate-800">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                    <p className="mt-1">
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        {selectedUser.status}
                      </span>
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Roles</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedUser.roles?.length > 0 ? (
                        selectedUser.roles.map((role: any) => (
                          <span
                            key={role.id}
                            className="inline-flex items-center rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700"
                          >
                            {role.roleName}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">No roles assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedUser(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {showEditModal && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setShowEditModal(false)}>
              <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Edit User</h2>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    onClick={() => setShowEditModal(false)}
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Username *</label>
                    <input
                      className="input-field"
                      value={editForm.username}
                      onChange={(e) => setEditForm((p) => ({ ...p, username: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Name *</label>
                    <input
                      className="input-field"
                      value={editForm.name}
                      onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Email *</label>
                    <input
                      className="input-field"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Status *</label>
                    <select
                      className="input-field"
                      value={editForm.status}
                      onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium">New Password (optional)</label>
                    <input
                      className="input-field"
                      type="password"
                      placeholder="Leave empty if no change"
                      value={editForm.password}
                      onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2 mt-2 flex items-center justify-end gap-2">
                    <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                      Cancel
                    </button>
                    <button className="btn-primary" type="submit" disabled={submittingEdit}>
                      {submittingEdit ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showCreateModal && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setShowCreateModal(false)}>
              <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Create User</h2>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    onClick={() => setShowCreateModal(false)}
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Username *</label>
                    <input className="input-field" placeholder="Minimum 3 characters" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Name *</label>
                    <input className="input-field" placeholder="Full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Email *</label>
                    <input className="input-field" placeholder="user@company.com" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Password *</label>
                    <input className="input-field" placeholder="Minimum 6 characters" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
                  </div>

                  <div className="md:col-span-2 mt-2 flex items-center justify-end gap-2">
                    <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </button>
                    <button className="btn-primary" type="submit" disabled={submittingCreate}>
                      {submittingCreate ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showDeleteModal && selectedUser && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setShowDeleteModal(false)}>
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">Delete User</h2>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    <X size={16} />
                  </button>
                </div>

                <p className="text-sm text-slate-600">
                  Are you sure you want to delete user <span className="font-semibold text-slate-900">{selectedUser.name}</span>?
                </p>
                <p className="mt-1 text-xs text-slate-500">This action cannot be undone.</p>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                    disabled={deletingUserId === selectedUser.id}
                    onClick={handleDelete}
                  >
                    {deletingUserId === selectedUser.id ? 'Deleting...' : 'Delete User'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
