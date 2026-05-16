'use client';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Pagination as PaginationType } from '@/types';

interface PaginationProps {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages, total } = pagination;

  if (totalPages <= 1) return null;

  const pages = getPageRange(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <span className="text-xs text-[var(--color-text-secondary)] mr-2 font-body">
        共 {total} 条
      </span>

      <PageBtn onClick={() => onPageChange(1)} disabled={page === 1}>
        <ChevronsLeft size={16} />
      </PageBtn>
      <PageBtn onClick={() => onPageChange(page - 1)} disabled={page === 1}>
        <ChevronLeft size={16} />
      </PageBtn>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="px-2 text-[var(--color-text-secondary)]">...</span>
        ) : (
          <motion.button
            key={p}
            whileTap={{ scale: 0.9 }}
            onClick={() => onPageChange(p)}
            className={cn(
              'w-9 h-9 rounded-[var(--radius-sm)] font-bold text-sm cursor-pointer transition-colors',
              p === page
                ? 'bg-[var(--color-primary)] text-white shadow-md'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
            )}
          >
            {p}
          </motion.button>
        )
      )}

      <PageBtn onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
        <ChevronRight size={16} />
      </PageBtn>
      <PageBtn onClick={() => onPageChange(totalPages)} disabled={page === totalPages}>
        <ChevronsRight size={16} />
      </PageBtn>
    </div>
  );
}

function PageBtn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.9 }}
      onClick={disabled ? undefined : onClick}
      className={cn(
        'w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center cursor-pointer transition-colors',
        disabled
          ? 'text-[var(--color-border)] cursor-not-allowed'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
      )}
    >
      {children}
    </motion.button>
  );
}

function getPageRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}
