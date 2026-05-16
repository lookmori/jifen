'use client';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Search, Shuffle } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onRandom?: () => void;
  className?: string;
}

export function SearchInput({ placeholder = '搜搜看...', value, onChange, onRandom, className }: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const debounced = useDebounce(local, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // 同步外部 value 变化（如选择学生后回填名称）
  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    onChangeRef.current(debounced);
  }, [debounced]);

  // Ctrl+K 快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className={cn('relative', className)}>
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
      <input
        ref={inputRef}
        type="text"
        value={local}
        onChange={e => setLocal(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 rounded-[var(--radius-md)] border-2 border-[var(--color-border)]
                  bg-[var(--color-bg)] text-[var(--color-text)] font-body text-sm
                  focus:outline-none focus:border-[var(--color-primary)] transition-colors"
      />
      {onRandom && (
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={onRandom}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] cursor-pointer"
          title="随机一个"
        >
          <Shuffle size={16} />
        </motion.button>
      )}
      <AnimatePresence>
        {local && (
          <motion.span
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-text-secondary)] bg-[var(--color-card-bg)] px-1.5 py-0.5 rounded"
          >
            ⌘K
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
