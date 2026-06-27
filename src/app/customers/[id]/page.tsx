'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { customersAPI } from '@/lib/api-calls';
import Notification from '@/components/Notification';
import UserTopActions from '@/components/UserTopActions';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await customersAPI.getById(params.id as string);
        setCustomer(response.data);
      } catch (error: any) {
        setNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to load customer' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params.id]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container py-6 md:py-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-semibold">Customer Detail</h1>
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
            <div>Loading...</div>
          ) : customer ? (
            <div className="card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Name:</strong> {customer.name}</div>
                <div><strong>Email:</strong> {customer.email || '-'}</div>
                <div><strong>Phone:</strong> {customer.phone || '-'}</div>
                <div><strong>City:</strong> {customer.city || '-'}</div>
                <div><strong>Address:</strong> {customer.address || '-'}</div>
                <div><strong>Country:</strong> {customer.country || '-'}</div>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => router.push(`/customers/${customer.id}/edit`)} className="btn-primary">
                  Edit
                </button>
                <button type="button" onClick={() => router.push('/customers')} className="btn-secondary">
                  Back
                </button>
              </div>
            </div>
          ) : (
            <div className="card">Customer not found</div>
          )}
        </div>
      </main>
    </div>
  );
}
