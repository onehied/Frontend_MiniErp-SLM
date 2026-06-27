'use client';

import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { invoicesAPI } from '@/lib/api-calls';
import { formatRupiah } from '@/lib/currency';
import Link from 'next/link';
import Notification from '@/components/Notification';
import { downloadBase64File } from '@/lib/download';
import { ArrowUpDown, Eye, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import ExportMenu from '@/components/ExportMenu';
import UserTopActions from '@/components/UserTopActions';
import TableActionsMenu from '@/components/TableActionsMenu';
import TableSkeleton from '@/components/TableSkeleton';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: { name: string };
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface InvoicesResponse {
  items: Invoice[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function InvoicesPage() {
  const router = useRouter();
  const { token, hasHydrated } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (hasHydrated && !token) {
      router.push('/login');
    }
  }, [token, router, hasHydrated]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await invoicesAPI.getAll({
          page: meta.page,
          limit: meta.limit,
          search: search || undefined,
          status: status || undefined,
          sortBy,
          sortOrder,
        });
        const data = response.data as InvoicesResponse;
        setInvoices(data.items);
        setMeta((prev) => ({ ...prev, ...data.meta }));
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
        setNotification({ type: 'error', message: 'Failed to fetch invoices' });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvoices();
    }
  }, [token, meta.page, meta.limit, search, status, sortBy, sortOrder]);

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
    setStatus('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = Boolean(search.trim()) || Boolean(status) || sortBy !== 'createdAt' || sortOrder !== 'desc';

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this invoice?')) {
      return;
    }

    try {
      await invoicesAPI.delete(id);
      setNotification({ type: 'success', message: 'Invoice deleted successfully' });
      setInvoices((prev) => prev.filter((item) => item.id !== id));
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to delete invoice' });
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const response = await invoicesAPI.exportData(format, {
        search: search || undefined,
        status: status || undefined,
        sortBy,
        sortOrder,
      });
      const { contentBase64, fileName, mimeType } = response.data;
      downloadBase64File(contentBase64, fileName, mimeType);
      setNotification({ type: 'success', message: `Export ${format.toUpperCase()} created` });
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to export invoice data' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container py-6 md:py-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">Invoices</h1>
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
            <TableSkeleton rows={6} columns={6} />
          ) : (
            <div className="card overflow-hidden">
              <div className="mb-4 flex flex-col gap-3 transition-all duration-300 ease-out lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-col gap-2 transition-all duration-300 ease-out lg:flex-row lg:items-center">
                  <input
                    className="input-field tooltip-trigger w-full lg:max-w-xs"
                    value={search}
                    onChange={(event) => {
                      setMeta((prev) => ({ ...prev, page: 1 }));
                      setSearch(event.target.value);
                    }}
                    placeholder="Search invoice/customer"
                    data-tooltip="Filter invoice berdasarkan nomor invoice atau customer"
                  />
                  <select
                    className="input-field tooltip-trigger w-full lg:w-48"
                    value={status}
                    onChange={(event) => {
                      setMeta((prev) => ({ ...prev, page: 1 }));
                      setStatus(event.target.value);
                    }}
                    data-tooltip="Filter invoice berdasarkan status"
                  >
                    <option value="">All Status</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="SENT">SENT</option>
                    <option value="PAID">PAID</option>
                    <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                    <option value="OVERDUE">OVERDUE</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      className="tooltip-trigger inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                      onClick={handleResetFilters}
                      data-tooltip="Reset semua filter invoice"
                      aria-label="Reset filter invoice"
                    >
                      <RotateCcw size={16} />
                    </button>
                  ) : null}
                </div>

                <div className="flex items-center justify-end gap-2 transition-all duration-300 ease-out">
                  <ExportMenu onExport={handleExport} />
                  <Link href="/invoices/new" className="btn-primary tooltip-trigger" data-tooltip="Buat invoice baru">
                    Create Invoice
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">
                      <button type="button" className="flex items-center gap-2" onClick={() => handleSort('invoiceNumber')}>
                        Invoice # <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold">
                      <button type="button" className="flex items-center gap-2" onClick={() => handleSort('totalAmount')}>
                        Amount <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      <button type="button" className="flex items-center gap-2" onClick={() => handleSort('status')}>
                        Status <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold hidden md:table-cell">
                      <button type="button" className="flex items-center gap-2" onClick={() => handleSort('createdAt')}>
                        Date <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="py-3 px-4">{invoice.customer.name}</td>
                      <td className="py-3 px-4 font-semibold">
                        {formatRupiah(invoice.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <TableActionsMenu
                          actions={[
                            {
                              label: 'View',
                              icon: Eye,
                              onClick: () => router.push(`/invoices/${invoice.id}`),
                              className: 'text-sky-700 dark:text-sky-300',
                            },
                            {
                              label: 'Edit',
                              icon: Pencil,
                              onClick: () => router.push(`/invoices/${invoice.id}/edit`),
                              className: 'text-emerald-700 dark:text-emerald-300',
                            },
                            {
                              label: 'Delete',
                              icon: Trash2,
                              onClick: () => handleDelete(invoice.id),
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

              {invoices.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No invoices found. Create your first invoice!
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
