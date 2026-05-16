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
import { Select } from '@/components/ui/Select';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PromptModal } from '@/components/ui/PromptModal';
import { toast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import type { Teacher, School, Pagination as PaginationType } from '@/types';

export default function AdminTeachersPage() {
  const { session } = useAuth();
  const isSuperAdmin = session?.phone === 'admin';
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 表单字段
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSchoolId, setFormSchoolId] = useState('');
  const [formRole, setFormRole] = useState<'teacher' | 'admin'>('teacher');
  const [formPassword, setFormPassword] = useState('123456');

  // 确认弹窗
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string; message: string; variant: 'danger' | 'info' | 'warning';
    onConfirm: () => void;
  }>({ title: '', message: '', variant: 'info', onConfirm: () => {} });

  // 密码弹窗
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptTeacher, setPromptTeacher] = useState<Teacher | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '12', search });
      if (schoolFilter) params.set('schoolId', schoolFilter);
      const res = await fetch(`/api/admin/teachers?${params}`);
      const data = await res.json();
      if (data.success) {
        setTeachers(data.data);
        setPagination(data.pagination);
      }
    } catch { toast('加载教师列表失败', 'error'); }
    finally { setLoading(false); }
  }, [page, search, schoolFilter]);

  const fetchSchools = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/schools?pageSize=100');
      const data = await res.json();
      if (data.success) setSchools(data.data);
    } catch {}
  }, []);

  useEffect(() => { fetchTeachers(); fetchSchools(); }, [fetchTeachers, fetchSchools]);

  const schoolOptions = schools.map(s => ({ value: s.id, label: s.name }));

  const openCreate = () => {
    setEditTeacher(null);
    setFormName('');
    setFormPhone('');
    setFormSchoolId(schoolFilter || (schools[0]?.id || ''));
    setFormRole('teacher');
    setFormPassword('123456');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim() || !formSchoolId) {
      toast('请填写完整信息', 'error'); return;
    }
    setSubmitting(true);
    if (editTeacher) {
      const res = await fetch(`/api/admin/teachers/${editTeacher.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), phone: formPhone, schoolId: formSchoolId, role: formRole }),
      });
      const data = await res.json();
      if (data.success) { toast('教师信息已更新', 'success'); setShowForm(false); fetchTeachers(); }
      else toast(data.error || '更新失败', 'error');
    } else {
      const res = await fetch('/api/admin/teachers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), phone: formPhone, schoolId: formSchoolId, role: formRole, password: formPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`教师已创建！初始密码: ${data.data.initialPassword || formPassword}`, 'success');
        setShowForm(false); fetchTeachers();
      } else toast(data.error || '创建失败', 'error');
    }
    setSubmitting(false);
  };

  const handleResetPassword = async (teacher: Teacher) => {
    setPromptTeacher(teacher);
    setPromptOpen(true);
  };

  const handleResetPasswordConfirm = async (newPwd: string) => {
    if (!promptTeacher) return;
    setPromptLoading(true);
    try {
      const res = await fetch(`/api/admin/teachers/${promptTeacher.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', password: newPwd }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`密码已重置为: ${newPwd}`, 'success');
        setPromptOpen(false);
      } else toast(data.error || '重置失败', 'error');
    } catch { toast('重置失败', 'error'); }
    setPromptLoading(false);
  };

  const handleToggleStatus = (teacher: Teacher) => {
    setConfirmConfig({
      title: teacher.is_active ? `禁用「${teacher.name}」的账号？` : `启用「${teacher.name}」的账号？`,
      message: teacher.is_active ? '禁用后该教师将无法登录，但数据会保留。' : '启用后该教师可以正常登录使用。',
      variant: teacher.is_active ? 'warning' : 'info',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/teachers/${teacher.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle-status' }),
          });
          const data = await res.json();
          if (data.success) {
            toast(teacher.is_active ? '账号已禁用' : '账号已启用', 'success');
            setConfirmOpen(false); fetchTeachers();
          } else toast(data.error || '操作失败', 'error');
        } catch { toast('操作失败', 'error'); }
      },
    });
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">👨‍🏫 教师账号管理</h1>
        <Button variant="primary" size="sm" onClick={openCreate}>+ 添加教师</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="搜索姓名/手机号..." className="flex-1 min-w-[200px]" />
        {isSuperAdmin && (
          <Select
            value={schoolFilter}
            onChange={v => { setSchoolFilter(v); setPage(1); }}
            options={[{ value: '', label: '全部学校' }, ...schoolOptions]}
            className="w-40"
          />
        )}
      </div>

      <RainbowDivider />

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : teachers.length === 0 ? (
        <EmptyState emoji="👨‍🏫" title="还没有教师" description="点击「添加教师」创建账号" />
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {teachers.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{t.avatar_emoji}</span>
                      <div>
                        <h3 className="font-display font-bold text-[var(--color-text)]">{t.name}</h3>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          📱 {t.phone} · 🏫 {t.school_name || '—'} · {t.role === 'admin' ? '👑 管理员' : '🧑‍🏫 教师'}
                        </p>
                      </div>
                      <span className={`ml-2 px-2 py-0.5 rounded-[var(--radius-full)] text-xs font-bold ${
                        t.is_active ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]' : 'bg-[var(--color-danger)]/20 text-[var(--color-danger)]'
                      }`}>
                        {t.is_active ? '🟢 启用' : '🔴 已禁用'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => {
                      setEditTeacher(t); setFormName(t.name); setFormPhone(t.phone);
                      setFormSchoolId(t.school_id); setFormRole(t.role as any); setShowForm(true);
                    }}>✏️ 编辑</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleResetPassword(t)}>🔑 重置密码</Button>
                    <Button variant={t.is_active ? 'danger' : 'success'} size="sm" onClick={() => handleToggleStatus(t)}>
                      {t.is_active ? '🚫 禁用' : '✅ 启用'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}

      {/* 添加/编辑教师弹窗 */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editTeacher ? '✏️ 编辑教师' : '✨ 添加新教师'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="姓名" value={formName} onChange={e => setFormName(e.target.value)} placeholder="请输入姓名" />
          <Input label="手机号" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="请输入手机号" maxLength={11} type="tel" />
          <div>
            <label className="text-sm font-bold text-[var(--color-text-secondary)] mb-1.5 block">所属学校</label>
            <Select value={formSchoolId} onChange={setFormSchoolId} options={schoolOptions} placeholder="请选择学校" />
          </div>
          <div>
            <label className="text-sm font-bold text-[var(--color-text-secondary)] mb-1.5 block">角色</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={formRole === 'teacher'} onChange={() => setFormRole('teacher')} className="accent-[var(--color-primary)]" />
                <span className="text-sm text-[var(--color-text)]">🧑‍🏫 教师</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={formRole === 'admin'} onChange={() => setFormRole('admin')} className="accent-[var(--color-primary)]" />
                <span className="text-sm text-[var(--color-text)]">👑 学校管理员</span>
              </label>
            </div>
          </div>
          {!editTeacher && (
            <div>
              <label className="text-sm font-bold text-[var(--color-text-secondary)] mb-1.5 block">初始密码</label>
              <div className="flex gap-2">
                <Input value={formPassword} onChange={e => setFormPassword(e.target.value)} className="flex-1" />
                <Button type="button" variant="secondary" size="sm" onClick={() => setFormPassword(Math.random().toString(36).slice(-8))}>🎲 随机</Button>
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>取消</Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? '保存中...' : editTeacher ? '保存修改' : '确认添加'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 确认弹窗 */}
      <ConfirmModal
        open={confirmOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmOpen(false)}
      />

      {/* 重置密码弹窗 */}
      <PromptModal
        open={promptOpen}
        title={`重置「${promptTeacher?.name || ''}」的密码`}
        message="请输入新密码"
        label="新密码"
        defaultValue="123456"
        showRandom
        confirmLabel="确认重置"
        onConfirm={handleResetPasswordConfirm}
        onClose={() => setPromptOpen(false)}
        loading={promptLoading}
      />
    </div>
  );
}
