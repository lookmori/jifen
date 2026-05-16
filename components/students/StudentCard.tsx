'use client';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Plus, Minus, FileText } from 'lucide-react';
import { getMilestone } from '@/lib/utils';
import Link from 'next/link';

interface StudentItem {
  id: string;
  name: string;
  points: number;
  avatar_emoji: string;
  class_name?: string;
  rank?: number;
  rankChange?: number;
}

interface StudentCardProps {
  student: StudentItem;
  index: number;
  onAdd: (s: StudentItem) => void;
  onDeduct: (s: StudentItem) => void;
}

export function StudentCard({ student, index, onAdd, onDeduct }: StudentCardProps) {
  const milestone = getMilestone(student.points);

  return (
    <Card delay={index} hover>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-2xl flex-shrink-0">
          {student.avatar_emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-[var(--color-text)] truncate">
              {student.name}
            </h3>
            {student.rank && (
              <span className="text-xs text-[var(--color-text-secondary)]">
                #{student.rank}
              </span>
            )}
            {student.rankChange && student.rankChange !== 0 && (
              <motion.span
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`text-xs ${student.rankChange > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}
              >
                {student.rankChange > 0 ? `↑${student.rankChange}` : `↓${Math.abs(student.rankChange)}`}
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <motion.span
              key={student.points}
              initial={{ scale: 1.3, color: 'var(--color-primary)' }}
              animate={{ scale: 1, color: 'var(--color-text-secondary)' }}
              className="text-sm font-bold"
            >
              ⭐ {student.points} 分
            </motion.span>
            {milestone && (
              <span className="text-xs" title={milestone.label}>{milestone.emoji}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--color-border)]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => onAdd(student)}
          className="flex-1 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-success)]/10
                     text-[var(--color-success)] font-bold text-sm cursor-pointer
                     hover:bg-[var(--color-success)]/20 flex items-center justify-center gap-1"
        >
          <Plus size={14} />加分
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => onDeduct(student)}
          className="flex-1 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-danger)]/10
                     text-[var(--color-danger)] font-bold text-sm cursor-pointer
                     hover:bg-[var(--color-danger)]/20 flex items-center justify-center gap-1"
        >
          <Minus size={14} />扣分
        </motion.button>
        <Link href={`/students/${student.id}`}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="px-2 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-border)]/50
                       text-[var(--color-text-secondary)] cursor-pointer
                       hover:bg-[var(--color-border)] flex items-center"
          >
            <FileText size={14} />
          </motion.div>
        </Link>
      </div>
    </Card>
  );
}
