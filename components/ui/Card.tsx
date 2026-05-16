'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  onClick?: () => void;
}

export function Card({ children, className, hover = true, delay = 0, onClick }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={hover ? { y: -6, rotate: 0.5, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        'bg-[var(--color-card-bg)] rounded-[var(--radius-lg)] border border-[var(--color-border)]',
        'p-5 transition-shadow duration-200',
        hover && 'card-hover',
        onClick && 'cursor-pointer ripple',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
