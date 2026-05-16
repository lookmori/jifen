-- seed.sql — 初始化默认管理员账号
-- 在 Neon SQL Editor 或 psql 中执行

-- 1. 创建默认学校
INSERT INTO schools (id, name) VALUES
  (gen_random_uuid(), '默认学校');

-- 2. 创建超级管理员 (密码 123456 的 bcrypt 哈希)
-- phone: 13800000000
-- password: 123456
INSERT INTO teachers (id, phone, password_hash, name, school_id, role, is_active, avatar_emoji)
SELECT
  gen_random_uuid(),
  '13800000000',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '超级管理员',
  (SELECT id FROM schools WHERE name = '默认学校' LIMIT 1),
  'admin',
  TRUE,
  '👑'
WHERE EXISTS (SELECT 1 FROM schools WHERE name = '默认学校');
