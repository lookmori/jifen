'use client';
import { motion } from 'framer-motion';
import { Menu, Sun, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getTimeGreeting, getHolidayOverride } from '@/lib/holidays';

interface HeaderProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
}

export function Header({ collapsed, onToggleSidebar }: HeaderProps) {
  const { session, logout } = useAuth();
  const holiday = getHolidayOverride();
  const greeting = session ? getTimeGreeting(session.name) : '';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--color-card-bg)]/80 backdrop-blur-md border-b border-[var(--color-border)] z-30 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggleSidebar}
          className="p-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] cursor-pointer"
        >
          <Menu size={22} />
        </motion.button>
        <span className="text-xl font-display font-bold text-[var(--color-text)] hidden sm:block">
          🌟 积分乐园
        </span>
        {holiday && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-lg"
          >
            {holiday.emoji}
          </motion.span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {session && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-text-secondary)] hidden md:block">
              {greeting}
            </span>
            <span className="text-2xl">{session.role === 'admin' ? '👑' : '🧑‍🏫'}</span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={logout}
              className="text-xs font-bold text-[var(--color-danger)] hover:underline cursor-pointer"
            >
              退出
            </motion.button>
          </div>
        )}
      </div>
    </header>
  );
}
