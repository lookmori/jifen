import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST /api/seed — 初始化默认管理员
export async function POST() {
  try {
    // 检查是否已有管理员
    const [adminCount] = await sql`SELECT COUNT(*)::int as total FROM teachers WHERE phone = 'admin'`;
    if (adminCount.total > 0) {
      return NextResponse.json({
        success: true, message: '管理员已存在',
        data: { phone: 'admin', password: '123456', role: 'admin' },
      });
    }

    // 确保有学校
    let school: { id: string; name: string } | null = null;
    const [existing] = await sql`SELECT * FROM schools LIMIT 1`;
    if (existing) {
      school = existing as { id: string; name: string };
    } else {
      const [created] = await sql`INSERT INTO schools (name) VALUES ('默认学校') RETURNING *`;
      school = created as { id: string; name: string };
    }

    // 创建管理员 (phone: admin, password: 123456)
    const hash = await bcrypt.hash('123456', 10);
    const [teacher] = await sql`
      INSERT INTO teachers (phone, password_hash, name, school_id, role, is_active, avatar_emoji)
      VALUES ('admin', ${hash}, '超级管理员', ${school!.id}, 'admin', TRUE, '👑')
      RETURNING id, phone, name, role
    `;

    return NextResponse.json({
      success: true,
      message: '初始化完成',
      data: {
        phone: 'admin',
        password: '123456',
        role: teacher.role,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: '初始化失败' }, { status: 500 });
  }
}
