import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/admin/teachers — 分页+搜索教师列表
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '12')));
  const search = searchParams.get('search') || '';
  const schoolId = searchParams.get('schoolId') || '';
  const offset = (page - 1) * pageSize;

  try {
    const isSuperAdmin = session.phone === 'admin';

    // 动态构建 WHERE 条件
    const conditions = [sql`t.phone != 'admin'`];

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(sql`(t.name ILIKE ${searchPattern} OR t.phone ILIKE ${searchPattern})`);
    }

    // 学校过滤：非超级管理员只能看自己学校的教师
    if (isSuperAdmin) {
      if (schoolId) {
        conditions.push(sql`t.school_id = ${schoolId}`);
      }
    } else {
      conditions.push(sql`t.school_id = ${session.schoolId}`);
    }

    let whereFull = conditions.length > 0 ? sql`WHERE ${conditions[0]}` : sql``;
    for (let i = 1; i < conditions.length; i++) {
      whereFull = sql`${whereFull} AND ${conditions[i]}`;
    }

    const countResult = await sql`
      SELECT COUNT(*)::int as total FROM teachers t
      ${whereFull}
    `;
    const total = countResult[0].total;

    const teachers = await sql`
      SELECT t.id, t.phone, t.name, t.school_id, t.role, t.is_active, t.avatar_emoji, t.created_at,
             s.name as school_name
      FROM teachers t
      LEFT JOIN schools s ON t.school_id = s.id
      ${whereFull}
      ORDER BY t.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: teachers,
      pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (error) {
    console.error('GET /api/admin/teachers error:', error);
    return NextResponse.json({ success: false, error: '查询教师列表失败' }, { status: 500 });
  }
}

// POST /api/admin/teachers — 创建教师
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  }

  try {
    const { name, phone, schoolId, role = 'teacher', password = '123456' } = await request.json();

    // 非超级管理员只能在自己学校创建教师
    if (session.phone !== 'admin' && schoolId !== session.schoolId) {
      return NextResponse.json({ success: false, error: '只能在自己学校创建教师' }, { status: 403 });
    }

    if (!name || !phone || !schoolId) {
      return NextResponse.json({ success: false, error: '姓名、手机号、所属学校不能为空' }, { status: 400 });
    }

    if (!/^1\d{10}$/.test(phone)) {
      return NextResponse.json({ success: false, error: '手机号格式不正确' }, { status: 400 });
    }

    // 检查同一学校内手机号是否已存在
    const existing = await sql`SELECT id FROM teachers WHERE phone = ${phone} AND school_id = ${schoolId}`;
    if (existing.length > 0) {
      return NextResponse.json({ success: false, error: '该手机号在此学校已被使用' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await sql`
      INSERT INTO teachers (name, phone, password_hash, school_id, role)
      VALUES (${name.trim()}, ${phone}, ${passwordHash}, ${schoolId}, ${role})
      RETURNING id, name, phone, school_id, role, is_active, avatar_emoji, created_at
    `;

    // 同时创建设置记录
    await sql`
      INSERT INTO teacher_settings (teacher_id)
      VALUES (${result[0].id})
    `;

    // 如果角色为 admin，更新学校的 admin_id
    if (role === 'admin') {
      await sql`UPDATE schools SET admin_id = ${result[0].id} WHERE id = ${schoolId}`;
    }

    return NextResponse.json({
      success: true,
      data: { ...result[0], initialPassword: password },
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/teachers error:', error);
    return NextResponse.json({ success: false, error: '创建教师失败' }, { status: 500 });
  }
}
