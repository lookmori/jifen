import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/classes — 分页+搜索班级列表
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '12')));
  const search = searchParams.get('search') || '';
  const offset = (page - 1) * pageSize;

  try {
    const searchPattern = search ? `%${search}%` : '';
    // 教师只看自己的班级，管理员看所属学校的所有班级
    const ownerFilter = session.role === 'admin'
      ? sql`AND c.teacher_id IN (SELECT id FROM teachers WHERE school_id = ${session.schoolId})`
      : sql`AND c.teacher_id = ${session.teacherId}`;

    const countResult = await sql`
      SELECT COUNT(*)::int as total FROM classes c
      WHERE (${search} = '' OR c.name ILIKE ${searchPattern})
      ${ownerFilter}
    `;
    const total = countResult[0].total;

    const classes = await sql`
      SELECT c.*, t.name as teacher_name,
             (SELECT COUNT(*)::int FROM students WHERE class_id = c.id) as student_count
      FROM classes c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      WHERE (${search} = '' OR c.name ILIKE ${searchPattern})
      ${ownerFilter}
      ORDER BY c.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const totalPages = Math.ceil(total / pageSize);
    return NextResponse.json({
      success: true, data: classes,
      pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (error) {
    console.error('GET /api/classes error:', error);
    return NextResponse.json({ success: false, error: '查询班级列表失败' }, { status: 500 });
  }
}

// POST /api/classes — 创建班级 (仅教师)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  // 只有教师可以创建班级，管理员通过后台管理学校/教师
  if (session.role !== 'teacher') {
    return NextResponse.json({ success: false, error: '仅教师可以创建班级' }, { status: 403 });
  }

  try {
    const { name } = await request.json();
    if (!name?.trim()) return NextResponse.json({ success: false, error: '班级名称不能为空' }, { status: 400 });

    const result = await sql`
      INSERT INTO classes (name, teacher_id) VALUES (${name.trim()}, ${session.teacherId})
      RETURNING *
    `;
    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('POST /api/classes error:', error);
    return NextResponse.json({ success: false, error: '创建班级失败' }, { status: 500 });
  }
}
