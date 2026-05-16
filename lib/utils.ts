// lib/utils.ts — 通用工具函数

import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// 格式化时间
export function timeAgo(date: Date | string): string {
  const now = Date.now();
  const past = new Date(date).getTime();
  const diff = now - past;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}

// 随机表情
const studentEmojis = ['🌟', '🐱', '🐶', '🐰', '🐹', '🦊', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🦄', '🐙', '🐳', '🦋'];
export function randomEmoji(): string {
  return studentEmojis[Math.floor(Math.random() * studentEmojis.length)];
}

// 积分里程碑
export function getMilestone(points: number): { emoji: string; label: string } | null {
  if (points >= 5000) return { emoji: '👑', label: '积分之王' };
  if (points >= 2000) return { emoji: '🥇', label: '金牌' };
  if (points >= 1000) return { emoji: '🥈', label: '银牌' };
  if (points >= 500) return { emoji: '🥉', label: '铜牌' };
  if (points >= 100) return { emoji: '🌟', label: '星星' };
  return null;
}
