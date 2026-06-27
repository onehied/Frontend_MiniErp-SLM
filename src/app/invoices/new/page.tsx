'use client';

import { invoicesAPI } from '@/lib/api-calls';
import CustomerSearchSelect, { CustomerOption } from '@/components/CustomerSearchSelect';
import { formatRupiah } from '@/lib/currency';
import {
  buildInvoiceFormData,
  validateInvoiceAttachment,
} from '@/lib/invoice-attachment';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import UserTopActions from '@/components/UserTopActions';
import Notification from '@/components/Notification';
import { ArrowLeft, Save } from 'lucide-react';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const { token, hasHydrated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [notification, setNotification] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    customerId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    discount: 0,
    notes: '',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState('');

  useEffect(() => {
    if (hasHydrated && !token) {
      router.push('/login');
    }
  }, [token, router, hasHydrated]);

  const validate = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.customerId) {
      errors.customerId = 'Customer is required';
    }

    items.forEach((item, index) => {
      if (!item.description.trim()) {
        errors[`item-${index}-description`] = 'Description is required';
      }
      if (item.quantity <= 0) {
        errors[`item-${index}-quantity`] = 'Quantity must be greater than 0';
      }
      if (item.unitPrice <= 0) {
        errors[`item-${index}-unitPrice`] = 'Unit price must be greater than 0';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'description' ? value : Number(value),
    };
    setItems(newItems);
    const errorKey = `item-${index}-${field}`;
    if (validationErrors[errorKey]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    return subtotal - Number(formData.discount);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const invoiceData = buildInvoiceFormData({
        ...formData,
        items,
        attachment: attachmentFile,
      });

      await invoicesAPI.create(invoiceData);
      setNotification({ type: 'success', message: 'Invoice created successfully' });
      setTimeout(() => {
        router.push('/invoices');
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to create invoice';
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      } else {
        setNotification({ type: 'error', message: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAttachmentChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] || null;
    setAttachmentError('');

    if (!file) {
      setAttachmentFile(null);
      return;
    }

    const errorMessage = validateInvoiceAttachment(file);
    if (errorMessage) {
      setAttachmentFile(null);
      setAttachmentError(errorMessage);
      event.target.value = '';
      return;
    }

    setAttachmentFile(file);
  };

  if (!hasHydrated) {
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
              Create New Invoice
            </h1>
            <UserTopActions />
          </div>

          <div className="card w-full">
            {notification && (
              <Notification
                type={notification.type}
                message={notification.message}
                onClose={() => setNotification(null)}
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Customer Selection */}
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-900 dark:text-white">
                  Customer *
                </label>
                <CustomerSearchSelect
                  value={selectedCustomer}
                  hasError={Boolean(validationErrors.customerId)}
                  placeholder="Cari customer..."
                  onChange={(option) => {
                    setSelectedCustomer(option);
                    setFormData((prev) => ({ ...prev, customerId: option?.value || '' }));
                    if (validationErrors.customerId) {
                      setValidationErrors((prev) => {
                        const nextErrors = { ...prev };
                        delete nextErrors.customerId;
                        return nextErrors;
                      });
                    }
                  }}
                />
                {validationErrors.customerId && (
                  <p className="error-text">{validationErrors.customerId}</p>
                )}
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-900 dark:text-white">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    name="issueDate"
                    value={formData.issueDate}
                    onChange={handleFormChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-900 dark:text-white">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleFormChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-900 dark:text-white">
                    Discount
                  </label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleFormChange}
                    className="input-field"
                    step="1000"
                  />
                  <p className="mt-1 text-xs text-slate-500">{formatRupiah(Number(formData.discount) || 0)}</p>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-slate-900 dark:text-white">
                    Invoice Items *
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="overflow-x-auto">
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
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(index, 'description', e.target.value)
                              }
                              className={`input-field ${validationErrors[`item-${index}-description`] ? 'invalid' : ''}`}
                              placeholder="Description"
                            />
                            {validationErrors[`item-${index}-description`] && (
                              <p className="error-text">
                                {validationErrors[`item-${index}-description`]}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(index, 'quantity', e.target.value)
                              }
                              className={`input-field ${validationErrors[`item-${index}-quantity`] ? 'invalid' : ''}`}
                              step="1"
                            />
                            {validationErrors[`item-${index}-quantity`] && (
                              <p className="error-text">
                                {validationErrors[`item-${index}-quantity`]}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(index, 'unitPrice', e.target.value)
                              }
                              className={`input-field ${validationErrors[`item-${index}-unitPrice`] ? 'invalid' : ''}`}
                              step="1000"
                              min="0"
                            />
                            <p className="mt-1 text-xs text-slate-500">
                              {formatRupiah(item.unitPrice)}
                            </p>
                            {validationErrors[`item-${index}-unitPrice`] && (
                              <p className="error-text">
                                {validationErrors[`item-${index}-unitPrice`]}
                              </p>
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-900 dark:text-white">
                            {formatRupiah(item.quantity * item.unitPrice)}
                          </td>
                          <td className="py-3 px-4">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:underline text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-900 dark:text-white">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  className="input-field"
                  rows={3}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-slate-900 dark:text-white">
                  Attachment
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
                  onChange={handleAttachmentChange}
                  className={`input-field ${attachmentError ? 'invalid' : ''}`}
                />
                <p className="mt-1 text-xs text-slate-500">
                  File PDF, JPG, JPEG. Maksimal 5 MB.
                </p>
                {attachmentFile ? (
                  <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                    File dipilih: {attachmentFile.name}
                  </p>
                ) : null}
                {attachmentError ? (
                  <p className="error-text">{attachmentError}</p>
                ) : null}
              </div>

              {/* Total */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center text-lg font-semibold text-slate-900 dark:text-white">
                  <span>Total:</span>
                  <span>
                    {formatRupiah(calculateTotal())}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-success flex items-center gap-2"
                >
                  <Save size={16} />
                  {loading ? 'Creating...' : 'Create Invoice'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/invoices')}
                  className="btn-back flex items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
