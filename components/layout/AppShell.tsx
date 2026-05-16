'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PixelPet } from './PixelPet';
import { FloatingBubbles } from './FloatingBubbles';
import { HolidayDecorations } from './HolidayDecorations';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const publicPaths = ['/login'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // 移动端自动折叠
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setSidebarCollapsed(!mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarCollapsed(!e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isPublic = publicPaths.includes(pathname);

  if (loading && !isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">🌟</div>
          <p className="text-lg font-display font-bold text-[var(--color-text-secondary)]">
            正在努力加载...
          </p>
        </div>
      </div>
    );
  }

  // 未登录跳转
  if (!session && !isPublic) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  // 登录页 — 无侧边栏
  if (isPublic) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <HolidayDecorations />
        {children}
        <PixelPet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Sidebar collapsed={sidebarCollapsed} />
      {/* 移动端遮罩 */}
      {!sidebarCollapsed && (
        <div className="md:hidden fixed inset-0 bg-black/30 z-30" onClick={() => setSidebarCollapsed(true)} />
      )}
      <Header collapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <HolidayDecorations />
      <FloatingBubbles />
      <main className={cn(
        'pt-16 min-h-screen transition-all duration-300',
        'ml-[72px] md:ml-[72px]',
        !sidebarCollapsed && 'md:ml-[240px]'
      )}>
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <PixelPet />
    </div>
  );
}
