'use client';
import { motion } from 'framer-motion';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, CheckCircle, Trash2, Ban } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

const icons = {
  danger: Trash2,
  warning: AlertTriangle,
  info: CheckCircle,
};

const iconColors = {
  danger: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
  warning: 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]',
  info: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
};

export function ConfirmModal({
  open, title, message, confirmLabel = '确认', cancelLabel = '取消',
  variant = 'info', onConfirm, onClose, loading,
}: ConfirmModalProps) {
  const Icon = icons[variant];

  return (
    <Modal open={open} onClose={onClose} title="">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${iconColors[variant]}`}
        >
          <Icon size={28} />
        </motion.div>

        <h3 className="text-lg font-display font-bold text-[var(--color-text)]">{title}</h3>
        <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line">{message}</p>

        <div className="flex gap-3 justify-center pt-2">
          <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '处理中...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
