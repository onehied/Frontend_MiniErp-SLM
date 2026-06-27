export function validateInvoiceAttachment(file: File) {
  const allowedTypes = ['application/pdf', 'image/jpeg'];

  if (!allowedTypes.includes(file.type)) {
    return 'File harus PDF, JPG, atau JPEG.';
  }

  if (file.size > 5 * 1024 * 1024) {
    return 'Ukuran file maksimal 5 MB.';
  }

  return '';
}

export function buildInvoiceFormData(payload: {
  customerId: string;
  issueDate?: string;
  dueDate?: string;
  discount?: number | string;
  notes?: string;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  attachment?: File | null;
  removeAttachment?: boolean;
}) {
  const formData = new FormData();
  formData.append('customerId', payload.customerId);
  formData.append('issueDate', payload.issueDate || '');
  formData.append('dueDate', payload.dueDate || '');
  formData.append('discount', String(payload.discount ?? 0));
  formData.append('notes', payload.notes || '');
  formData.append('items', JSON.stringify(payload.items));
  formData.append('removeAttachment', payload.removeAttachment ? 'true' : 'false');

  if (payload.attachment) {
    formData.append('attachment', payload.attachment);
  }

  return formData;
}
