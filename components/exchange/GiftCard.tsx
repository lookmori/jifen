'use client';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface GiftItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  points_price: number;
  stock: number;
  emoji: string;
}

interface GiftCardProps {
  gift: GiftItem;
  index: number;
  studentPoints: number;
  canExchange: boolean;
  onExchange: (g: GiftItem) => void;
}

export function GiftCard({ gift, index, studentPoints, canExchange, onExchange }: GiftCardProps) {
  const affordable = studentPoints >= gift.points_price;
  const lowStock = gift.stock > 0 && gift.stock <= 5;

  return (
    <Card delay={index} hover>
      <div className="relative">
        {/* 图片区域 */}
        <div className="w-full aspect-[4/3] rounded-[var(--radius-md)] bg-[var(--color-border)] overflow-hidden mb-3">
          {gift.image_url ? (
            <img
              src={gift.image_url}
              alt={gift.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              {gift.emoji}
            </div>
          )}
        </div>

        {lowStock && (
          <span className="absolute top-2 right-2 bg-[var(--color-danger)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            仅剩 {gift.stock}
          </span>
        )}
      </div>

      <h3 className="font-display font-bold text-[var(--color-text)] text-sm truncate">
        {gift.emoji} {gift.name}
      </h3>
      <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
        {gift.description}
      </p>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
        <span className="font-display font-bold text-[var(--color-primary)] text-lg">
          ⭐ {gift.points_price}
        </span>
        <motion.button
          whileHover={canExchange ? { scale: 1.05 } : undefined}
          whileTap={canExchange ? { scale: 0.92 } : { x: [0, -3, 3, -3, 0] }}
          animate={!affordable && studentPoints > 0 ? { x: [0, -2, 2, 0] } : undefined}
          onClick={() => canExchange && onExchange(gift)}
          disabled={!canExchange}
          className={cn(
            'px-4 py-1.5 rounded-[var(--radius-sm)] text-sm font-bold cursor-pointer transition-all',
            affordable
              ? 'bg-[var(--color-primary)] text-white hover:brightness-110'
              : 'bg-[var(--color-border)] text-[var(--color-text-secondary)] cursor-not-allowed'
          )}
        >
          {affordable ? '兑换!' : '积分不足'}
        </motion.button>
      </div>
    </Card>
  );
}
