'use client';

import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { customersAPI } from '@/lib/api-calls';
import Link from 'next/link';
import Notification from '@/components/Notification';
import { downloadBase64File } from '@/lib/download';
import { ArrowUpDown, Eye, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import ExportMenu from '@/components/ExportMenu';
import UserTopActions from '@/components/UserTopActions';
import TableActionsMenu from '@/components/TableActionsMenu';
import TableSkeleton from '@/components/TableSkeleton';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
}

interface CustomersResponse {
  items: Customer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function CustomersPage() {
  const router = useRouter();
  const { token, hasHydrated } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (hasHydrated && !token) {
      router.push('/login');
    }
  }, [token, router, hasHydrated]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await customersAPI.getAll({
          page: meta.page,
          limit: meta.limit,
          search: search || undefined,
          sortBy,
          sortOrder,
        });
        const data = response.data as CustomersResponse;
        setCustomers(data.items);
        setMeta((prev) => ({ ...prev, ...data.meta }));
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        setNotification({ type: 'error', message: 'Failed to fetch customers' });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCustomers();
    }
  }, [token, meta.page, meta.limit, search, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(field);
    setSortOrder('asc');
  };

  const handleResetFilters = () => {
    setSearch('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = Boolean(search.trim()) || sortBy !== 'createdAt' || sortOrder !== 'desc';

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Delete this customer?');
    if (!confirmed) {
      return;
    }

    try {
      await customersAPI.delete(id);
      setNotification({ type: 'success', message: 'Customer deleted successfully' });
      setCustomers((prev) => prev.filter((item) => item.id !== id));
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to delete customer' });
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const response = await customersAPI.exportData(format, {
        search: search || undefined,
        sortBy,
        sortOrder,
      });

      const { contentBase64, fileName, mimeType } = response.data;
      downloadBase64File(contentBase64, fileName, mimeType);
      setNotification({ type: 'success', message: `Export ${format.toUpperCase()} created` });
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to export data' });
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container py-6 md:py-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">Customers</h1>
            <UserTopActions />
          </div>

          {notification && (
            <Notification
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          )}

          {loading ? (
            <TableSkeleton rows={6} columns={5} />
          ) : (
            <div className="card overflow-hidden">
              <div className="mb-4 flex flex-col gap-3 transition-all duration-300 ease-out lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-col gap-2 transition-all duration-300 ease-out sm:flex-row sm:items-center">
                  <input
                    className="input-field tooltip-trigger w-full sm:max-w-sm"
                    value={search}
                    onChange={(event) => {
                      setMeta((prev) => ({ ...prev, page: 1 }));
                      setSearch(event.target.value);
                    }}
                    placeholder="Search name/email/phone/city"
                    data-tooltip="Filter customer berdasarkan nama, email, phone, atau city"
                  />
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      className="tooltip-trigger inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                      onClick={handleResetFilters}
                      data-tooltip="Reset semua filter customer"
                      aria-label="Reset filter customer"
                    >
                      <RotateCcw size={16} />
                    </button>
                  ) : null}
                </div>

                <div className="flex items-center justify-end gap-2 transition-all duration-300 ease-out">
                  <ExportMenu onExport={handleExport} />
                  <Link href="/customers/new" className="btn-primary tooltip-trigger" data-tooltip="Tambah customer baru">
                    Add Customer
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">
                      <button type="button" className="flex items-center gap-2" onClick={() => handleSort('name')}>
                        Name <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      <button type="button" className="flex items-center gap-2" onClick={() => handleSort('email')}>
                        Email <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold hidden md:table-cell">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold hidden lg:table-cell">
                      <button type="button" className="flex items-center gap-2" onClick={() => handleSort('city')}>
                        City <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">{customer.name}</td>
                      <td className="py-3 px-4 text-gray-600">{customer.email}</td>
                      <td className="py-3 px-4 text-gray-600 hidden md:table-cell">{customer.phone}</td>
                      <td className="py-3 px-4 text-gray-600 hidden lg:table-cell">{customer.city}</td>
                      <td className="py-3 px-4">
                        <TableActionsMenu
                          actions={[
                            {
                              label: 'View',
                              icon: Eye,
                              onClick: () => router.push(`/customers/${customer.id}`),
                              className: 'text-sky-700 dark:text-sky-300',
                            },
                            {
                              label: 'Edit',
                              icon: Pencil,
                              onClick: () => router.push(`/customers/${customer.id}/edit`),
                              className: 'text-amber-700 dark:text-amber-300',
                            },
                            {
                              label: 'Delete',
                              icon: Trash2,
                              onClick: () => handleDelete(customer.id),
                              className: 'text-rose-700 dark:text-rose-300',
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <div className="mt-6 flex flex-col items-center gap-3 md:flex-row md:justify-between">
                <span className="text-sm text-slate-600 order-1 md:order-none">
                  Page {meta.page} of {Math.max(meta.totalPages, 1)}
                </span>

                <div className="flex items-center gap-2 order-3 md:order-none">
                  <button
                    type="button"
                    disabled={meta.page <= 1}
                    onClick={() => setMeta((prev) => ({ ...prev, page: prev.page - 1 }))}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setMeta((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>

              {customers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No customers found. Create your first customer!
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
