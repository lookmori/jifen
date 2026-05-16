'use client';
import { motion } from 'framer-motion';
import { timeAgo } from '@/lib/utils';
import type { PointRecord } from '@/types';

interface PointHistoryProps {
  records: PointRecord[];
  loading: boolean;
}

export function PointHistory({ records, loading }: PointHistoryProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-[var(--color-card-bg)] rounded-[var(--radius-md)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-text-secondary)]">
        <p className="text-3xl mb-2">📋</p>
        <p>暂无积分记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {records.map((r, i) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-card-bg)] border border-[var(--color-border)]"
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
            r.type === 'add' ? 'bg-[var(--color-success)]/10' : 'bg-[var(--color-danger)]/10'
          }`}>
            {r.type === 'add' ? '➕' : '➖'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--color-text)]">
              {r.reason}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {r.teacher_name && `${r.teacher_name} · `}{timeAgo(r.created_at)}
            </p>
          </div>
          <span className={`font-display font-bold text-lg ${r.type === 'add' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
            {r.type === 'add' ? '+' : '-'}{r.points_change}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
