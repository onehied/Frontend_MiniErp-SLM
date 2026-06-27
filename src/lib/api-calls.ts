import api from '@/lib/axios';

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  module?: string;
  action?: string;
}

export const authAPI = {
  register: (username: string, email: string, name: string, password: string) =>
    api.post('/auth/register', { username, email, name, password }),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  refresh: (refresh_token: string) =>
    api.post('/auth/refresh', { refresh_token }, { skipAuthRefresh: true } as any),

  loginWithGoogle: (idToken: string) =>
    api.post('/auth/google/login', { idToken }),

  getMe: () =>
    api.get('/auth/me'),

  updateProfile: (payload: { username?: string; name?: string; phone?: string; avatarUrl?: string }) =>
    api.patch('/auth/profile', payload),

  uploadProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/profile/upload-image', formData);
  },

  linkGoogle: (idToken: string) =>
    api.post('/auth/google/link', { idToken }),

  unlinkGoogle: () =>
    api.post('/auth/google/unlink'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

export const customersAPI = {
  getAll: (params?: ListQuery) => api.get('/customers', { params }),

  getById: (id: string) => api.get(`/customers/${id}`),

  create: (data: any) => api.post('/customers', data),

  update: (id: string, data: any) => api.patch(`/customers/${id}`, data),

  delete: (id: string) => api.delete(`/customers/${id}`),

  exportData: (format: 'csv' | 'excel' | 'pdf', params?: ListQuery) =>
    api.get('/customers/export/data', { params: { ...params, format } }),
};

export const invoicesAPI = {
  getAll: (params?: ListQuery) => api.get('/invoices', { params }),

  getById: (id: string) => api.get(`/invoices/${id}`),

  create: (data: any) => api.post('/invoices', data),

  update: (id: string, data: any) => api.patch(`/invoices/${id}`, data),

  getAttachment: (id: string) =>
    api.get(`/invoices/${id}/attachment`, { responseType: 'blob' }),

  updateStatus: (id: string, status: string) =>
    api.patch(`/invoices/${id}/status`, { status }),

  addItem: (invoiceId: string, item: any) =>
    api.post(`/invoices/${invoiceId}/items`, item),

  removeItem: (invoiceId: string, itemId: string) =>
    api.delete(`/invoices/${invoiceId}/items/${itemId}`),

  getByCustomer: (customerId: string) =>
    api.get(`/invoices/by-customer/${customerId}`),

  delete: (id: string) => api.delete(`/invoices/${id}`),

  exportData: (format: 'csv' | 'excel' | 'pdf', params?: ListQuery) =>
    api.get('/invoices/export/data', { params: { ...params, format } }),
};

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),

  getRecentInvoices: (limit?: number) =>
    api.get('/dashboard/recent-invoices', { params: { limit } }),

  getRecentCustomers: (limit?: number) =>
    api.get('/dashboard/recent-customers', { params: { limit } }),

  getMonthlyRevenue: () => api.get('/dashboard/monthly-revenue'),
};

export const usersAPI = {
  getAll: (params?: ListQuery) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  assignRole: (id: string, roleId: string) => api.post(`/users/${id}/roles`, { roleId }),
  removeRole: (id: string, roleId: string) => api.delete(`/users/${id}/roles/${roleId}`),
};

export const rolesAPI = {
  getAll: () => api.get('/roles'),
  getById: (id: string) => api.get(`/roles/${id}`),
  create: (data: any) => api.post('/roles', data),
  update: (id: string, data: any) => api.patch(`/roles/${id}`, data),
  delete: (id: string) => api.delete(`/roles/${id}`),
};

export const activityLogsAPI = {
  getAll: (params?: ListQuery) => api.get('/activity-logs', { params }),
};
