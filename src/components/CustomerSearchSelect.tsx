'use client';

import { customersAPI } from '@/lib/api-calls';
import AsyncSelect from 'react-select/async';

export interface CustomerOption {
  value: string;
  label: string;
}

interface CustomerSearchSelectProps {
  value: CustomerOption | null;
  onChange: (option: CustomerOption | null) => void;
  placeholder?: string;
  hasError?: boolean;
}

async function loadCustomerOptions(inputValue: string) {
  const response = await customersAPI.getAll({
    page: 1,
    limit: 20,
    search: inputValue || undefined,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const customers = response.data?.items || [];

  return customers.map((customer: { id: string; name: string }) => ({
    value: customer.id,
    label: customer.name,
  }));
}

export default function CustomerSearchSelect({
  value,
  onChange,
  placeholder = 'Cari customer...',
  hasError = false,
}: CustomerSearchSelectProps) {
  return (
    <AsyncSelect<CustomerOption, false>
      cacheOptions
      defaultOptions
      loadOptions={loadCustomerOptions}
      value={value}
      onChange={(option) => onChange(option)}
      placeholder={placeholder}
      noOptionsMessage={({ inputValue }) =>
        inputValue ? 'Customer tidak ditemukan' : 'Tidak ada data customer'
      }
      className="text-sm"
      styles={{
        control: (base, state) => ({
          ...base,
          minHeight: 36,
          borderRadius: 12,
          borderColor: hasError ? '#ef4444' : state.isFocused ? '#3b82f6' : '#cbd5e1',
          boxShadow: 'none',
          paddingLeft: 4,
          paddingRight: 4,
          backgroundColor: 'transparent',
          '&:hover': {
            borderColor: hasError ? '#ef4444' : '#94a3b8',
          },
        }),
        valueContainer: (base) => ({
          ...base,
          paddingTop: 2,
          paddingBottom: 2,
          paddingLeft: 8,
          paddingRight: 8,
        }),
        placeholder: (base) => ({
          ...base,
          color: '#94a3b8',
        }),
        input: (base) => ({
          ...base,
          color: '#0f172a',
        }),
        singleValue: (base) => ({
          ...base,
          color: '#0f172a',
        }),
        menu: (base) => ({
          ...base,
          borderRadius: 12,
          overflow: 'hidden',
          zIndex: 30,
        }),
        option: (base, state) => ({
          ...base,
          fontSize: 14,
          backgroundColor: state.isFocused ? '#f1f5f9' : '#ffffff',
          color: '#0f172a',
          cursor: 'pointer',
        }),
      }}
    />
  );
}
