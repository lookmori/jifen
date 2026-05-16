import { cn } from '@/lib/utils';

export function RainbowDivider({ className }: { className?: string }) {
  return <hr className={cn('rainbow-divider', className)} />;
}
