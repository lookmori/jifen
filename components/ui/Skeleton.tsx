'use client';
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-[var(--color-card-bg)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-20 rounded-[var(--radius-sm)]" />
        <Skeleton className="h-9 w-20 rounded-[var(--radius-sm)]" />
      </div>
    </div>
  );
}
