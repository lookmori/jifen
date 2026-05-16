import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// 硬编码超级管理员凭据，不受数据库清除影响
const SUPER_ADMIN_PHONE = 'admin';
const SUPER_ADMIN_PASSWORD = '123456';

async function doLogin(teacher: Record<string, any>) {
  const token = await signToken({
    teacherId: teacher.id,
    schoolId: teacher.school_id,
    role: teacher.role as 'admin' | 'teacher',
    name: teacher.name,
    phone: teacher.phone,
  });

  await setSessionCookie(token);

  const [settings] = await sql`
    INSERT INTO teacher_settings (teacher_id) VALUES (${teacher.id})
    ON CONFLICT (teacher_id) DO NOTHING
    RETURNING sound_enabled, sound_volume, animations_reduced
  `;

  return NextResponse.json({
    success: true,
    data: {
      teacherId: teacher.id,
      schoolId: teacher.school_id,
      role: teacher.role,
      name: teacher.name,
      phone: teacher.phone,
      settings: settings || null,
    },
  });
}

export async function POST(request: Request) {
  try {
    const { phone, password, schoolId } = await request.json();

    if (!phone || !password) {
      return NextResponse.json({ success: false, error: '手机号和密码不能为空' }, { status: 400 });
    }

    // 超级管理员硬编码凭据：跳过常规流程，确保始终可用
    if (phone === SUPER_ADMIN_PHONE && password === SUPER_ADMIN_PASSWORD) {
      // 尝试从数据库查找管理员记录
      let [admin] = await sql`
        SELECT t.id, t.phone, t.name, t.school_id, t.role, t.is_active, t.avatar_emoji
        FROM teachers t
        WHERE t.phone = ${phone} AND t.role = 'admin'
        LIMIT 1
      `;

      // 如果数据库中没有该管理员记录，自动创建
      if (!admin) {
        let [school] = await sql`SELECT id FROM schools LIMIT 1`;
        if (!school) {
          [school] = await sql`INSERT INTO schools (name) VALUES ('默认学校') RETURNING id`;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        [admin] = await sql`
          INSERT INTO teachers (name, phone, password_hash, school_id, role)
          VALUES ('超级管理员', ${phone}, ${passwordHash}, ${school.id}, 'admin')
          RETURNING id, phone, name, school_id, role, is_active, avatar_emoji
        `;

        await sql`
          INSERT INTO teacher_settings (teacher_id) VALUES (${admin.id})
          ON CONFLICT DO NOTHING
        `;
      }

      return doLogin(admin);
    }

    // ====== 以下为常规登录流程 ======

    // 查找该手机号所有活跃教师记录
    const teachers = await sql`
      SELECT t.id, t.phone, t.password_hash, t.name, t.school_id, t.role, t.is_active, t.avatar_emoji,
             s.name as school_name
      FROM teachers t
      LEFT JOIN schools s ON t.school_id = s.id
      WHERE t.phone = ${phone} AND t.is_active = TRUE
    `;

    if (teachers.length === 0) {
      return NextResponse.json({ success: false, error: '账号不存在' }, { status: 401 });
    }

    // 如果指定了 schoolId，精确匹配
    if (schoolId) {
      const teacher = teachers.find(t => t.school_id === schoolId);
      if (!teacher) {
        return NextResponse.json({ success: false, error: '账号不存在' }, { status: 401 });
      }

      const valid = await bcrypt.compare(password, teacher.password_hash);
      if (!valid) {
        return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 });
      }

      return doLogin(teacher);
    }

    // 未指定 schoolId：找出所有密码匹配的记录
    const matchedTeachers = [];
    for (const t of teachers) {
      const valid = await bcrypt.compare(password, t.password_hash);
      if (valid) {
        matchedTeachers.push(t);
      }
    }

    if (matchedTeachers.length === 0) {
      return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 });
    }

    // 只有一条匹配记录，直接登录
    if (matchedTeachers.length === 1) {
      return doLogin(matchedTeachers[0]);
    }

    // 多条匹配记录，需要选择学校
    return NextResponse.json({
      success: true,
      needsSchoolSelect: true,
      schools: matchedTeachers.map(t => ({
        teacherId: t.id,
        schoolId: t.school_id,
        schoolName: t.school_name || '未知学校',
        name: t.name,
      })),
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: '登录失败，请稍后重试' }, { status: 500 });
  }
}
