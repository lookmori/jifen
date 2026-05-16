import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/admin/schools — 分页+搜索学校列表
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '12')));
  const search = searchParams.get('search') || '';
  const offset = (page - 1) * pageSize;

  try {
    const searchPattern = search ? `%${search}%` : '';

    // 非超级管理员只能看到自己所在的学校
    const isSuperAdmin = session.role === 'super_admin';
    const schoolFilter = isSuperAdmin
      ? sql`(${search} = '' OR s.name ILIKE ${searchPattern})`
      : sql`(s.id = ${session.schoolId} AND (${search} = '' OR s.name ILIKE ${searchPattern}))`;

    const countResult = await sql`
      SELECT COUNT(*)::int as total FROM schools s
      WHERE ${schoolFilter}
    `;
    const total = countResult[0].total;

    const schools = await sql`
      SELECT s.*, t.name as admin_name
      FROM schools s
      LEFT JOIN teachers t ON s.admin_id = t.id
      WHERE ${schoolFilter}
      ORDER BY s.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: schools,
      pagination: {
        page, pageSize, total, totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/schools error:', error);
    return NextResponse.json({ success: false, error: '查询学校列表失败' }, { status: 500 });
  }
}

// POST /api/admin/schools — 创建学校（仅超级管理员）
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ success: false, error: '仅超级管理员可创建学校' }, { status: 403 });
  }

  try {
    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: '学校名称不能为空' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO schools (name) VALUES (${name.trim()})
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/schools error:', error);
    return NextResponse.json({ success: false, error: '创建学校失败' }, { status: 500 });
  }
}
