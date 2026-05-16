'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Key, Shuffle } from 'lucide-react';

interface PromptModalProps {
  open: boolean;
  title: string;
  message?: string;
  label?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  showRandom?: boolean;
  onConfirm: (value: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export function PromptModal({
  open, title, message, label, defaultValue = '', confirmLabel = '确认', cancelLabel = '取消',
  showRandom, onConfirm, onClose, loading,
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);

  const handleOpen = () => {
    setValue(defaultValue);
  };

  // Reset value when modal opens
  if (open && value === '' && defaultValue) {
    // Only on first render
  }

  const generateRandom = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let pwd = '';
    for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setValue(pwd);
  };

  return (
    <Modal open={open} onClose={onClose} title="">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="w-16 h-16 mx-auto rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-2xl"
        >
          <Key size={28} className="text-[var(--color-primary)]" />
        </motion.div>

        <div>
          <h3 className="text-lg font-display font-bold text-[var(--color-text)]">{title}</h3>
          {message && <p className="text-sm text-[var(--color-text-secondary)] mt-1">{message}</p>}
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label={label}
              value={value}
              onChange={e => setValue(e.target.value)}
              autoFocus
            />
          </div>
          {showRandom && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={generateRandom}
              className="mb-0.5 px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-border)]
                         text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)]/20 cursor-pointer
                         flex items-center gap-1 text-xs font-bold"
            >
              <Shuffle size={14} />随机
            </motion.button>
          )}
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
          <Button onClick={() => onConfirm(value)} disabled={loading || !value.trim()}>
            {loading ? '处理中...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
