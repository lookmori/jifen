'use client';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function Select({ value, onChange, options, placeholder = '请选择...', className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-[var(--radius-md)]',
          'border-2 border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] font-body text-sm',
          'focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
          'transition-all duration-200 cursor-pointer',
          !selected && 'text-[var(--color-text-secondary)]'
        )}
      >
        <span>{selected?.label || placeholder}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-[var(--color-text-secondary)]" />
        </motion.span>
      </motion.button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="absolute z-50 mt-1 w-full rounded-[var(--radius-md)] border-2 border-[var(--color-border)]
                     bg-[var(--color-card-bg)] shadow-xl max-h-60 overflow-y-auto py-1"
        >
          {options.map((opt, i) => (
            <motion.button
              key={opt.value}
              type="button"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                'w-full text-left px-4 py-2.5 text-sm font-body cursor-pointer transition-colors',
                opt.value === value
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-border)]'
              )}
            >
              {opt.label}
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
