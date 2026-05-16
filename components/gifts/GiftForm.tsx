'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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

interface GiftFormProps {
  editGift: GiftItem | null;
  onSubmit: (data: {
    name: string;
    description: string;
    imageUrl: string;
    pointsPrice: number;
    stock: number;
    emoji: string;
  }) => Promise<void>;
  onClose: () => void;
  uploading: boolean;
}

export function GiftForm({ editGift, onSubmit, onClose, uploading }: GiftFormProps) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState(10);
  const [stock, setStock] = useState(-1);
  const [emoji, setEmoji] = useState('🎁');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editGift) {
      setName(editGift.name);
      setDesc(editGift.description || '');
      setImageUrl(editGift.image_url || '');
      setPrice(editGift.points_price);
      setStock(editGift.stock);
      setEmoji(editGift.emoji || '🎁');
    } else {
      setName('');
      setDesc('');
      setImageUrl('');
      setPrice(10);
      setStock(-1);
      setEmoji('🎁');
    }
  }, [editGift]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast('请输入礼物名称', 'error'); return; }
    setSubmitting(true);
    await onSubmit({
      name: name.trim(),
      description: desc.trim(),
      imageUrl: imageUrl.trim(),
      pointsPrice: price,
      stock,
      emoji,
    });
    setSubmitting(false);
  };

  const emojis = ['🎁', '🍭', '📓', '🧸', '🎨', '✏️', '🎈', '📚', '🎵', '🏀', '⚽', '🎮', '🧩', '🎲', '🖍️', '📎'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="礼物名称" value={name} onChange={e => setName(e.target.value)} placeholder="例如：棒棒糖" autoFocus />
      <Input label="描述" value={desc} onChange={e => setDesc(e.target.value)} placeholder="简短描述（可选）" />

      <div>
        <label className="block text-sm font-bold text-[var(--color-text)] mb-2">图片</label>
        <Input
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          placeholder="粘贴图片链接或上传"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Input
            label="所需积分"
            type="number"
            min={1}
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
          />
        </div>
        <div>
          <Input
            label="库存 (-1=无限)"
            type="number"
            min={-1}
            value={stock}
            onChange={e => setStock(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-[var(--color-text)] mb-2">表情图标</label>
        <div className="flex flex-wrap gap-2">
          {emojis.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`w-10 h-10 rounded-[var(--radius-sm)] text-xl cursor-pointer transition-all ${
                emoji === e ? 'bg-[var(--color-primary)] scale-110 shadow-md' : 'bg-[var(--color-border)] hover:bg-[var(--color-primary)]/20'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="ghost" onClick={onClose} type="button">取消</Button>
        <Button type="submit" disabled={submitting || uploading}>
          {submitting ? '保存中...' : editGift ? '保存修改' : '添加礼物'}
        </Button>
      </div>
    </form>
  );
}
