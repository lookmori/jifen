import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// POST /api/students/[id]/points — 调整积分
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  const { id: studentId } = await params;

  try {
    const { pointsChange, reason, type } = await request.json();

    if (!pointsChange || pointsChange <= 0 || !reason || !type) {
      return NextResponse.json({ success: false, error: '参数不完整' }, { status: 400 });
    }

    if (!['add', 'deduct'].includes(type)) {
      return NextResponse.json({ success: false, error: '类型错误' }, { status: 400 });
    }

    // 校验学生所属班级是否归当前教师管辖
    if (session.role === 'teacher') {
      const ownership = await sql`
        SELECT 1 FROM students s
        JOIN classes c ON s.class_id = c.id
        WHERE s.id = ${studentId} AND c.teacher_id = ${session.teacherId}
        LIMIT 1
      `;
      if (ownership.length === 0) {
        return NextResponse.json({ success: false, error: '学生不属于您的班级' }, { status: 403 });
      }
    }

    const actualChange = type === 'deduct' ? -Math.abs(pointsChange) : Math.abs(pointsChange);

    // 事务：写记录 + 更新积分
    const [record] = await sql`
      INSERT INTO point_records (student_id, teacher_id, points_change, reason, type)
      VALUES (${studentId}, ${session.teacherId}, ${actualChange}, ${reason}, ${type})
      RETURNING *
    `;

    const [student] = await sql`
      UPDATE students SET points = GREATEST(0, points + ${actualChange})
      WHERE id = ${studentId}
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: { record, student } });
  } catch (error) {
    console.error('POST points error:', error);
    return NextResponse.json({ success: false, error: '调整积分失败' }, { status: 500 });
  }
}

// GET /api/students/[id]/points — 获取积分记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  const { id: studentId } = await params;
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
  const offset = (page - 1) * pageSize;

  try {
    // 校验学生所属班级是否归当前教师管辖
    if (session.role === 'teacher') {
      const ownership = await sql`
        SELECT 1 FROM students s
        JOIN classes c ON s.class_id = c.id
        WHERE s.id = ${studentId} AND c.teacher_id = ${session.teacherId}
        LIMIT 1
      `;
      if (ownership.length === 0) {
        return NextResponse.json({ success: false, error: '学生不属于您的班级' }, { status: 403 });
      }
    }

    const [countResult] = await sql`
      SELECT COUNT(*)::int as total FROM point_records WHERE student_id = ${studentId}
    `;
    const total = countResult.total;

    const records = await sql`
      SELECT pr.*, t.name as teacher_name
      FROM point_records pr
      LEFT JOIN teachers t ON pr.teacher_id = t.id
      WHERE pr.student_id = ${studentId}
      ORDER BY pr.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const totalPages = Math.ceil(total / pageSize);
    return NextResponse.json({
      success: true, data: records,
      pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: '查询积分记录失败' }, { status: 500 });
  }
}
