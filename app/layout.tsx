import type { Metadata } from 'next';
import { AuthProvider } from '@/components/layout/AuthProvider';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { ToastContainer } from '@/components/ui/Toast';
import { AppShell } from '@/components/layout/AppShell';
import './globals.css';

export const metadata: Metadata = {
  title: '积分乐园 - 积分兑换与记录平台',
  description: '一个充满趣味的课堂积分管理平台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="font-body antialiased min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
        <ThemeProvider>
          <AuthProvider>
            <AppShell>
              {children}
            </AppShell>
            <ToastContainer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
