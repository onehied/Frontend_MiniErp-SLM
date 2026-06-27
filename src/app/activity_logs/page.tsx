'use client';

import Sidebar from '@/components/Sidebar';
import TableSkeleton from '@/components/TableSkeleton';
import UserTopActions from '@/components/UserTopActions';
import { activityLogsAPI } from '@/lib/api-calls';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface ActivityLogItem {
  id: string;
  action: string;
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  status: 'SUCCESS' | 'FAILED';
  message?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  method?: string | null;
  path?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email: string;
    username: string;
  } | null;
}

interface ActivityLogsResponse {
  items: ActivityLogItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function ActivityLogsPage() {
  const router = useRouter();
  const { token, user, hasHydrated } = useAuthStore();
  const [items, setItems] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [filters, setFilters] = useState({
    search: '',
    module: '',
    action: '',
    status: '',
  });

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!token) {
      router.push('/login');
      return;
    }

    if (!user?.roles?.includes('ADMIN')) {
      router.push('/dashboard');
    }
  }, [token, user, hasHydrated, router]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!token || !user?.roles?.includes('ADMIN')) {
        return;
      }

      try {
        setLoading(true);
        const response = await activityLogsAPI.getAll({
          page: meta.page,
          limit: meta.limit,
          search: filters.search || undefined,
          module: filters.module || undefined,
          action: filters.action || undefined,
          status: filters.status || undefined,
        });
        const data = response.data as ActivityLogsResponse;
        setItems(data.items);
        setMeta((prev) => ({ ...prev, ...data.meta }));
      } catch (error) {
        console.error('Failed to fetch activity logs:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (hasHydrated) {
      void fetchLogs();
    }
  }, [token, user, hasHydrated, meta.page, meta.limit, filters.search, filters.module, filters.action, filters.status]);

  const resetFilters = () => {
    setFilters({
      search: '',
      module: '',
      action: '',
      status: '',
    });
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.module || filters.action || filters.status,
  );

  if (!hasHydrated || (!token && !hasHydrated)) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container py-6 md:py-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
                Activity Logs
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Mencatat login, CRUD, navigasi, dan error dengan metadata fleksibel.
              </p>
            </div>
            <UserTopActions />
          </div>

          {loading ? (
            <TableSkeleton rows={6} columns={7} />
          ) : (
            <div className="card overflow-hidden">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-col gap-2 lg:flex-row lg:items-center">
                  <input
                    className="input-field w-full lg:max-w-xs"
                    value={filters.search}
                    onChange={(event) => {
                      setFilters((prev) => ({ ...prev, search: event.target.value }));
                      setMeta((prev) => ({ ...prev, page: 1 }));
                    }}
                    placeholder="Cari actor, action, module, message"
                  />
                  <select
                    className="input-field w-full lg:w-44"
                    value={filters.module}
                    onChange={(event) => {
                      setFilters((prev) => ({ ...prev, module: event.target.value }));
                      setMeta((prev) => ({ ...prev, page: 1 }));
                    }}
                  >
                    <option value="">Semua Module</option>
                    <option value="AUTH">AUTH</option>
                    <option value="CUSTOMERS">CUSTOMERS</option>
                    <option value="INVOICES">INVOICES</option>
                    <option value="USERS">USERS</option>
                    <option value="ROLES">ROLES</option>
                    <option value="NAVIGATION">NAVIGATION</option>
                    <option value="SYSTEM">SYSTEM</option>
                  </select>
                  <input
                    className="input-field w-full lg:w-44"
                    value={filters.action}
                    onChange={(event) => {
                      setFilters((prev) => ({ ...prev, action: event.target.value.toUpperCase() }));
                      setMeta((prev) => ({ ...prev, page: 1 }));
                    }}
                    placeholder="Action"
                  />
                  <select
                    className="input-field w-full lg:w-40"
                    value={filters.status}
                    onChange={(event) => {
                      setFilters((prev) => ({ ...prev, status: event.target.value }));
                      setMeta((prev) => ({ ...prev, page: 1 }));
                    }}
                  >
                    <option value="">Semua Status</option>
                    <option value="SUCCESS">SUCCESS</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      <RotateCcw size={16} />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                  <thead className="border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Waktu</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Actor</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Module</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Path</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Metadata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 align-top hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                          {new Date(item.createdAt).toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {item.actor?.name || 'System'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {item.actor?.email || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                          {item.module}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {item.action}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {item.entityType || '-'} {item.entityId ? `#${item.entityId}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.status === 'SUCCESS'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                            }`}
                          >
                            {item.status}
                          </span>
                          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            {item.message || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          <div>{item.method || '-'}</div>
                          <div className="mt-1 break-all">{item.path || '-'}</div>
                          <div className="mt-1">{item.ipAddress || '-'}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                          {item.metadata ? (
                            <details className="max-w-[360px]">
                              <summary className="cursor-pointer font-medium text-sky-600 dark:text-sky-300">
                                Lihat metadata
                              </summary>
                              <pre className="mt-2 overflow-auto rounded-xl bg-slate-950 p-3 text-[11px] text-slate-100">
                                {JSON.stringify(item.metadata, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-col items-center gap-3 md:flex-row md:justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Page {meta.page} of {Math.max(meta.totalPages, 1)}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={meta.page <= 1}
                    onClick={() => setMeta((prev) => ({ ...prev, page: prev.page - 1 }))}
                    className="btn-back disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setMeta((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className="btn-update disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Belum ada activity log yang tercatat.
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
