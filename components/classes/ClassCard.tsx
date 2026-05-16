'use client';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Users, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ClassItem {
  id: string;
  name: string;
  teacher_name?: string;
  student_count: number;
  created_at: string;
}

interface ClassCardProps {
  classItem: ClassItem;
  index: number;
  onEdit: (c: ClassItem) => void;
  onDelete: (c: ClassItem) => void;
}

export function ClassCard({ classItem, index, onEdit, onDelete }: ClassCardProps) {
  return (
    <Card delay={index} hover>
      <Link href={`/classes/${classItem.id}`} className="block">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-2xl">
            📚
          </div>
          <div className="flex gap-1" onClick={e => e.preventDefault()}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onEdit(classItem); }}
              className="p-1.5 rounded-lg hover:bg-[var(--color-border)] cursor-pointer text-[var(--color-text-secondary)]"
            >
              <Edit size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onDelete(classItem); }}
              className="p-1.5 rounded-lg hover:bg-[var(--color-danger)]/10 cursor-pointer text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]"
            >
              <Trash2 size={16} />
            </motion.button>
          </div>
        </div>
        <h3 className="font-display font-bold text-[var(--color-text)] mt-3 text-lg">
          {classItem.name}
        </h3>
        <div className="flex items-center gap-1.5 mt-2 text-[var(--color-text-secondary)] text-sm">
          <Users size={14} />
          <span>{classItem.student_count} 名学生</span>
        </div>
      </Link>
    </Card>
  );
}
