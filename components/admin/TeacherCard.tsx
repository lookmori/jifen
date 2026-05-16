'use client';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Edit, Key, Ban, CheckCircle, Phone } from 'lucide-react';

interface TeacherItem {
  id: string;
  name: string;
  phone: string;
  school_name?: string;
  role: string;
  is_active: boolean;
  avatar_emoji: string;
}

interface TeacherCardProps {
  teacher: TeacherItem;
  index: number;
  onEdit: (t: TeacherItem) => void;
  onResetPassword: (t: TeacherItem) => void;
  onToggleStatus: (t: TeacherItem) => void;
}

export function TeacherCard({ teacher, index, onEdit, onResetPassword, onToggleStatus }: TeacherCardProps) {
  return (
    <Card delay={index} hover>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-2xl flex-shrink-0">
          {teacher.avatar_emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-[var(--color-text)] truncate">
              {teacher.name}
            </h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              teacher.is_active
                ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                : 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
            }`}>
              {teacher.is_active ? '正常' : '已禁用'}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5">
            <Phone size={10} /> {teacher.phone}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            学校: {teacher.school_name || '-'} · 角色: {teacher.role === 'admin' ? '管理员' : '教师'}
          </p>
        </div>
      </div>

      <div className="flex gap-1.5 mt-3 pt-3 border-t border-[var(--color-border)]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => onEdit(teacher)}
          className="flex-1 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)]/10
                     text-[var(--color-primary)] font-bold text-xs cursor-pointer
                     hover:bg-[var(--color-primary)]/20 flex items-center justify-center gap-1"
        >
          <Edit size={12} />编辑
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => onResetPassword(teacher)}
          className="flex-1 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-secondary)]/10
                     text-[var(--color-secondary)] font-bold text-xs cursor-pointer
                     hover:bg-[var(--color-secondary)]/20 flex items-center justify-center gap-1"
        >
          <Key size={12} />重置密码
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => onToggleStatus(teacher)}
          className={`flex-1 py-1.5 rounded-[var(--radius-sm)] font-bold text-xs cursor-pointer flex items-center justify-center gap-1 ${
            teacher.is_active
              ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/20'
              : 'bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20'
          }`}
        >
          {teacher.is_active ? <><Ban size={12} />禁用</> : <><CheckCircle size={12} />启用</>}
        </motion.button>
      </div>
    </Card>
  );
}
