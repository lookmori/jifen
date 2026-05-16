-- schema.sql — 完整数据库建表脚本
-- 在 Vercel Postgres / Neon SQL Editor 中执行
--
-- 如果数据库已存在 teachers 表且有 UNIQUE 约束，先执行：
-- ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_phone_key;

-- 学校表
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  admin_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 教师表
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(11) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(50) NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'teacher' CHECK (role IN ('super_admin', 'admin', 'teacher')),
  is_active BOOLEAN DEFAULT TRUE,
  avatar_emoji VARCHAR(10) DEFAULT '🧑‍🏫',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 班级表
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 学生表
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  points INT DEFAULT 0 CHECK (points >= 0),
  avatar_emoji VARCHAR(10) DEFAULT '🌟',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 积分变动原因预设表
CREATE TABLE IF NOT EXISTS reason_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  label VARCHAR(50) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('add', 'deduct')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 积分变动记录表
CREATE TABLE IF NOT EXISTS point_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  points_change INT NOT NULL,
  reason VARCHAR(200) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('add', 'deduct')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 礼物表
CREATE TABLE IF NOT EXISTS gifts (
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
);

-- 兑换记录表
CREATE TABLE IF NOT EXISTS exchange_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  gift_id UUID NOT NULL REFERENCES gifts(id),
  points_spent INT NOT NULL,
  exchanged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 教师设置表
CREATE TABLE IF NOT EXISTS teacher_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID UNIQUE NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  sound_volume FLOAT DEFAULT 0.5 CHECK (sound_volume >= 0 AND sound_volume <= 1),
  animations_reduced BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 索引 =====

CREATE INDEX IF NOT EXISTS idx_schools_name ON schools USING btree (name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_phone ON teachers(phone);
CREATE INDEX IF NOT EXISTS idx_students_name ON students USING btree (name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_classes_name ON classes USING btree (name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_gifts_school_id ON gifts(school_id);
CREATE INDEX IF NOT EXISTS idx_gifts_name ON gifts USING btree (name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_gifts_active ON gifts(is_active);
CREATE INDEX IF NOT EXISTS idx_point_records_student_id ON point_records(student_id);
CREATE INDEX IF NOT EXISTS idx_point_records_created_at ON point_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_records_student_id ON exchange_records(student_id);
CREATE INDEX IF NOT EXISTS idx_exchange_records_exchanged_at ON exchange_records(exchanged_at DESC);
