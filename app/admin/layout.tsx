'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { School, Users, ArrowLeft } from 'lucide-react';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin/schools', label: '学校管理', emoji: '🏫', icon: School },
  { href: '/admin/teachers', label: '教师管理', emoji: '👨‍🏫', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!session || !isAdmin)) {
      router.replace('/dashboard');
    }
  }, [session, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!session || !isAdmin) return null;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* 头部 */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full bg-[var(--color-card-bg)] border border-[var(--color-border)]
                       flex items-center justify-center cursor-pointer hover:border-[var(--color-primary)]"
          >
            <ArrowLeft size={18} className="text-[var(--color-text-secondary)]" />
          </motion.div>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">
            ⚙️ 管理后台
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            管理学校和教师账号
          </p>
        </div>
      </div>

      {/* 导航标签 */}
      <div className="flex gap-2 mb-6">
        {navItems.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'px-5 py-2.5 rounded-[var(--radius-lg)] font-bold text-sm cursor-pointer transition-all flex items-center gap-2',
                  active
                    ? 'bg-[var(--color-primary)] text-white shadow-md'
                    : 'bg-[var(--color-card-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)]'
                )}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* 页面内容 */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
