import type { Metadata } from 'next';
import '../globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import HydrationWrapper from '@/components/HydrationWrapper';
import { Toaster } from 'sonner';
import IdleSessionManager from '@/components/IdleSessionManager';
import NavigationTracker from '@/components/NavigationTracker';

export const metadata: Metadata = {
  title: 'SLM Mini ERP - Invoicing System',
  description: 'Sinarmas LDA Maritime ERP portal built with Next.js and NestJS',
  icons: {
    icon: '/slm-favicon.png',
    apple: '/slm-favicon.png',
    shortcut: '/slm-favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <HydrationWrapper>
            {children}
            <Toaster richColors position="top-right" />
            <IdleSessionManager />
            <NavigationTracker />
          </HydrationWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
