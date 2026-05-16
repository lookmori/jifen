'use client';
import { StudentCard } from './StudentCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';

interface StudentItem {
  id: string;
  name: string;
  points: number;
  avatar_emoji: string;
  class_name?: string;
  rank?: number;
  rankChange?: number;
}

interface StudentListProps {
  students: StudentItem[];
  loading: boolean;
  onAdd: (s: StudentItem) => void;
  onDeduct: (s: StudentItem) => void;
}

export function StudentList({ students, loading, onAdd, onDeduct }: StudentListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <EmptyState
        emoji="🌟"
        title="还没有学生哦"
        description="添加第一个学生，开始管理积分吧！"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {students.map((s, i) => (
        <StudentCard key={s.id} student={s} index={i} onAdd={onAdd} onDeduct={onDeduct} />
      ))}
    </div>
  );
}
