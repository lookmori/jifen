'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { RainbowDivider } from '@/components/ui/RainbowDivider';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { toast } from '@/components/ui/Toast';
import { triggerPetHappy, triggerPetSad } from '@/components/layout/PixelPet';
import { fireConfetti, fireMilestone, checkMilestone } from '@/lib/confetti';
import { playPointAdd, playPointDeduct, playMilestone } from '@/lib/sounds';
import { MomentImageUpload } from '@/components/students/MomentImageUpload';
import { HighlightMomentsPDF } from '@/components/export/HighlightMomentsPDF';
import type { Pagination as PaginationType } from '@/types';

interface StudentInfo {
  id: string;
  name: string;
  points: number;
  avatar_emoji: string;
  class_name?: string;
  class_id: string;
  exchangeCount: number;
}

interface PointRecord {
  id: string;
  points_change: number;
  reason: string;
  type: 'add' | 'deduct';
  teacher_name: string;
  created_at: string;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [records, setRecords] = useState<PointRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showPointModal, setShowPointModal] = useState(false);
  const [pointType, setPointType] = useState<'add' | 'deduct'>('add');
  const [pointAmount, setPointAmount] = useState(5);
  const [pointReason, setPointReason] = useState('');
  const [pointCustomReason, setPointCustomReason] = useState('');
  const [pointImageUrl, setPointImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PointRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [momentsData, setMomentsData] = useState<{
    class: { id: string; name: string; teacher_name: string };
    students: Array<{
      id: string; name: string; points: number; avatar_emoji: string;
      moments: Array<{ id: string; points_change: number; reason: string; type: string; image_url: string; teacher_name: string; created_at: string }>;
    }>;
  } | null>(null);
  const [exportReady, setExportReady] = useState(false);

  const defaultPresets = {
    add: ['积极回答问题', '作业完成优秀', '帮助同学', '课堂纪律好', '考试成绩进步', '主动打扫卫生'],
    deduct: ['未完成作业', '上课讲话', '迟到', '不遵守纪律'],
  };
  const [reasonPresets, setReasonPresets] = useState<{ add: string[]; deduct: string[] }>(defaultPresets);

  useEffect(() => {
    fetch('/api/reason-presets')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data.length > 0) {
          const add = d.data.filter((p: { type: string }) => p.type === 'add').map((p: { label: string }) => p.label);
          const deduct = d.data.filter((p: { type: string }) => p.type === 'deduct').map((p: { label: string }) => p.label);
          if (add.length > 0 || deduct.length > 0) {
            setReasonPresets({ add: add.length > 0 ? add : defaultPresets.add, deduct: deduct.length > 0 ? deduct : defaultPresets.deduct });
          }
        }
      })
      .catch(() => {});
  }, []);

  const fetchStudent = useCallback(async () => {
    try {
      const res = await fetch(`/api/students/${studentId}`);
      const data = await res.json();
      if (data.success) setStudent(data.data);
    } catch { /* ignore */ }
  }, [studentId]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '15' });
      const res = await fetch(`/api/students/${studentId}/points?${params}`);
      const data = await res.json();
      if (data.success) { setRecords(data.data); setPagination(data.pagination); }
    } catch { toast('加载记录失败', 'error'); }
    finally { setLoading(false); }
  }, [studentId, page]);

  useEffect(() => { fetchStudent(); fetchRecords(); }, [fetchStudent, fetchRecords]);

  const handleDeleteRecord = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/records', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id, recordType: deleteTarget.type }),
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

  const handleAdjustPoints = async () => {
    const reason = pointReason || pointCustomReason;
    if (!reason) { toast('请选择或输入原因', 'error'); return; }
    if (pointAmount <= 0) { toast('分数必须大于0', 'error'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/students/${studentId}/points`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointsChange: pointAmount, reason, type: pointType, imageUrl: pointImageUrl || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        const oldPoints = student!.points;
        const newPoints = data.data.student.points;
        const emoji = pointType === 'add' ? '⭐' : '📉';
        toast(`${emoji} ${student!.name} ${pointType === 'add' ? '+' : '-'}${pointAmount}分`, 'success');
        setShowPointModal(false);
        fetchStudent(); fetchRecords();
        pointType === 'add' ? triggerPetHappy() : triggerPetSad();
        if (pointType === 'add') {
          const milestone = checkMilestone(oldPoints, newPoints);
          if (milestone) { fireMilestone(newPoints); playMilestone(); }
          else { fireConfetti(); playPointAdd(); }
        } else {
          playPointDeduct();
        }
      } else toast(data.error || '操作失败', 'error');
    } catch { toast('操作失败', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleExport = async () => {
    if (!student) return;
    try {
      const res = await fetch(`/api/classes/${student.class_id}/moments?studentId=${studentId}`);
      const data = await res.json();
      if (data.success) {
        if (data.data.students.length === 0) {
          toast('该学生暂无精彩瞬间', 'info');
          return;
        }
        setMomentsData(data.data);
        setExportReady(true);
      } else {
        toast(data.error || '获取精彩瞬间失败', 'error');
      }
    } catch {
      toast('获取精彩瞬间失败', 'error');
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const presetOptions = (reasonPresets[pointType] || []).map(r => ({ value: r, label: r }));

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>← 返回</Button>
      </div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <div className="flex items-center gap-4 flex-wrap">
            <motion.span className="text-5xl"
              animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              {student.avatar_emoji}
            </motion.span>
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">{student.name}</h1>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {student.class_name ? `📚 ${student.class_name}` : ''} | 🎁 已兑换 {student.exchangeCount} 次
              </p>
              <motion.p
                key={student.points}
                initial={{ scale: 1.3, color: 'var(--color-primary)' }}
                animate={{ scale: 1, color: 'var(--color-text)' }}
                className="text-3xl font-display font-bold point-bounce mt-1"
              >
                ⭐ {student.points} 分
              </motion.p>
            </div>
            <div className="flex gap-2">
              <Button variant="success" size="sm" onClick={() => {
                setPointType('add'); setPointAmount(5); setPointReason(''); setPointCustomReason(''); setPointImageUrl(''); setShowPointModal(true);
              }}>＋ 加分</Button>
              <Button variant="danger" size="sm" onClick={() => {
                setPointType('deduct'); setPointAmount(3); setPointReason(''); setPointCustomReason(''); setPointImageUrl(''); setShowPointModal(true);
              }}>− 扣分</Button>
              <Button variant="ghost" size="sm" onClick={handleExport} className="gap-1 font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10">
                📸 导出精彩瞬间
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <RainbowDivider />

      <h2 className="text-lg font-display font-bold text-[var(--color-text)]">📋 积分记录</h2>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : records.length === 0 ? (
        <EmptyState emoji="📋" title="暂无积分记录" description="还没有积分的变动记录哦~" />
      ) : (
        <>
          <div className="space-y-3">
            <AnimatePresence>
              {records.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm px-2 py-1 rounded-full font-bold ${
                        r.type === 'add' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
                      }`}>
                        {r.type === 'add' ? '⭐ 加分' : '📉 扣分'}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-[var(--color-text)]">{r.reason}</p>
                        {r.teacher_name && <p className="text-xs text-[var(--color-text-secondary)]">操作: {r.teacher_name}</p>}
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-display font-bold ${r.points_change > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                          {r.points_change > 0 ? '+' : ''}{r.points_change} 分
                        </p>
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
        title="删除积分记录？"
        message="此操作不可恢复，删除后学生积分不会自动回退。"
        variant="danger"
        confirmLabel="确认删除"
        onConfirm={handleDeleteRecord}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {momentsData && (
        <HighlightMomentsPDF
          classInfo={momentsData.class}
          students={momentsData.students}
          autoGenerate={exportReady}
          onGenerated={() => { setExportReady(false); setMomentsData(null); }}
        />
      )}

      <Modal open={showPointModal} onClose={() => setShowPointModal(false)} title={`✨ 调整${student.name}积分`}>
        <div className="space-y-4">
          <p className="text-center text-sm text-[var(--color-text-secondary)]">
            当前: ⭐ {student.points} 分
          </p>

          <div className="flex gap-2">
            <button onClick={() => setPointType('add')}
              className={`flex-1 py-2 rounded-[var(--radius-md)] font-bold text-sm cursor-pointer transition-all ${
                pointType === 'add' ? 'bg-[var(--color-success)] text-white scale-105' : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]'
              }`}>➕ 加分</button>
            <button onClick={() => setPointType('deduct')}
              className={`flex-1 py-2 rounded-[var(--radius-md)] font-bold text-sm cursor-pointer transition-all ${
                pointType === 'deduct' ? 'bg-[var(--color-danger)] text-white scale-105' : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]'
              }`}>➖ 扣分</button>
          </div>

          <div>
            <label className="text-sm font-bold text-[var(--color-text-secondary)] mb-1.5 block">分数</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setPointAmount(Math.max(1, pointAmount - 1))}
                className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-border)] font-bold text-lg cursor-pointer">−</button>
              <input type="number" value={pointAmount} onChange={e => setPointAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center px-2 py-2 rounded-[var(--radius-md)] border-2 border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] font-display text-xl font-bold focus:outline-none focus:border-[var(--color-primary)]" />
              <button onClick={() => setPointAmount(pointAmount + 1)}
                className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-border)] font-bold text-lg cursor-pointer">+</button>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-[var(--color-text-secondary)] mb-1.5 block">原因</label>
            <Select
              value={pointReason}
              onChange={v => setPointReason(v)}
              options={[{ value: '', label: '选择原因...' }, ...presetOptions]}
              placeholder="选择原因..."
            />
          </div>

          <div>
            <label className="text-sm font-bold text-[var(--color-text-secondary)] mb-1.5 block">或自定义原因</label>
            <Input value={pointCustomReason} onChange={e => setPointCustomReason(e.target.value)} placeholder="输入自定义原因..." />
          </div>

          {pointType === 'add' && (
            <MomentImageUpload
              imageUrl={pointImageUrl}
              onUploaded={setPointImageUrl}
              onRemove={() => setPointImageUrl('')}
            />
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowPointModal(false)}>取消</Button>
            <Button variant={pointType === 'add' ? 'success' : 'danger'} onClick={handleAdjustPoints} disabled={submitting}>
              {submitting ? '处理中...' : `确认${pointType === 'add' ? '加分' : '扣分'}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
