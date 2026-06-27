import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mini ERP - Create Customer',
};

export default function CreateCustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
