'use client';
import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export function Input({ label, icon, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
            {icon}
          </span>
        )}
        <input
          className={cn(
            'w-full px-4 py-2.5 rounded-[var(--radius-md)] border-2 border-[var(--color-border)]',
            'bg-[var(--color-bg)] text-[var(--color-text)] font-body',
            'focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
            'transition-all duration-200 placeholder:text-[var(--color-text-secondary)]/50',
            icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
    </div>
  );
}
