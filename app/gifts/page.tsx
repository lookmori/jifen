'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { RainbowDivider } from '@/components/ui/RainbowDivider';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { toast } from '@/components/ui/Toast';
import { compressImage } from '@/lib/image';
import { useAuth } from '@/hooks/useAuth';
import type { Pagination as PaginationType } from '@/types';

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

export default function GiftsPage() {
  const { isAdmin } = useAuth();
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editGift, setEditGift] = useState<GiftItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formPrice, setFormPrice] = useState(10);
  const [formStock, setFormStock] = useState(-1);
  const [formEmoji, setFormEmoji] = useState('🎁');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GiftItem | null>(null);

  const fetchGifts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '12', search, showInactive: String(showInactive) });
      const res = await fetch(`/api/gifts?${params}`);
      const data = await res.json();
      if (data.success) { setGifts(data.data); setPagination(data.pagination); }
    } catch { toast('加载礼物失败', 'error'); }
    finally { setLoading(false); }
  }, [page, search, showInactive]);

  useEffect(() => { fetchGifts(); }, [fetchGifts]);

  const resetForm = () => {
    setFormName(''); setFormDesc(''); setFormImageUrl(''); setFormPrice(10); setFormStock(-1); setFormEmoji('🎁');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formImageUrl.trim()) { toast('请填写名称和图片地址', 'error'); return; }
    setSubmitting(true);
    const url = editGift ? `/api/gifts/${editGift.id}` : '/api/gifts';
    const method = editGift ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), description: formDesc.trim(), imageUrl: formImageUrl.trim(), pointsPrice: formPrice, stock: formStock, emoji: formEmoji }),
      });
      const data = await res.json();
      if (data.success) {
        toast(editGift ? '礼物已更新 ✏️' : '礼物已创建 🎁', 'success');
        setShowForm(false); fetchGifts();
      } else toast(data.error || '操作失败', 'error');
    } catch { toast('操作失败', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressed);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setFormImageUrl(data.data.url);
        toast('图片上传成功！📷', 'success');
      } else toast(data.error || '上传失败', 'error');
    } catch { toast('上传失败', 'error'); }
    finally { setUploading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/gifts/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast('礼物已删除 🗑️', 'info'); setDeleteTarget(null); fetchGifts(); }
      else toast(data.error || '删除失败', 'error');
    } catch { toast('删除失败', 'error'); }
    setSubmitting(false);
  };

  const handleToggleActive = async (g: GiftItem) => {
    try {
      const res = await fetch(`/api/gifts/${g.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !g.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        toast(g.is_active ? '已下架 📦' : '已上架 🎉', 'success');
        fetchGifts();
      } else toast(data.error || '操作失败', 'error');
    } catch { toast('操作失败', 'error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">🎁 礼物管理</h1>
        {isAdmin && <Button variant="primary" size="sm" onClick={() => { setEditGift(null); resetForm(); setShowForm(true); }}>+ 添加礼物</Button>}
      </div>

      <div className="flex gap-3 flex-wrap">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="搜索礼物..." className="flex-1 min-w-[200px]" />
        <Button variant={showInactive ? 'primary' : 'secondary'} size="sm" onClick={() => { setShowInactive(!showInactive); setPage(1); }}>
          {showInactive ? '👁 显示全部' : '📦 含下架'}
        </Button>
      </div>

      <RainbowDivider />

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : gifts.length === 0 ? (
        <EmptyState emoji="🎁" title="还没有礼物哦~" description="点击「添加礼物」开始添加兑换奖品吧！" />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {gifts.map((g, i) => (
                <motion.div key={g.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className={!g.is_active ? 'opacity-60' : ''}>
                    <div className="flex items-center gap-3 mb-3">
                      {g.image_url ? (
                        <img src={g.image_url} alt={g.name} className="w-16 h-16 rounded-[var(--radius-md)] object-cover border-2 border-[var(--color-border)]" />
                      ) : (
                        <span className="text-4xl">{g.emoji}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-[var(--color-text)] truncate">{g.name}</h3>
                        <p className="text-lg font-display font-bold text-[var(--color-primary)]">⭐ {g.points_price} 分</p>
                        {g.stock >= 0 && <p className="text-xs text-[var(--color-text-secondary)]">库存: {g.stock}</p>}
                      </div>
                    </div>
                    {g.description && <p className="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-2">{g.description}</p>}
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" className="flex-1" onClick={() => { setEditGift(g); setFormName(g.name); setFormDesc(g.description || ''); setFormImageUrl(g.image_url); setFormPrice(g.points_price); setFormStock(g.stock); setFormEmoji(g.emoji); setShowForm(true); }}>✏️ 编辑</Button>
                        <Button variant={g.is_active ? 'secondary' : 'success'} size="sm" onClick={() => handleToggleActive(g)}>
                          {g.is_active ? '📦' : '🎉'}
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(g)}>🗑️</Button>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editGift ? '✏️ 编辑礼物' : '🎁 添加礼物'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="礼物名称" value={formName} onChange={e => setFormName(e.target.value)} placeholder="例如：卡通铅笔" autoFocus />
          <div>
            <label className="text-sm font-bold text-[var(--color-text-secondary)] mb-1.5 block">图片上传</label>
            <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading}
              className="w-full text-sm text-[var(--color-text-secondary)] file:mr-3 file:py-2 file:px-4 file:rounded-[var(--radius-md)] file:border-0 file:bg-[var(--color-primary)] file:text-white file:font-bold file:cursor-pointer" />
            {uploading && <p className="text-xs text-[var(--color-text-secondary)] mt-1">上传中...</p>}
          </div>
          <Input label="或粘贴图片地址 (URL)" type="text" value={formImageUrl} onChange={e => setFormImageUrl(e.target.value)} placeholder="上传后自动填入，或粘贴 https://..." />
          {formImageUrl && (
            <img src={formImageUrl} alt="预览" className="w-24 h-24 rounded-[var(--radius-md)] object-cover border-2 border-[var(--color-border)]" />
          )}
          <div>
            <label className="text-sm font-bold text-[var(--color-text-secondary)] mb-1.5 block">描述</label>
            <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} placeholder="礼物描述（可选）"
              className="w-full px-4 py-2.5 rounded-[var(--radius-md)] border-2 border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] resize-none focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input label="所需积分" type="number" value={formPrice} onChange={e => setFormPrice(Math.max(1, parseInt(e.target.value) || 1))} />
            </div>
            <div className="flex-1">
              <Input label="库存 (-1=无限)" type="number" value={formStock} onChange={e => setFormStock(parseInt(e.target.value) || -1)} />
            </div>
          </div>
          <Input label="Emoji" value={formEmoji} onChange={e => setFormEmoji(e.target.value)} maxLength={4} className="text-2xl text-center" />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>取消</Button>
            <Button type="submit" variant="primary" disabled={submitting || !formName.trim() || !formImageUrl.trim()}>
              {submitting ? '保存中...' : editGift ? '保存修改' : '确认添加'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        title={`确定删除「${deleteTarget?.name || ''}」吗？`}
        message="该礼物的兑换记录将被保留，此操作不可恢复。"
        variant="danger"
        confirmLabel="确认删除"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={submitting}
      />
    </div>
  );
}
