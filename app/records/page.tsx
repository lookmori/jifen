'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { RainbowDivider } from '@/components/ui/RainbowDivider';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { toast } from '@/components/ui/Toast';
import type { Pagination as PaginationType } from '@/types';

interface MergedRecord {
  id: string;
  student_id: string;
  student_name: string;
  student_emoji: string;
  type?: string;
  points_change?: number;
  points_spent?: number;
  reason?: string;
  gift_name?: string;
  gift_emoji?: string;
  gift_image_url?: string;
  created_at: string;
  recordType: string;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<MergedRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<MergedRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20', type: filterType });
      const res = await fetch(`/api/records?${params}`);
      const data = await res.json();
      if (data.success) { setRecords(data.data); setPagination(data.pagination); }
    } catch { toast('加载记录失败', 'error'); }
    finally { setLoading(false); }
  }, [page, filterType]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/records', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id, recordType: deleteTarget.recordType }),
      });
      const data = await res.json();
      if (data.success) {
        toast('记录已删除', 'info');
        setDeleteTarget(null);
        fetchRecords();
      } else toast(data.error || '删除失败', 'error');
    } catch { toast('删除失败', 'error'); }
    finally { setDeleting(false); }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setBatchDeleting(true);
    let failed = 0;
    for (const id of selectedIds) {
      const record = records.find(r => r.id === id);
      if (!record) continue;
      try {
        const res = await fetch('/api/records', {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: record.id, recordType: record.recordType }),
        });
        const data = await res.json();
        if (!data.success) failed++;
      } catch { failed++; }
    }
    if (failed === 0) toast(`已删除 ${selectedIds.size} 条记录`, 'info');
    else toast(`删除 ${selectedIds.size - failed}/${selectedIds.size} 条，${failed} 条失败`, 'error');
    setSelectedIds(new Set());
    setBatchDeleting(false);
    fetchRecords();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin} 分钟前`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} 小时前`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${diffDay} 天前`;
    return d.toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">📊 记录总览</h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: '📋 全部' },
          { key: 'add', label: '⭐ 加分' },
          { key: 'deduct', label: '📉 扣分' },
          { key: 'exchange', label: '🎁 兑换' },
        ].map(t => (
          <Button key={t.key} variant={filterType === t.key ? 'primary' : 'secondary'} size="sm"
            onClick={() => { setFilterType(t.key); setPage(1); }}>{t.label}</Button>
        ))}
      </div>

      <RainbowDivider />

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-[var(--color-primary)]/10 rounded-[var(--radius-md)] border-2 border-[var(--color-primary)]">
          <span className="text-sm font-bold text-[var(--color-text)]">已选 {selectedIds.size} 条</span>
          <Button variant="danger" size="sm" onClick={handleBatchDelete} disabled={batchDeleting}>
            {batchDeleting ? '删除中...' : '🗑️ 批量删除'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>取消选择</Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : records.length === 0 ? (
        <EmptyState emoji="📋" title="暂无记录" description="积分变动和兑换记录会显示在这里" />
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1">
            <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] cursor-pointer select-none">
              <input type="checkbox" checked={selectedIds.size === records.length && records.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded accent-[var(--color-primary)] cursor-pointer" />
              全选
            </label>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {records.map((r, i) => (
                <motion.div key={`${r.recordType}-${r.id}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="w-4 h-4 rounded accent-[var(--color-primary)] cursor-pointer shrink-0" />
                      <span className="text-2xl">{r.student_emoji || '👨‍🎓'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--color-text)]">{r.student_name}</span>
                          {r.recordType === 'exchange' ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold">兑换</span>
                          ) : r.recordType === 'add' ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] font-bold">加分</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-danger)]/10 text-[var(--color-danger)] font-bold">扣分</span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                          {r.recordType === 'exchange'
                            ? <>兑换了 {r.gift_emoji} <strong>{r.gift_name}</strong></>
                            : <>{r.reason}</>
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <motion.p
                          key={`${r.id}-pts`}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          className={`text-lg font-display font-bold ${
                            r.recordType === 'exchange' ? 'text-[var(--color-primary)]' :
                            r.recordType === 'add' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                          }`}
                        >
                          {r.recordType === 'exchange'
                            ? <>-{r.points_spent}</>
                            : <>{r.points_change && r.points_change > 0 ? '+' : ''}{r.points_change}</>
                          } 分
                        </motion.p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{formatTime(r.created_at)}</p>
                      </div>
                      <button
                        onClick={() => setDeleteTarget(r)}
                        className="ml-2 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] transition-colors cursor-pointer shrink-0"
                        title="删除记录"
                      >
                        ✕
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
        </>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title={`删除${deleteTarget?.recordType === 'exchange' ? '兑换' : '积分'}记录？`}
        message="此操作不可恢复，删除后学生积分不会自动回退。"
        variant="danger"
        confirmLabel="确认删除"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
