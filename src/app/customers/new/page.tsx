'use client';

import { customersAPI } from '@/lib/api-calls';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Notification from '@/components/Notification';
import UserTopActions from '@/components/UserTopActions';
import { ArrowLeft, Save } from 'lucide-react';

interface ValidationErrors {
  [key: string]: string;
}

export default function CreateCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const validate = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters';
    }
    
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Email format is invalid';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      await customersAPI.create(formData);
      setNotification({ type: 'success', message: 'Customer created successfully' });
      setTimeout(() => {
        router.push('/customers');
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to create customer';
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      } else {
        setNotification({ type: 'error', message: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container py-6 md:py-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Add New Customer
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

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input-field ${validationErrors.name ? 'invalid' : ''}`}
                  />
                  {validationErrors.name && (
                    <p className="error-text">{validationErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Email
                  </label>
                  <input
                    type="text"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input-field ${validationErrors.email ? 'invalid' : ''}`}
                  />
                  {validationErrors.email && (
                    <p className="error-text">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`input-field ${validationErrors.phone ? 'invalid' : ''}`}
                  />
                  {validationErrors.phone && (
                    <p className="error-text">{validationErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`input-field ${validationErrors.city ? 'invalid' : ''}`}
                  />
                  {validationErrors.city && (
                    <p className="error-text">{validationErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`input-field ${validationErrors.state ? 'invalid' : ''}`}
                  />
                  {validationErrors.state && (
                    <p className="error-text">{validationErrors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className={`input-field ${validationErrors.zipCode ? 'invalid' : ''}`}
                  />
                  {validationErrors.zipCode && (
                    <p className="error-text">{validationErrors.zipCode}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`input-field ${validationErrors.address ? 'invalid' : ''}`}
                />
                {validationErrors.address && (
                  <p className="error-text">{validationErrors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`input-field ${validationErrors.country ? 'invalid' : ''}`}
                />
                {validationErrors.country && (
                  <p className="error-text">{validationErrors.country}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={loading} className="btn-success flex items-center gap-2">
                  <Save size={16} />
                  {loading ? 'Saving...' : 'Save Customer'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/customers')}
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
