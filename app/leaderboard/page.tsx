'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { RainbowDivider } from '@/components/ui/RainbowDivider';
import { Select } from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import Link from 'next/link';

interface LeaderboardStudent {
  id: string;
  name: string;
  points: number;
  avatar_emoji: string;
  class_name: string;
}

interface ClassOption {
  id: string;
  name: string;
}

const medalEmojis = ['🥇', '🥈', '🥉'];
const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function LeaderboardPage() {
  const [students, setStudents] = useState<LeaderboardStudent[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (selectedClass) params.set('classId', selectedClass);
      const res = await fetch(`/api/leaderboard?${params}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
        setClasses(data.classes || []);
      }
    } catch { toast('加载排行榜失败', 'error'); }
    finally { setLoading(false); }
  }, [selectedClass]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const maxPoints = students.length > 0 ? students[0].points : 0;

  const classOptions = [{ value: '', label: '全部班级' }, ...classes.map(c => ({ value: c.id, label: c.name }))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">🏆 积分排行榜</h1>
        <Select value={selectedClass} onChange={setSelectedClass} options={classOptions} className="w-48" />
      </div>

      <RainbowDivider />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : students.length === 0 ? (
        <EmptyState emoji="🏆" title="还没有排名数据" description="给学生加分后，排行榜就会出现啦！" />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {students.map((s, i) => {
              const isTop3 = i < 3;
              const barWidth = maxPoints > 0 ? (s.points / maxPoints) * 100 : 0;

              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.01 }}
                  className={isTop3 ? 'rounded-[var(--radius-lg)]' : ''}
                  style={isTop3 ? { borderLeft: `4px solid ${medalColors[i]}` } : undefined}
                >
                  <Card>
                    <div className="flex items-center gap-3">
                      <div className="w-10 text-center shrink-0">
                        {isTop3 ? (
                          <motion.span
                            className="text-2xl"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                          >
                            {medalEmojis[i]}
                          </motion.span>
                        ) : (
                          <motion.span
                            className="text-lg font-display font-bold text-[var(--color-text-secondary)]"
                          >
                            {i + 1}
                          </motion.span>
                        )}
                      </div>

                      <span className="text-2xl shrink-0">{s.avatar_emoji}</span>
                      <div className="flex-1 min-w-0">
                        <Link href={`/students/${s.id}`} className="font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">
                          {s.name}
                        </Link>
                        <p className="text-xs text-[var(--color-text-secondary)]">{s.class_name}</p>

                        <div className="mt-1.5 h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: isTop3
                              ? `linear-gradient(90deg, ${medalColors[i]}, ${medalColors[i]}88)`
                              : 'var(--color-primary)' }}
                          />
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <motion.p
                          className="text-xl font-display font-bold text-[var(--color-primary)]"
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.05 + 0.3 }}
                        >
                          ⭐ {s.points}
                        </motion.p>
                        {isTop3 && i === 0 && (
                          <motion.span
                            className="text-xs"
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            🚀
                          </motion.span>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
