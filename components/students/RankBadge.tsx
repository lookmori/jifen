'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RankBadgeProps {
  rank: number;
  rankChange?: number;
  className?: string;
}

const rankColors: Record<number, string> = {
  1: 'from-yellow-400 to-orange-500 text-white',
  2: 'from-gray-300 to-gray-400 text-gray-700',
  3: 'from-amber-500 to-amber-600 text-white',
};

const rankEmojis: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export function RankBadge({ rank, rankChange, className }: RankBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold',
        rank <= 3
          ? `bg-gradient-to-r ${rankColors[rank]}`
          : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]',
        className
      )}
    >
      {rank <= 3 ? rankEmojis[rank] : `#${rank}`}
      {rankChange && rankChange !== 0 && (
        <motion.span
          initial={{ y: -5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`text-[10px] ${rankChange > 0 ? 'text-green-200' : 'text-red-200'}`}
        >
          {rankChange > 0 ? `↑${rankChange}` : `↓${Math.abs(rankChange)}`}🚀
        </motion.span>
      )}
    </motion.div>
  );
}
