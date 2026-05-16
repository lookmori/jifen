'use client';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Building2, Users, GraduationCap, Edit, Trash2, Eye } from 'lucide-react';

interface SchoolItem {
  id: string;
  name: string;
  admin_name?: string;
  admin_phone?: string;
  teacher_count?: number;
  student_count?: number;
  created_at: string;
}

interface SchoolCardProps {
  school: SchoolItem;
  index: number;
  onEdit: (s: SchoolItem) => void;
  onDelete: (s: SchoolItem) => void;
  onView: (s: SchoolItem) => void;
}

export function SchoolCard({ school, index, onEdit, onDelete, onView }: SchoolCardProps) {
  return (
    <Card delay={index} hover>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-2xl">
            🏫
          </div>
          <div>
            <h3 className="font-display font-bold text-[var(--color-text)]">
              {school.name}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              管理员: {school.admin_name ? `${school.admin_name} 📱 ${school.admin_phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}` : '待指定 ⚠️'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-3 text-xs text-[var(--color-text-secondary)]">
        <span className="flex items-center gap-1"><Users size={12} />{school.teacher_count || 0} 教师</span>
        <span className="flex items-center gap-1"><GraduationCap size={12} />{school.student_count || 0} 学生</span>
      </div>

      <div className="flex gap-1.5 mt-3 pt-3 border-t border-[var(--color-border)]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => onView(school)}
          className="flex-1 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-border)]/50
                     text-[var(--color-text-secondary)] font-bold text-xs cursor-pointer
                     hover:bg-[var(--color-border)] flex items-center justify-center gap-1"
        >
          <Eye size={12} />查看
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => onEdit(school)}
          className="flex-1 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)]/10
                     text-[var(--color-primary)] font-bold text-xs cursor-pointer
                     hover:bg-[var(--color-primary)]/20 flex items-center justify-center gap-1"
        >
          <Edit size={12} />编辑
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => onDelete(school)}
          className="flex-1 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-danger)]/10
                     text-[var(--color-danger)] font-bold text-xs cursor-pointer
                     hover:bg-[var(--color-danger)]/20 flex items-center justify-center gap-1"
        >
          <Trash2 size={12} />删除
        </motion.button>
      </div>
    </Card>
  );
}
