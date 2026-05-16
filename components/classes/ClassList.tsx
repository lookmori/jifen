'use client';
import { ClassCard } from './ClassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';

interface ClassItem {
  id: string;
  name: string;
  teacher_name?: string;
  student_count: number;
  created_at: string;
}

interface ClassListProps {
  classes: ClassItem[];
  loading: boolean;
  onEdit: (c: ClassItem) => void;
  onDelete: (c: ClassItem) => void;
}

export function ClassList({ classes, loading, onEdit, onDelete }: ClassListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <EmptyState
        emoji="📚"
        title="还没有班级哦"
        description="创建第一个班级，开始管理学生积分吧！"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {classes.map((c, i) => (
        <ClassCard key={c.id} classItem={c} index={i} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
