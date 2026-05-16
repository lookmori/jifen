import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/classes/[id]/students — 获取班级学生列表 (分页+搜索)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  const { id: classId } = await params;
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '12')));
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'points';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * pageSize;

  try {
    // 校验班级是否归当前教师管辖
    if (session.role !== 'admin') {
      const classOwner = await sql`
        SELECT 1 FROM classes WHERE id = ${classId} AND teacher_id = ${session.teacherId} LIMIT 1
      `;
      if (classOwner.length === 0) {
        return NextResponse.json({ success: false, error: '班级不存在或无权限' }, { status: 403 });
      }
    }

    const searchPattern = search ? `%${search}%` : '';

    const countResult = await sql`
      SELECT COUNT(*)::int as total FROM students
      WHERE class_id = ${classId}
        AND (${search} = '' OR name ILIKE ${searchPattern})
    `;
    const total = countResult[0].total;

    const allowedSorts: Record<string, string> = { points: 'points', name: 'name', created_at: 'created_at' };
    const sortCol = allowedSorts[sortBy] || 'points';
    const isAsc = sortOrder === 'ASC';

    const baseQuery = sql`SELECT * FROM students WHERE class_id = ${classId} AND (${search} = '' OR name ILIKE ${searchPattern})`;

    const students = sortCol === 'name'
      ? await sql`${baseQuery} ORDER BY name ${isAsc ? sql`ASC` : sql`DESC`} LIMIT ${pageSize} OFFSET ${offset}`
      : sortCol === 'created_at'
        ? await sql`${baseQuery} ORDER BY created_at ${isAsc ? sql`ASC` : sql`DESC`} LIMIT ${pageSize} OFFSET ${offset}`
        : await sql`${baseQuery} ORDER BY points ${isAsc ? sql`ASC` : sql`DESC`} LIMIT ${pageSize} OFFSET ${offset}`;

    const totalPages = Math.ceil(total / pageSize);
    return NextResponse.json({
      success: true, data: students,
      pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (error) {
    console.error('GET students error:', error);
    return NextResponse.json({ success: false, error: '查询学生列表失败' }, { status: 500 });
  }
}
