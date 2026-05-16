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
import { parseExcelFile } from '@/lib/excel';
import Link from 'next/link';
import type { Pagination as PaginationType } from '@/types';

interface ClassItem {
  id: string;
  name: string;
  teacher_name?: string;
  student_count: number;
  created_at: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editClass, setEditClass] = useState<ClassItem | null>(null);
  const [formName, setFormName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importingFile, setImportingFile] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingFile(true);
    try {
      const names = await parseExcelFile(file);
      setImportText(names.join('\n'));
      toast(`已解析 ${names.length} 个名称`, 'success');
    } catch { toast('文件解析失败', 'error'); }
    finally { setImportingFile(false); }
  };

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '12', search });
      const res = await fetch(`/api/classes?${params}`);
      const data = await res.json();
      if (data.success) { setClasses(data.data); setPagination(data.pagination); }
    } catch { toast('加载班级失败', 'error'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setSubmitting(true);
    const url = editClass ? `/api/classes/${editClass.id}` : '/api/classes';
    const method = editClass ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast(editClass ? '班级已更新' : '班级已创建', 'success');
        setShowForm(false); fetchClasses();
      } else toast(data.error || '操作失败', 'error');
    } catch { toast('操作失败', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/classes/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast('班级已删除', 'info'); setDeleteTarget(null); fetchClasses(); }
      else toast(data.error || '删除失败', 'error');
    } catch { toast('删除失败', 'error'); }
    setSubmitting(false);
  };

  const handleImport = async () => {
    const names = importText.split('\n').filter(n => n.trim());
    if (names.length === 0) { toast('请输入班级名称', 'error'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/classes/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: names.map(n => ({ name: n.trim() })) }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`成功导入 ${data.data.success} 个班级${data.data.failed > 0 ? `，${data.data.failed} 个失败` : ''}`, 'success');
        setShowImport(false); setImportText(''); fetchClasses();
      } else toast(data.error || '导入失败', 'error');
    } catch { toast('导入失败', 'error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">📚 班级管理</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setImportText(''); setShowImport(true); }}>📥 批量导入</Button>
          <Button variant="primary" size="sm" onClick={() => { setEditClass(null); setFormName(''); setShowForm(true); }}>+ 添加班级</Button>
        </div>
      </div>

      <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="搜索班级..." />

      <RainbowDivider />

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState emoji="🏫" title="还没有班级哦~" description="点击「添加班级」开始创建吧！" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {classes.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <Link href={`/classes/${c.id}`}>
                    <h3 className="text-lg font-display font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">
                      📚 {c.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-2xl">👨‍🎓</span>
                    <span className="text-sm font-bold text-[var(--color-text-secondary)]">{c.student_count} 名学生</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link href={`/classes/${c.id}`} className="flex-1">
                      <Button variant="primary" size="sm" className="w-full">👁 查看</Button>
                    </Link>
                    <Button variant="secondary" size="sm" onClick={() => { setEditClass(c); setFormName(c.name); setShowForm(true); }}>✏️</Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(c)}>🗑️</Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}

      {/* 添加/编辑弹窗 */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editClass ? '✏️ 编辑班级' : '📚 添加班级'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="班级名称" value={formName} onChange={e => setFormName(e.target.value)} placeholder="例如：三年级一班" autoFocus />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>取消</Button>
            <Button type="submit" variant="primary" disabled={submitting || !formName.trim()}>
              {submitting ? '保存中...' : editClass ? '保存修改' : '确认添加'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 批量导入弹窗 */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="📥 批量导入班级">
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
          <p className="text-sm text-[var(--color-text-secondary)]">每行输入一个班级名称</p>
          <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={8}
            placeholder="三年级一班&#10;四年级二班&#10;五年级一班"
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
        message="删除班级将同时删除：该班级下所有学生、积分记录和兑换记录。建议先手动清理相关记录，此操作不可恢复！"
        variant="danger"
        confirmLabel="确认删除"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={submitting}
      />
    </div>
  );
}
