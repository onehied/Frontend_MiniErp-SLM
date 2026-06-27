import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mini ERP - Create Invoice',
};

export default function CreateInvoiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
