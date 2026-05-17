import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// POST /api/schema — 初始化数据库表
export async function POST() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS schools (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      admin_id UUID,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS teachers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone VARCHAR(11) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(50) NOT NULL,
      school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
      role VARCHAR(20) DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher')),
      is_active BOOLEAN DEFAULT TRUE,
      avatar_emoji VARCHAR(10) DEFAULT '🧑‍🏫',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS classes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS students (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(50) NOT NULL,
      class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      points INT DEFAULT 0 CHECK (points >= 0),
      avatar_emoji VARCHAR(10) DEFAULT '🌟',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS reason_presets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
      label VARCHAR(50) NOT NULL,
      type VARCHAR(10) NOT NULL CHECK (type IN ('add', 'deduct')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS point_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      teacher_id UUID NOT NULL REFERENCES teachers(id),
      points_change INT NOT NULL,
      reason VARCHAR(200) NOT NULL,
      type VARCHAR(10) NOT NULL CHECK (type IN ('add', 'deduct')),
      image_url VARCHAR(500),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    await sql`ALTER TABLE point_records ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)`;

    await sql`CREATE TABLE IF NOT EXISTS gifts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      description VARCHAR(500),
      image_url VARCHAR(500) NOT NULL,
      points_price INT NOT NULL CHECK (points_price > 0),
      stock INT DEFAULT -1,
      emoji VARCHAR(10) DEFAULT '🎁',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS exchange_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students(id),
      gift_id UUID NOT NULL REFERENCES gifts(id),
      points_spent INT NOT NULL,
      exchanged_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS teacher_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      teacher_id UUID UNIQUE NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      sound_enabled BOOLEAN DEFAULT TRUE,
      sound_volume FLOAT DEFAULT 0.5 CHECK (sound_volume >= 0 AND sound_volume <= 1),
      animations_reduced BOOLEAN DEFAULT FALSE,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    // 索引
    await sql`CREATE INDEX IF NOT EXISTS idx_students_name ON students USING btree (name text_pattern_ops)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gifts_school_id ON gifts(school_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gifts_active ON gifts(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_point_records_student_id ON point_records(student_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_exchange_records_student_id ON exchange_records(student_id)`;

    return NextResponse.json({ success: true, message: '数据库表已创建' });
  } catch (error) {
    console.error('Schema error:', error);
    return NextResponse.json({ success: false, error: '建表失败' }, { status: 500 });
  }
}
