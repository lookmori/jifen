'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';

interface SchoolItem {
  id: string;
  name: string;
}

interface SchoolFormProps {
  editSchool: SchoolItem | null;
  onSubmit: (name: string) => Promise<void>;
  onClose: () => void;
}

export function SchoolForm({ editSchool, onSubmit, onClose }: SchoolFormProps) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(editSchool?.name || '');
  }, [editSchool]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast('请输入学校名称', 'error'); return; }
    setSubmitting(true);
    await onSubmit(name.trim());
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="学校名称"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="例如：阳光小学"
        autoFocus
      />
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose} type="button">取消</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? '保存中...' : editSchool ? '保存修改' : '创建学校'}
        </Button>
      </div>
    </form>
  );
}
