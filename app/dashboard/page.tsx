'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { RainbowDivider } from '@/components/ui/RainbowDivider';
import { useAuth } from '@/hooks/useAuth';
import { getTimeGreeting } from '@/lib/holidays';
import { timeAgo, getMilestone } from '@/lib/utils';
import Link from 'next/link';
import type { DashboardStats, RecentActivity, PointRecord } from '@/types';

const quickLinks = [
  { href: '/classes', label: '管理班级', emoji: '📚' },
  { href: '/exchange', label: '兑换礼物', emoji: '🎪' },
  { href: '/records', label: '查看记录', emoji: '📊' },
  { href: '/gifts', label: '礼物管理', emoji: '🎁' },
];

export default function DashboardPage() {
  const { session } = useAuth();
  const greeting = session ? getTimeGreeting(session.name) : '';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setStats(d.data.stats);
          // 合并积分记录和兑换记录为时间线
          const points = (d.data.recentPoints || []).map((p: any) => ({
            ...p,
            type: p.type,
            description: `${p.type === 'point_add' ? '+' : '-'}${p.points}分 ${p.description}`,
          }));
          const exchanges = (d.data.recentExchanges || []).map((e: any) => ({
            ...e,
            description: `兑换了 ${e.gift_emoji}${e.gift_name} -${e.points}分`,
          }));
          const timeline = [...exchanges, ...points]
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 10);
          setRecent(timeline);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statItems = [
    { label: '班级', value: stats?.classCount ?? '—', emoji: '🎓' },
    { label: '学生', value: stats?.studentCount ?? '—', emoji: '⭐' },
    { label: '礼物', value: stats?.giftCount ?? '—', emoji: '🎁' },
    { label: '今日兑换', value: stats?.todayExchangeCount ?? '—', emoji: '📋' },
  ];

  const timelineIcons: Record<string, string> = {
    exchange: '🎁', point_add: '➕', point_deduct: '➖',
  };
  const timelineColors: Record<string, string> = {
    exchange: 'text-[var(--color-primary)]',
    point_add: 'text-[var(--color-success)]',
    point_deduct: 'text-[var(--color-danger)]',
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">{greeting}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {session?.role === 'super_admin' ? '👑 超级管理员模式' : session?.role === 'admin' ? '🏫 学校管理员模式' : '🧑‍🏫 教师模式'}
        </p>
      </motion.div>

      <RainbowDivider />

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((s, i) => (
          <Card key={s.label} delay={i * 0.1} className="text-center">
            <span className="text-3xl">{s.emoji}</span>
            <motion.p
              key={s.value}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-2xl font-display font-bold text-[var(--color-text)] mt-2"
            >
              {s.value}
            </motion.p>
            <p className="text-xs text-[var(--color-text-secondary)]">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* 快捷入口 */}
      <div>
        <h2 className="text-lg font-display font-bold text-[var(--color-text)] mb-4">快捷入口</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickLinks.map((link, i) => (
            <Link key={link.href} href={link.href}>
              <Card delay={0.3 + i * 0.1} className="text-center cursor-pointer">
                <span className="text-3xl">{link.emoji}</span>
                <p className="text-sm font-bold text-[var(--color-text)] mt-2">{link.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {(session?.role === 'admin' || session?.role === 'super_admin') && (
        <div>
          <h2 className="text-lg font-display font-bold text-[var(--color-text)] mb-4">管理员功能</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/schools">
              <Card delay={0.5} className="text-center cursor-pointer">
                <span className="text-3xl">🏫</span>
                <p className="text-sm font-bold text-[var(--color-text)] mt-2">学校管理</p>
              </Card>
            </Link>
            <Link href="/admin/teachers">
              <Card delay={0.55} className="text-center cursor-pointer">
                <span className="text-3xl">👨‍🏫</span>
                <p className="text-sm font-bold text-[var(--color-text)] mt-2">教师管理</p>
              </Card>
            </Link>
          </div>
        </div>
      )}

      {/* 最近动态 */}
      <div>
        <h2 className="text-lg font-display font-bold text-[var(--color-text)] mb-4">最近动态</h2>
        {recent.length === 0 ? (
          <Card className="text-center text-[var(--color-text-secondary)] py-8">
            <span className="text-4xl">🐾</span>
            <p className="mt-2 font-body">暂无动态，去给小朋友们加积分吧~</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {recent.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 bg-[var(--color-card-bg)] rounded-[var(--radius-md)] p-3 border border-[var(--color-border)]"
              >
                <span className="text-xl">{timelineIcons[item.type] || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--color-text)] truncate">
                    {item.student_emoji || '🌟'} {item.student_name}
                  </p>
                  <p className={`text-xs ${timelineColors[item.type] || ''}`}>
                    {item.description}
                  </p>
                </div>
                <span className="text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
                  {timeAgo(item.created_at)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
