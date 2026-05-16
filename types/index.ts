// types/index.ts — 全局类型定义

// ---- 基础实体 ----

export interface School {
  id: string;
  name: string;
  admin_id?: string;
  admin_name?: string;
  teacher_count?: number;
  student_count?: number;
  created_at: string;
}

export type UserRole = 'admin' | 'teacher';

export interface Teacher {
  id: string;
  phone: string;
  name: string;
  school_id: string;
  school_name?: string;
  role: UserRole;
  avatar_emoji: string;
  is_active: boolean;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  teacher_id: string;
  student_count?: number;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  class_id: string;
  class_name?: string;
  points: number;
  avatar_emoji: string;
  created_at: string;
}

export interface Gift {
  id: string;
  school_id: string;
  name: string;
  description: string;
  image_url: string;
  points_price: number;
  stock: number; // -1 = unlimited
  emoji: string;
  is_active: boolean;
  created_at: string;
}

export interface PointRecord {
  id: string;
  student_id: string;
  student_name?: string;
  teacher_name?: string;
  points_change: number;
  reason: string;
  type: 'add' | 'deduct';
  created_at: string;
}

export interface ExchangeRecord {
  id: string;
  student_id: string;
  student_name?: string;
  gift_id: string;
  gift_name?: string;
  gift_emoji?: string;
  points_spent: number;
  exchanged_at: string;
}

export interface ReasonPreset {
  id: string;
  school_id: string;
  teacher_id?: string | null;
  label: string;
  type: 'add' | 'deduct';
}

// ---- 分页 ----

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PointRecordFilters extends SearchParams {
  studentId?: string;
  type?: 'add' | 'deduct';
  dateFrom?: string;
  dateTo?: string;
}

export interface ExchangeRecordFilters extends SearchParams {
  studentId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ---- 仪表盘 ----

export interface DashboardStats {
  classCount: number;
  studentCount: number;
  giftCount: number;
  todayExchangeCount: number;
  totalPointsAwarded: number;
}

export interface RecentActivity {
  id: string;
  type: 'exchange' | 'point_add' | 'point_deduct';
  studentName: string;
  studentEmoji: string;
  description: string;
  points: number;
  createdAt: Date;
}

// ---- 设置 ----

export interface TeacherSettings {
  id: string;
  teacherId: string;
  soundEnabled: boolean;
  soundVolume: number;
  animationsReduced: boolean;
  updatedAt: Date;
}
