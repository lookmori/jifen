'use client';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Edit, Eye, EyeOff, Infinity } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

interface GiftItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  points_price: number;
  stock: number;
  emoji: string;
  is_active: boolean;
}

interface GiftManageListProps {
  gifts: GiftItem[];
  loading: boolean;
  showInactive: boolean;
  onEdit: (g: GiftItem) => void;
  onToggle: (id: string) => Promise<void>;
  onToggleShowInactive: () => void;
}

export function GiftManageList({ gifts, loading, showInactive, onEdit, onToggle, onToggleShowInactive }: GiftManageListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (gifts.length === 0) {
    return (
      <EmptyState
        emoji="🎁"
        title="还没有礼物哦"
        description="添加第一个礼物，兑换系统就开张啦~"
      />
    );
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button variant="ghost" size="sm" onClick={onToggleShowInactive}>
          {showInactive ? <EyeOff size={14} className="mr-1" /> : <Eye size={14} className="mr-1" />}
          {showInactive ? '隐藏已下架' : '显示已下架'}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gifts.map((g, i) => (
          <Card key={g.id} delay={i} hover>
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-[var(--radius-md)] bg-[var(--color-border)] flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
                {g.image_url ? (
                  <img src={g.image_url} alt={g.name} className="w-full h-full object-cover" />
                ) : (
                  g.emoji
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-[var(--color-text)] truncate">
                  {g.emoji} {g.name}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                  ⭐ {g.points_price} 分
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  库存: {g.stock === -1 ? <><Infinity size={10} className="inline" /> 不限</> : `${g.stock} 件`}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    g.is_active ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
                  }`}>
                    {g.is_active ? '上架中' : '已下架'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 mt-3 pt-3 border-t border-[var(--color-border)]">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onEdit(g)}
                className="flex-1 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)]/10
                           text-[var(--color-primary)] font-bold text-xs cursor-pointer
                           hover:bg-[var(--color-primary)]/20 flex items-center justify-center gap-1"
              >
                <Edit size={12} />编辑
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onToggle(g.id)}
                className={`flex-1 py-1.5 rounded-[var(--radius-sm)] font-bold text-xs cursor-pointer flex items-center justify-center gap-1 ${
                  g.is_active
                    ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/20'
                    : 'bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20'
                }`}
              >
                {g.is_active ? <><EyeOff size={12} />下架</> : <><Eye size={12} />上架</>}
              </motion.button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
