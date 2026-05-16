'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';

interface ClassItem {
  id: string;
  name: string;
}

interface ClassFormProps {
  editClass: ClassItem | null;
  onSubmit: (name: string) => Promise<void>;
  onClose: () => void;
}

export function ClassForm({ editClass, onSubmit, onClose }: ClassFormProps) {
  const [name, setName] = useState(editClass?.name || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(editClass?.name || '');
  }, [editClass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast('请输入班级名称', 'error'); return; }
    setSubmitting(true);
    await onSubmit(name.trim());
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="班级名称"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="例如：三年级一班"
        autoFocus
      />
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose} type="button">取消</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? '保存中...' : editClass ? '保存修改' : '创建班级'}
        </Button>
      </div>
    </form>
  );
}
