'use client';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface GiftItem {
  id: string;
  name: string;
  emoji: string;
  image_url: string;
  points_price: number;
  description: string;
}

interface StudentItem {
  id: string;
  name: string;
  points: number;
  avatar_emoji: string;
}

interface ExchangeModalProps {
  open: boolean;
  gift: GiftItem | null;
  student: StudentItem | null;
  exchanging: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ExchangeModal({ open, gift, student, exchanging, onConfirm, onClose }: ExchangeModalProps) {
  if (!gift || !student) return null;

  const canAfford = student.points >= gift.points_price;
  const afterPoints = student.points - gift.points_price;

  return (
    <Modal open={open} onClose={onClose} title="🎪 确认兑换">
      <div className="space-y-5 text-center">
        <div>
          <div className="w-20 h-20 mx-auto rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-4xl">
            {gift.emoji}
          </div>
          <h3 className="font-display font-bold text-[var(--color-text)] mt-2 text-lg">
            {gift.name}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {gift.description}
          </p>
        </div>

        <div className="flex justify-center items-center gap-4 p-3 rounded-[var(--radius-md)] bg-[var(--color-bg)]">
          <div className="text-center">
            <p className="text-xs text-[var(--color-text-secondary)]">学生</p>
            <p className="font-bold text-[var(--color-text)]">{student.avatar_emoji} {student.name}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--color-text-secondary)]">当前积分</p>
            <p className="font-bold text-[var(--color-text)]">⭐ {student.points}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            消耗 <span className="font-bold text-[var(--color-primary)]">⭐ {gift.points_price} 分</span>
          </p>
          {canAfford ? (
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-sm mt-1 text-[var(--color-success)] font-bold"
            >
              兑换后余额: ⭐ {afterPoints} 分
            </motion.p>
          ) : (
            <motion.p
              initial={{ x: -5 }}
              animate={{ x: [0, -3, 3, -3, 0] }}
              className="text-sm mt-1 text-[var(--color-danger)] font-bold"
            >
              ⚠️ 积分不足！还差 ⭐ {gift.points_price - student.points} 分
            </motion.p>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">再想想</Button>
          {canAfford ? (
            <Button onClick={onConfirm} disabled={exchanging} className="flex-1" shimmer>
              {exchanging ? '兑换中...' : '✨ 确认兑换'}
            </Button>
          ) : (
            <Button variant="secondary" onClick={onClose} className="flex-1">
              去加分
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
