'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { Shuffle } from 'lucide-react';

interface TeacherItem {
  id: string;
  name: string;
  phone: string;
  school_id?: string;
  school_name?: string;
  role: string;
}

interface TeacherFormProps {
  editTeacher: TeacherItem | null;
  schools: { id: string; name: string }[];
  onSubmit: (data: { name: string; phone: string; schoolId: string; role: string; password: string }) => Promise<void>;
  onClose: () => void;
}

export function TeacherForm({ editTeacher, schools, onSubmit, onClose }: TeacherFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [role, setRole] = useState('teacher');
  const [password, setPassword] = useState('123456');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editTeacher) {
      setName(editTeacher.name);
      setPhone(editTeacher.phone);
      setSchoolId(editTeacher.school_id || '');
      setRole(editTeacher.role);
      setPassword('');
    } else {
      setName('');
      setPhone('');
      setSchoolId(schools[0]?.id || '');
      setRole('teacher');
      setPassword('123456');
    }
  }, [editTeacher, schools]);

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let pwd = '';
    for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setPassword(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { toast('请填写姓名和手机号', 'error'); return; }
    if (!/^1\d{10}$/.test(phone.trim())) { toast('请输入正确的手机号', 'error'); return; }
    setSubmitting(true);
    await onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      schoolId,
      role,
      password: password || '123456',
    });
    setSubmitting(false);
  };

  const schoolOptions = schools.map(s => ({ value: s.id, label: s.name }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="姓名" value={name} onChange={e => setName(e.target.value)} placeholder="例如：李老师" autoFocus />
      <Input label="手机号" value={phone} onChange={e => setPhone(e.target.value)} placeholder="11位手机号" maxLength={11} />

      <div>
        <label className="block text-sm font-bold text-[var(--color-text)] mb-2">所属学校</label>
        <Select
          value={schoolId}
          onChange={setSchoolId}
          options={schoolOptions}
          placeholder="请选择学校"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-[var(--color-text)] mb-2">角色</label>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setRole('teacher')}
            className={`flex-1 py-2.5 rounded-[var(--radius-md)] font-bold text-sm cursor-pointer transition-all ${
              role === 'teacher' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]'
            }`}
          >
            教师
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setRole('admin')}
            className={`flex-1 py-2.5 rounded-[var(--radius-md)] font-bold text-sm cursor-pointer transition-all ${
              role === 'admin' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]'
            }`}
          >
            学校管理员
          </motion.button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-[var(--color-text)] mb-2">
          {editTeacher ? '新密码（留空不修改）' : '初始密码'}
        </label>
        <div className="flex gap-2">
          <Input
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={editTeacher ? '留空则不修改密码' : '设置初始密码'}
            className="flex-1 font-mono text-sm"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={generatePassword}
            className="px-3 rounded-[var(--radius-md)] bg-[var(--color-border)] text-[var(--color-text-secondary)]
                       hover:bg-[var(--color-primary)]/20 cursor-pointer flex items-center gap-1 text-xs font-bold"
          >
            <Shuffle size={14} />随机
          </motion.button>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="ghost" onClick={onClose} type="button">取消</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? '保存中...' : editTeacher ? '保存修改' : '添加教师'}
        </Button>
      </div>
    </form>
  );
}
