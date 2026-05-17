import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/classes/[id]/moments — 获取班级精彩瞬间（带图片的积分记录）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  const { id: classId } = await params;
  const { searchParams } = request.nextUrl;
  const studentId = searchParams.get('studentId') || '';

  try {
    // 校验班级归属
    if (session.role === 'teacher') {
      const [ownership] = await sql`
        SELECT 1 FROM classes WHERE id = ${classId} AND teacher_id = ${session.teacherId} LIMIT 1
      `;
      if (!ownership) {
        return NextResponse.json({ success: false, error: '无权访问该班级' }, { status: 403 });
      }
    }

    // 获取班级信息
    const [classInfo] = await sql`
      SELECT c.id, c.name, t.name as teacher_name
      FROM classes c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      WHERE c.id = ${classId}
    `;

    if (!classInfo) {
      return NextResponse.json({ success: false, error: '班级不存在' }, { status: 404 });
    }

    // 获取学生列表（带图片记录的才返回）
    let studentCondition = sql`pr.student_id = s.id`;
    if (studentId) {
      studentCondition = sql`pr.student_id = s.id AND s.id = ${studentId}`;
    }

    const students = await sql`
      SELECT DISTINCT s.id, s.name, s.points, s.avatar_emoji
      FROM students s
      JOIN point_records pr ON pr.student_id = s.id
      WHERE s.class_id = ${classId} AND pr.image_url IS NOT NULL
        AND ${studentCondition}
      ORDER BY s.points DESC
    `;

    // 获取每个学生的精彩瞬间图片
    const result = [];
    for (const student of students) {
      const moments = await sql`
        SELECT pr.id, pr.points_change, pr.reason, pr.type, pr.image_url, pr.created_at,
               t.name as teacher_name
        FROM point_records pr
        LEFT JOIN teachers t ON pr.teacher_id = t.id
        WHERE pr.student_id = ${student.id} AND pr.image_url IS NOT NULL
        ORDER BY pr.created_at DESC
      `;
      result.push({
        ...student,
        moments: moments.map((m: Record<string, unknown>) => ({
          id: m.id,
          points_change: m.points_change,
          reason: m.reason,
          type: m.type,
          image_url: m.image_url,
          teacher_name: m.teacher_name,
          created_at: m.created_at,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        class: classInfo,
        students: result,
      },
    });
  } catch (error) {
    console.error('GET moments error:', error);
    return NextResponse.json({ success: false, error: '查询精彩瞬间失败' }, { status: 500 });
  }
}
