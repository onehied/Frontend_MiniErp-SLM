'use client';

import Sidebar from '@/components/Sidebar';
import UserTopActions from '@/components/UserTopActions';
import { useAuthStore } from '@/store/auth';
import { invoicesAPI } from '@/lib/api-calls';
import { formatRupiah } from '@/lib/currency';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Edit } from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  discount: number;
  notes?: string;
  issueDate: string;
  dueDate?: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  customer: { id: string; name: string };
  items: InvoiceItem[];
  createdAt: string;
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { token, hasHydrated } = useAuthStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [downloadingAttachment, setDownloadingAttachment] = useState(false);

  useEffect(() => {
    if (hasHydrated && !token) {
      router.push('/login');
    }
  }, [token, router, hasHydrated]);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await invoicesAPI.getById(params.id as string);
        setInvoice(response.data);
      } catch (error) {
        console.error('Failed to fetch invoice:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvoice();
    }
  }, [token, params.id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!invoice) return;

    setStatusUpdating(true);
    try {
      const response = await invoicesAPI.updateStatus(invoice.id, newStatus);
      setInvoice(response.data);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const handleDownloadAttachment = async () => {
    if (!invoice?.attachmentName) {
      return;
    }

    try {
      setDownloadingAttachment(true);
      const response = await invoicesAPI.getAttachment(invoice.id);
      const blob = new Blob([response.data], {
        type: invoice.attachmentMimeType || 'application/octet-stream',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = invoice.attachmentName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloadingAttachment(false);
    }
  };

  if (!hasHydrated || loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container py-6 md:py-8">
            <div className="text-center py-12">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container py-6 md:py-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
                Invoice {invoice?.invoiceNumber}
              </h1>
            </div>
            <UserTopActions />
          </div>

          {invoice && (
            <>
              <div className="card mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-slate-600 dark:text-slate-300 mb-2">
                      Customer: {invoice.customer.name}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 mb-2">
                      Issue Date: {new Date(invoice.issueDate).toLocaleDateString()}
                    </p>
                    {invoice.dueDate && (
                      <p className="text-slate-600 dark:text-slate-300">
                        Due Date: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className={`px-4 py-2 rounded-xl font-semibold ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>

              {/* Status Update */}
              <div className="card mb-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['DRAFT', 'SENT', 'PAID', 'CANCELLED'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={statusUpdating || invoice.status === status}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                        invoice.status === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Invoice Items */}
              <div className="card mb-6 overflow-x-auto">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Items</h3>
                <table className="w-full">
                  <thead className="border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                        Description
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                        Qty
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                        Unit Price
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-3 px-4 text-slate-900 dark:text-white">{item.description}</td>
                        <td className="py-3 px-4 text-slate-900 dark:text-white">{item.quantity}</td>
                        <td className="py-3 px-4 text-slate-900 dark:text-white">
                          {formatRupiah(item.unitPrice)}
                        </td>
                        <td className="py-3 px-4 text-slate-900 dark:text-white font-semibold">
                          {formatRupiah(item.quantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 flex justify-end">
                  <div className="w-full md:w-64">
                    {invoice.discount > 0 && (
                      <div className="flex justify-between py-2 text-slate-600 dark:text-slate-300">
                        <span>Discount:</span>
                        <span>-{formatRupiah(invoice.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-lg text-slate-900 dark:text-white">
                      <span>Total:</span>
                      <span>{formatRupiah(invoice.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <div className="card mb-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Notes</h3>
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}

              {invoice.attachmentUrl && invoice.attachmentName && invoice.attachmentMimeType && (
                <div className="card mb-6">
                  <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Attachment</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {invoice.attachmentName}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={invoice.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-update"
                      >
                        {invoice.attachmentMimeType === 'application/pdf' ? 'Lihat PDF' : 'Lihat Gambar'}
                      </a>
                      <button
                        type="button"
                        onClick={handleDownloadAttachment}
                        disabled={downloadingAttachment}
                        className="btn-back inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Download size={16} />
                        {downloadingAttachment ? 'Downloading...' : 'Download'}
                      </button>
                    </div>
                  </div>

                  {invoice.attachmentMimeType === 'application/pdf' ? (
                    <iframe
                      src={invoice.attachmentUrl}
                      title="Invoice attachment PDF"
                      className="h-[520px] w-full rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={invoice.attachmentUrl}
                      alt={invoice.attachmentName}
                      className="max-h-[520px] w-full rounded-xl border border-slate-200 object-contain dark:border-slate-700"
                    />
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Link href="/invoices" className="btn-back flex items-center gap-2">
                  <ArrowLeft size={16} />
                  Back
                </Link>
                <Link href={`/invoices/${invoice.id}/edit`} className="btn-update flex items-center gap-2">
                  <Edit size={16} />
                  Edit Invoice
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
