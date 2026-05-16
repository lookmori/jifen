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
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import type { School, Pagination as PaginationType } from '@/types';

export default function AdminSchoolsPage() {
  const { session } = useAuth();
  const isSuperAdmin = session?.phone === 'admin';
  const [schools, setSchools] = useState<School[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editSchool, setEditSchool] = useState<School | null>(null);
  const [formName, setFormName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<School | null>(null);

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '12', search });
      const res = await fetch(`/api/admin/schools?${params}`);
      const data = await res.json();
      if (data.success) {
        setSchools(data.data);
        setPagination(data.pagination);
      }
    } catch (err) {
      toast('加载学校列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);

  const openCreate = () => {
    setEditSchool(null);
    setFormName('');
    setShowForm(true);
  };

  const openEdit = (school: School) => {
    setEditSchool(school);
    setFormName(school.name);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setSubmitting(true);

    const url = editSchool
      ? `/api/admin/schools/${editSchool.id}`
      : '/api/admin/schools';
    const method = editSchool ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast(editSchool ? '学校已更新 ✏️' : '学校已创建 🏫', 'success');
        setShowForm(false);
        fetchSchools();
      } else {
        toast(data.error || '操作失败', 'error');
      }
    } catch {
      toast('操作失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/schools/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast('学校已删除 🗑️', 'info');
        setDeleteTarget(null);
        fetchSchools();
      } else {
        toast(data.error || '删除失败', 'error');
      }
    } catch {
      toast('删除失败', 'error');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">🏫 学校管理</h1>
        {isSuperAdmin && <Button variant="primary" size="sm" onClick={openCreate}>+ 创建学校</Button>}
      </div>

      <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="搜索学校..." />

      <RainbowDivider />

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : schools.length === 0 ? (
        <EmptyState emoji="🏫" title="还没有学校" description={isSuperAdmin ? "点击「创建学校」开始吧！" : "请联系超级管理员创建学校"} />
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {schools.map((school, i) => (
              <motion.div
                key={school.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-display font-bold text-[var(--color-text)]">
                      🏫 {school.name}
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      {school.admin_name ? `管理员: ${school.admin_name}` : '⚠️ 未指定管理员'}
                      {school.teacher_count !== undefined && ` · 教师: ${school.teacher_count}人`}
                      {school.student_count !== undefined && ` · 学生: ${school.student_count}人`}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/admin/teachers?schoolId=${school.id}`}>
                      <Button variant="ghost" size="sm">👁 查看教师</Button>
                    </Link>
                    <Button variant="secondary" size="sm" onClick={() => openEdit(school)}>✏️ 编辑</Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(school)}>🗑️ 删除</Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editSchool ? '✏️ 编辑学校' : '🏫 创建学校'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="学校名称"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            placeholder="请输入学校名称"
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>取消</Button>
            <Button type="submit" variant="primary" disabled={submitting || !formName.trim()}>
              {submitting ? '保存中...' : editSchool ? '保存修改' : '确认创建'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        title={`确定要删除「${deleteTarget?.name || ''}」吗？`}
        message="此操作会级联删除该校所有教师、班级和学生数据，不可恢复！"
        variant="danger"
        confirmLabel="确认删除"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={submitting}
      />
    </div>
  );
}
