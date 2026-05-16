'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  shimmer?: boolean;
  children: ReactNode;
}

const variants = {
  primary: 'bg-[var(--color-primary)] text-white hover:brightness-110',
  secondary: 'bg-[var(--color-secondary)] text-[var(--color-text)] hover:brightness-105',
  success: 'bg-[var(--color-success)] text-white hover:brightness-110',
  danger: 'bg-[var(--color-danger)] text-white hover:brightness-110',
  ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-[var(--radius-sm)]',
  md: 'px-5 py-2.5 text-base rounded-[var(--radius-md)]',
  lg: 'px-8 py-3.5 text-lg rounded-[var(--radius-lg)]',
};

export function Button({ variant = 'primary', size = 'md', shimmer, className, children, ...props }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={cn(
        'font-display font-bold inline-flex items-center justify-center gap-2 cursor-pointer',
        'transition-colors duration-200 select-none',
        variants[variant],
        sizes[size],
        shimmer && 'btn-shimmer',
        className
      )}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
