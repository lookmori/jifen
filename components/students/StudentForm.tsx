'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface StudentFormProps {
  editStudent: { id: string; name: string } | null;
  onSubmit: (name: string) => Promise<void>;
  onClose: () => void;
}

export function StudentForm({ editStudent, onSubmit, onClose }: StudentFormProps) {
  const [name, setName] = useState(editStudent?.name || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(editStudent?.name || '');
  }, [editStudent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await onSubmit(name.trim());
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="学生姓名"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="请输入学生姓名"
        autoFocus
      />
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose} type="button">取消</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? '保存中...' : editStudent ? '保存修改' : '添加学生'}
        </Button>
      </div>
    </form>
  );
}
