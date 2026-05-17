'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { Minus, Plus } from 'lucide-react';
import { MomentImageUpload } from './MomentImageUpload';

interface ReasonPreset {
  id: string;
  label: string;
  type: 'add' | 'deduct';
}

interface StudentItem {
  id: string;
  name: string;
  points: number;
  avatar_emoji: string;
}

interface PointAdjustProps {
  open: boolean;
  student: StudentItem | null;
  onClose: () => void;
  onSubmit: (studentId: string, points: number, reason: string, type: 'add' | 'deduct', imageUrl?: string) => Promise<void>;
  presets: ReasonPreset[];
}

export function PointAdjust({ open, student, onClose, onSubmit, presets }: PointAdjustProps) {
  const [type, setType] = useState<'add' | 'deduct'>('add');
  const [points, setPoints] = useState(1);
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredPresets = presets.filter(p => p.type === type);

  useEffect(() => {
    if (open) {
      setType('add');
      setPoints(1);
      setReason('');
      setCustomReason('');
      setImageUrl('');
    }
  }, [open]);

  if (!student) return null;

  const finalReason = reason || customReason;
  const canSubmit = finalReason.trim() && points > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) { toast('请选择或输入原因', 'error'); return; }
    setSubmitting(true);
    await onSubmit(student.id, points, finalReason, type, imageUrl || undefined);
    setSubmitting(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`✨ 调整${student.name}积分`}>
      <div className="space-y-5">
        <div className="text-center">
          <span className="text-3xl">{student.avatar_emoji}</span>
          <p className="font-display font-bold text-[var(--color-text)] mt-1">
            {student.name}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            当前: ⭐ {student.points} 分
          </p>
        </div>

        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setType('add'); setReason(''); }}
            className={`flex-1 py-2.5 rounded-[var(--radius-md)] font-bold text-sm cursor-pointer transition-all ${
              type === 'add'
                ? 'bg-[var(--color-success)] text-white shadow-md scale-105'
                : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]'
            }`}
          >
            ➕ 加分
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setType('deduct'); setReason(''); }}
            className={`flex-1 py-2.5 rounded-[var(--radius-md)] font-bold text-sm cursor-pointer transition-all ${
              type === 'deduct'
                ? 'bg-[var(--color-danger)] text-white shadow-md scale-105'
                : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]'
            }`}
          >
            ➖ 扣分
          </motion.button>
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-text)] mb-2">分数</label>
          <div className="flex items-center justify-center gap-3">
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => setPoints(Math.max(1, points - 1))}
              className="w-10 h-10 rounded-full bg-[var(--color-border)] flex items-center justify-center cursor-pointer"
            >
              <Minus size={18} />
            </motion.button>
            <motion.span
              key={points}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-2xl font-display font-bold text-[var(--color-text)] w-12 text-center"
            >
              {points}
            </motion.span>
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => setPoints(points + 1)}
              className="w-10 h-10 rounded-full bg-[var(--color-border)] flex items-center justify-center cursor-pointer"
            >
              <Plus size={18} />
            </motion.button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-text)] mb-2">原因</label>
          {filteredPresets.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {filteredPresets.map(p => (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setReason(p.label); setCustomReason(''); }}
                  className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-bold cursor-pointer transition-all ${
                    reason === p.label
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)]/20'
                  }`}
                >
                  {p.label}
                </motion.button>
              ))}
            </div>
          )}
          <Input
            value={customReason}
            onChange={e => { setCustomReason(e.target.value); setReason(''); }}
            placeholder="或自定义原因..."
          />
        </div>

        {type === 'add' && (
          <MomentImageUpload
            imageUrl={imageUrl}
            onUploaded={setImageUrl}
            onRemove={() => setImageUrl('')}
          />
        )}

        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full" size="lg">
          {submitting ? '调整中...' : '✨ 确认调整'}
        </Button>
      </div>
    </Modal>
  );
}
