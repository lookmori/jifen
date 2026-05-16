'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

const menuItems = [
  { href: '/dashboard', label: '仪表盘', emoji: '🏠' },
  { href: '/classes', label: '班级管理', emoji: '📚' },
  { href: '/exchange', label: '兑换小铺', emoji: '🎪' },
  { href: '/gifts', label: '礼物管理', emoji: '🎁' },
  { href: '/leaderboard', label: '排行榜', emoji: '🏆' },
  { href: '/records', label: '记录总览', emoji: '📊' },
];

const adminItems = [
  { href: '/admin/schools', label: '学校管理', emoji: '🏫' },
  { href: '/admin/teachers', label: '教师管理', emoji: '👨‍🏫' },
];

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const { session } = useAuth();
  const isAdmin = session?.role === 'admin';

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0, width: collapsed ? 72 : 240 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="fixed left-0 top-0 h-full bg-[var(--color-card-bg)] border-r border-[var(--color-border)] z-40 pt-20 pb-6 px-3 flex flex-col gap-1 overflow-hidden"
    >
      {menuItems.map((item, i) => (
        <SidebarItem key={item.href} {...item} active={pathname === item.href} collapsed={collapsed} delay={i * 0.05} />
      ))}

      {isAdmin && (
        <>
          <div className={cn('my-2', collapsed ? 'border-t border-[var(--color-border)]' : '')}>
            {!collapsed && (
              <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider px-3">
                管理员
              </span>
            )}
          </div>
          {adminItems.map((item, i) => (
            <SidebarItem key={item.href} {...item} active={pathname.startsWith(item.href)} collapsed={collapsed} delay={0.3 + i * 0.05} />
          ))}
        </>
      )}

      <div className="mt-auto">
        <SidebarItem href="/settings" label="设置" emoji="⚙️" active={pathname === '/settings'} collapsed={collapsed} delay={0.5} />
      </div>
    </motion.aside>
  );
}

function SidebarItem({ href, label, emoji, active, collapsed, delay }: {
  href: string; label: string; emoji: string; active: boolean; collapsed: boolean; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
    >
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] font-body font-bold text-sm',
          'transition-all duration-200 group',
          active
            ? 'bg-[var(--color-primary)] text-white shadow-md'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]'
        )}
      >
        <motion.span
          whileHover={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.4 }}
          className="text-xl shrink-0"
        >
          {emoji}
        </motion.span>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </Link>
    </motion.div>
  );
}
