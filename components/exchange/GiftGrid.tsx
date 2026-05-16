'use client';
import { GiftCard } from './GiftCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';

interface GiftItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  points_price: number;
  stock: number;
  emoji: string;
}

interface GiftGridProps {
  gifts: GiftItem[];
  loading: boolean;
  studentPoints: number;
  onExchange: (g: GiftItem) => void;
}

export function GiftGrid({ gifts, loading, studentPoints, onExchange }: GiftGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (gifts.length === 0) {
    return (
      <EmptyState
        emoji="🎁"
        title="礼物架空空如也"
        description="暂时没有可兑换的礼物，去管理页添加一些吧~"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {gifts.map((g, i) => (
        <GiftCard
          key={g.id}
          gift={g}
          index={i}
          studentPoints={studentPoints}
          canExchange={studentPoints >= g.points_price && g.stock !== 0}
          onExchange={onExchange}
        />
      ))}
    </div>
  );
}
