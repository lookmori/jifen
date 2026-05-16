import { cn } from '@/lib/utils';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ emoji = '🐾', title, description, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <span className="text-6xl mb-4 animate-bounce">{emoji}</span>
      <h3 className="text-lg font-display font-bold text-[var(--color-text)]">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">{description}</p>
      )}
    </div>
  );
}
