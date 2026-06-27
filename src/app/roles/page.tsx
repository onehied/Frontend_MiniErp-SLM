'use client';

import Sidebar from '@/components/Sidebar';
import Notification from '@/components/Notification';
import { rolesAPI } from '@/lib/api-calls';
import { useEffect, useState } from 'react';
import UserTopActions from '@/components/UserTopActions';
import { ArrowUpDown, Eye, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import TableActionsMenu from '@/components/TableActionsMenu';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import TableSkeleton from '@/components/TableSkeleton';

interface Role {
  id: string;
  roleName: string;
  description?: string;
  userRoles?: Array<{ id: string; user?: { id: string; name?: string; username?: string } }>;
}

export default function RolesPage() {
  const router = useRouter();
  const { token, hasHydrated } = useAuthStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [createForm, setCreateForm] = useState({ roleName: '', description: '' });
  const [editForm, setEditForm] = useState({ id: '', roleName: '', description: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState<'roleName' | 'description' | 'users'>('roleName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (hasHydrated && !token) {
      router.push('/login');
    }
  }, [token, router, hasHydrated]);

  const filteredRoles = roles.filter((role) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return true;
    }

    return (
      String(role.roleName || '').toLowerCase().includes(keyword) ||
      String(role.description || '').toLowerCase().includes(keyword)
    );
  });

  const sortedRoles = [...filteredRoles].sort((a, b) => {
    const direction = sortOrder === 'asc' ? 1 : -1;

    if (sortBy === 'users') {
      const aValue = a.userRoles?.length ?? 0;
      const bValue = b.userRoles?.length ?? 0;
      return (aValue - bValue) * direction;
    }

    const aValue = String(a[sortBy] || '').toLowerCase();
    const bValue = String(b[sortBy] || '').toLowerCase();

    if (aValue < bValue) {
      return -1 * direction;
    }
    if (aValue > bValue) {
      return 1 * direction;
    }

    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedRoles.length / limit));
  const currentPage = Math.min(page, totalPages);
  const paginatedRoles = sortedRoles.slice((currentPage - 1) * limit, currentPage * limit);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await rolesAPI.getAll();
      setRoles(response.data);
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to load roles' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, sortOrder]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      setShowCreateModal(false);
      setShowViewModal(false);
      setShowEditModal(false);
      setShowDeleteModal(false);
      setSelectedRole(null);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const hasActiveFilters = Boolean(search.trim()) || sortBy !== 'roleName' || sortOrder !== 'asc';

  const handleSort = (field: 'roleName' | 'description' | 'users') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(field);
    setSortOrder('asc');
  };

  const handleResetFilters = () => {
    setSearch('');
    setSortBy('roleName');
    setSortOrder('asc');
    setPage(1);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createForm.roleName || createForm.roleName.trim().length < 2) {
      setNotification({ type: 'error', message: 'Role name is required (min 2 chars)' });
      return;
    }

    try {
      setSubmittingCreate(true);
      await rolesAPI.create({
        roleName: createForm.roleName.trim(),
        description: createForm.description.trim(),
      });
      setCreateForm({ roleName: '', description: '' });
      setShowCreateModal(false);
      setNotification({ type: 'success', message: 'Role created successfully' });
      loadRoles();
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to create role' });
    } finally {
      setSubmittingCreate(false);
    }
  };

  const openViewModal = (role: Role) => {
    setSelectedRole(role);
    setShowViewModal(true);
  };

  const openEditModal = (role: Role) => {
    setEditForm({
      id: role.id,
      roleName: role.roleName || '',
      description: role.description || '',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (role: Role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editForm.roleName || editForm.roleName.trim().length < 2) {
      setNotification({ type: 'error', message: 'Role name is required (min 2 chars)' });
      return;
    }

    try {
      setSubmittingEdit(true);
      await rolesAPI.update(editForm.id, {
        roleName: editForm.roleName.trim(),
        description: editForm.description.trim(),
      });
      setNotification({ type: 'success', message: 'Role updated successfully' });
      setShowEditModal(false);
      setEditForm({ id: '', roleName: '', description: '' });
      loadRoles();
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to update role' });
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingRoleId(id);
      await rolesAPI.delete(id);
      setNotification({ type: 'success', message: 'Role deleted successfully' });
      setShowDeleteModal(false);
      setSelectedRole(null);
      loadRoles();
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to delete role' });
    } finally {
      setDeletingRoleId(null);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container py-6 md:py-8 space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">Hak Akses (Role User)</h1>
            <UserTopActions />
          </div>

          {notification && (
            <Notification
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          )}

          <section className="card overflow-x-auto">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className="input-field tooltip-trigger w-full sm:max-w-sm"
                  placeholder="Search role name/description"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-tooltip="Filter hak akses berdasarkan nama atau deskripsi"
                />
                {hasActiveFilters ? (
                  <button
                    type="button"
                    className="tooltip-trigger inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    onClick={handleResetFilters}
                    data-tooltip="Reset filter hak akses"
                    aria-label="Reset filter hak akses"
                  >
                    <RotateCcw size={16} />
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                className="btn-primary tooltip-trigger inline-flex items-center gap-2"
                onClick={() => setShowCreateModal(true)}
                data-tooltip="Buat hak akses baru"
              >
                <Plus size={16} />
                Create Hak Akses
              </button>
            </div>

            <table className="w-full min-w-[680px]">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-2 text-left font-semibold text-slate-800 dark:text-slate-100">
                    <button type="button" className="inline-flex items-center gap-2" onClick={() => handleSort('roleName')}>
                      Role Name <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="py-3 px-2 text-left font-semibold text-slate-800 dark:text-slate-100">
                    <button type="button" className="inline-flex items-center gap-2" onClick={() => handleSort('description')}>
                      Description <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="py-3 px-2 text-left font-semibold text-slate-800 dark:text-slate-100">
                    <button type="button" className="inline-flex items-center gap-2" onClick={() => handleSort('users')}>
                      Assigned Users <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="py-3 px-2 text-left font-semibold text-slate-800 dark:text-slate-100">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4}>
                      <TableSkeleton rows={5} columns={4} />
                    </td>
                  </tr>
                ) : sortedRoles.length === 0 ? (
                  <tr>
                    <td className="py-8 text-center text-slate-500" colSpan={4}>No roles found</td>
                  </tr>
                ) : (
                  paginatedRoles.map((role) => (
                    <tr key={role.id} className="border-b">
                      <td className="py-3 px-2 font-semibold">{role.roleName}</td>
                      <td className="py-3 px-2">{role.description || '-'}</td>
                      <td className="py-3 px-2">{role.userRoles?.length ?? 0}</td>
                      <td className="py-3 px-2">
                        <TableActionsMenu
                          actions={[
                            {
                              label: 'View',
                              icon: Eye,
                              onClick: () => openViewModal(role),
                              className: 'text-sky-700 dark:text-sky-300',
                            },
                            {
                              label: 'Edit',
                              icon: Pencil,
                              onClick: () => openEditModal(role),
                              className: 'text-amber-700 dark:text-amber-300',
                            },
                            {
                              label: 'Delete',
                              icon: Trash2,
                              onClick: () => openDeleteModal(role),
                              className: 'text-rose-700 dark:text-rose-300',
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="mt-4 flex flex-col items-center gap-3 md:flex-row md:justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Page {currentPage} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-secondary disabled:opacity-50"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn-secondary disabled:opacity-50"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          {showCreateModal && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setShowCreateModal(false)}>
              <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Create Hak Akses</h2>
                  <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setShowCreateModal(false)}>
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Role Name *</label>
                    <input
                      className="input-field"
                      placeholder="Role name (ex: ADMIN)"
                      value={createForm.roleName}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, roleName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
                    <input
                      className="input-field"
                      placeholder="Description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </button>
                    <button className="btn-primary" type="submit" disabled={submittingCreate}>
                      {submittingCreate ? 'Saving...' : 'Save Role'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showViewModal && selectedRole && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => {
              setShowViewModal(false);
              setSelectedRole(null);
            }}>
              <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">View Hak Akses</h2>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedRole(null);
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Role Name</p>
                    <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">{selectedRole.roleName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Description</p>
                    <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">{selectedRole.description || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Assigned Users</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(selectedRole.userRoles?.length || 0) > 0 ? (
                        selectedRole.userRoles?.map((entry) => (
                          <span key={entry.id} className="inline-flex items-center rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">
                            {entry.user?.name || entry.user?.username || 'User'}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500 dark:text-slate-300">No assigned users</span>
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
                      setSelectedRole(null);
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
              <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Edit Hak Akses</h2>
                  <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setShowEditModal(false)}>
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Role Name</label>
                    <input
                      className="input-field"
                      value={editForm.roleName}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, roleName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
                    <input
                      className="input-field"
                      value={editForm.description}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
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

          {showDeleteModal && selectedRole && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setShowDeleteModal(false)}>
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Delete Hak Akses</h2>
                  <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setShowDeleteModal(false)}>
                    <X size={16} />
                  </button>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Are you sure you want to delete role <span className="font-semibold text-slate-900 dark:text-white">{selectedRole.roleName}</span>?
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>

                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                    disabled={deletingRoleId === selectedRole.id}
                    onClick={() => handleDelete(selectedRole.id)}
                  >
                    {deletingRoleId === selectedRole.id ? 'Deleting...' : 'Delete Role'}
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
