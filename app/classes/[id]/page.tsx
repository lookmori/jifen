'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Select } from '@/components/ui/Select';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { toast } from '@/components/ui/Toast';
import { triggerPetHappy, triggerPetSad } from '@/components/layout/PixelPet';
import { fireConfetti, fireMilestone, checkMilestone } from '@/lib/confetti';
import { playPointAdd, playPointDeduct, playMilestone } from '@/lib/sounds';
import { parseExcelFile } from '@/lib/excel';
import { MomentImageUpload } from '@/components/students/MomentImageUpload';
import { HighlightMomentsPDF } from '@/components/export/HighlightMomentsPDF';
import Link from 'next/link';
import type { Pagination as PaginationType } from '@/types';

interface StudentItem {
  id: string;
  name: string;
  points: number;
  avatar_emoji: string;
  class_id: string;
  created_at: string;
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showPointModal, setShowPointModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [pointType, setPointType] = useState<'add' | 'deduct'>('add');
  const [pointAmount, setPointAmount] = useState(5);
  const [pointReason, setPointReason] = useState('');
  const [pointCustomReason, setPointCustomReason] = useState('');
  const [pointImageUrl, setPointImageUrl] = useState('');

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importingFile, setImportingFile] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<StudentItem | null>(null);
  const [momentsData, setMomentsData] = useState<{
    class: { id: string; name: string; teacher_name: string };
    students: Array<{
      id: string; name: string; points: number; avatar_emoji: string;
      moments: Array<{ id: string; points_change: number; reason: string; type: string; image_url: string; teacher_name: string; created_at: string }>;
    }>;
  } | null>(null);
  const [exportReady, setExportReady] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingFile(true);
    try {
      const names = await parseExcelFile(file);
      setImportText(names.join('\n'));
      toast(`已解析 ${names.length} 个姓名`, 'success');
    } catch { toast('文件解析失败', 'error'); }
    finally { setImportingFile(false); }
  };

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

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '12', search, sortBy: 'points', sortOrder: 'desc' });
      const res = await fetch(`/api/classes/${classId}/students?${params}`);
      const data = await res.json();
      if (data.success) { setStudents(data.data); setPagination(data.pagination); }
    } catch { toast('加载学生失败', 'error'); }
    finally { setLoading(false); }
  }, [classId, page, search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/classes/${classId}/moments`);
      const data = await res.json();
      if (data.success) {
        if (data.data.students.length === 0) {
          toast('该班级暂无精彩瞬间', 'info');
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

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: studentName.trim(), classId }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`已添加 ${studentName.trim()} ${data.data.avatar_emoji}`, 'success');
        setShowStudentForm(false); setStudentName(''); fetchStudents();
      } else toast(data.error || '添加失败', 'error');
    } catch { toast('添加失败', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleAdjustPoints = async () => {
    const reason = pointReason || pointCustomReason;
    if (!reason) { toast('请选择或输入原因', 'error'); return; }
    if (pointAmount <= 0) { toast('分数必须大于0', 'error'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/students/${selectedStudent!.id}/points`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointsChange: pointAmount, reason, type: pointType, imageUrl: pointImageUrl || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        const oldPoints = selectedStudent!.points;
        const newPoints = data.data.student.points;
        toast(`${pointType === 'add' ? '⭐' : '📉'} ${selectedStudent!.name} ${pointType === 'add' ? '+' : '-'}${pointAmount}分`, 'success');
        setShowPointModal(false); fetchStudents();
        pointType === 'add' ? triggerPetHappy() : triggerPetSad();
        if (pointType === 'add') {
          const milestone = checkMilestone(oldPoints, newPoints);
          if (milestone) { fireMilestone(newPoints); playMilestone(); }
          else { fireConfetti(); playPointAdd(); }
        } else { playPointDeduct(); }
      } else toast(data.error || '操作失败', 'error');
    } catch { toast('操作失败', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteStudent = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/students/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast('学生已删除', 'info'); setDeleteTarget(null); fetchStudents(); }
      else toast(data.error || '删除失败', 'error');
    } catch { toast('删除失败', 'error'); }
    setSubmitting(false);
  };

  const handleImport = async () => {
    const names = importText.split('\n').filter(n => n.trim());
    if (names.length === 0) { toast('请输入学生姓名', 'error'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/students/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, items: names.map(n => ({ name: n.trim() })) }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`成功导入 ${data.data.success} 名学生${data.data.failed > 0 ? `，${data.data.failed} 个失败` : ''}`, 'success');
        setShowImport(false); setImportText(''); fetchStudents();
      } else toast(data.error || '导入失败', 'error');
    } catch { toast('导入失败', 'error'); }
    finally { setSubmitting(false); }
  };

  const presetOptions = (reasonPresets[pointType] || []).map(r => ({ value: r, label: r }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/classes')}>← 返回</Button>
          <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">📚 班级详情</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleExport} className="gap-1.5 font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10">
            📸 导出全班精彩瞬间
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { setImportText(''); setShowImport(true); }}>📥 批量导入</Button>
          <Button variant="primary" size="sm" onClick={() => { setStudentName(''); setShowStudentForm(true); }}>+ 添加学生</Button>
        </div>
      </div>

      <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="搜索学生..." />

      <RainbowDivider />

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : students.length === 0 ? (
        <EmptyState emoji="👨‍🎓" title="还没有学生" description="点击「添加学生」或「批量导入」开始吧！" />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {students.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{s.avatar_emoji}</span>
                      <div>
                        <h3 className="font-display font-bold text-[var(--color-text)]">{s.name}</h3>
                        <motion.p
                          key={s.points}
                          initial={{ scale: 1.3, color: 'var(--color-primary)' }}
                          animate={{ scale: 1, color: 'var(--color-text)' }}
                          className="text-lg font-display font-bold"
                        >
                          ⭐ {s.points} 分
                        </motion.p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="success" size="sm" className="flex-1" onClick={() => {
                        setSelectedStudent(s); setPointType('add'); setPointAmount(5);
                        setPointReason(''); setPointCustomReason(''); setPointImageUrl(''); setShowPointModal(true);
                      }}>＋ 加分</Button>
                      <Button variant="danger" size="sm" className="flex-1" onClick={() => {
                        setSelectedStudent(s); setPointType('deduct'); setPointAmount(3);
                        setPointReason(''); setPointCustomReason(''); setPointImageUrl(''); setShowPointModal(true);
                      }}>− 扣分</Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Link href={`/students/${s.id}`} className="flex-1">
                        <Button variant="ghost" size="sm" className="w-full">📋 记录</Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => setDeleteTarget(s)}>🗑️</Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
        </>
      )}

      {/* 添加学生弹窗 */}
      <Modal open={showStudentForm} onClose={() => setShowStudentForm(false)} title="🌟 添加学生">
        <form onSubmit={handleAddStudent} className="space-y-4">
          <Input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="请输入学生姓名" autoFocus />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setShowStudentForm(false)}>取消</Button>
            <Button type="submit" variant="primary" disabled={submitting || !studentName.trim()}>确认添加</Button>
          </div>
        </form>
      </Modal>

      {/* 积分调整弹窗 */}
      <Modal open={showPointModal} onClose={() => setShowPointModal(false)} title={`✨ 调整${selectedStudent?.name}积分`}>
        <div className="space-y-4">
          <p className="text-center text-sm text-[var(--color-text-secondary)]">
            当前: ⭐ {selectedStudent?.points} 分
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

      {/* 批量导入弹窗 */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="📥 批量导入学生">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-[var(--color-text-secondary)] mb-1.5 block">📎 上传 Excel 文件 (.xlsx)</label>
            <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} disabled={importingFile}
              className="w-full text-sm text-[var(--color-text-secondary)] file:mr-3 file:py-2 file:px-4 file:rounded-[var(--radius-md)] file:border-0 file:bg-[var(--color-primary)] file:text-white file:font-bold file:cursor-pointer" />
            {importingFile && <p className="text-xs text-[var(--color-text-secondary)] mt-1">解析中...</p>}
          </div>
          <div className="flex items-center gap-2">
            <hr className="flex-1 border-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-text-secondary)]">或粘贴文本</span>
            <hr className="flex-1 border-[var(--color-border)]" />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">每行输入一个学生姓名</p>
          <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={10}
            placeholder="张三&#10;李四&#10;王五"
            className="w-full px-4 py-3 rounded-[var(--radius-md)] border-2 border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] font-body resize-none focus:outline-none focus:border-[var(--color-primary)]" />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowImport(false)}>取消</Button>
            <Button variant="primary" onClick={handleImport} disabled={submitting || !importText.trim()}>
              {submitting ? '导入中...' : '确认导入'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 删除确认弹窗 */}
      <ConfirmModal
        open={!!deleteTarget}
        title={`删除「${deleteTarget?.name || ''}」？`}
        message="该学生的积分记录和兑换记录将一并删除，此操作不可恢复。"
        variant="danger"
        confirmLabel="确认删除"
        onConfirm={handleDeleteStudent}
        onClose={() => setDeleteTarget(null)}
        loading={submitting}
      />

      {momentsData && (
        <HighlightMomentsPDF
          classInfo={momentsData.class}
          students={momentsData.students}
          autoGenerate={exportReady}
          onGenerated={() => { setExportReady(false); setMomentsData(null); }}
        />
      )}
    </div>
  );
}
