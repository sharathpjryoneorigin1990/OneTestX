import '@/styles/globals.css';
import type { Metadata } from 'next';
import { MainLayout } from '@/components/layout/MainLayout';
import { ToastProvider } from '@/components/ui/toast-provider';

export const metadata: Metadata = {
  title: 'OneTest X by OneOrigin',
  description: 'Next-gen testing platform with AI-powered automation for comprehensive test coverage across multiple frameworks',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <ToastProvider>
          <MainLayout>{children}</MainLayout>
        </ToastProvider>
      </body>
    </html>
  );
}
