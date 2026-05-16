import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/leaderboard — 积分排行榜
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const classId = searchParams.get('classId') || '';
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '30')));

  try {
    // 管理员看全校学生排行榜，教师只看自己班级的学生
    if (session.role === 'admin' || session.role === 'super_admin') {
      const schoolScope = session.role === 'super_admin'
        ? sql``
        : sql`WHERE c.teacher_id IN (SELECT id FROM teachers WHERE school_id = ${session.schoolId})`;

      if (session.role === 'super_admin') {
        const students = await sql`
          SELECT s.id, s.name, s.points, s.avatar_emoji, c.name as class_name
          FROM students s
          JOIN classes c ON s.class_id = c.id
          ORDER BY s.points DESC
          LIMIT ${limit}
        `;
        const classes = await sql`
          SELECT id, name FROM classes ORDER BY name
        `;
        return NextResponse.json({ success: true, data: students, classes });
      }

      const students = await sql`
        SELECT s.id, s.name, s.points, s.avatar_emoji, c.name as class_name
        FROM students s
        JOIN classes c ON s.class_id = c.id
        WHERE c.teacher_id IN (SELECT id FROM teachers WHERE school_id = ${session.schoolId})
        ORDER BY s.points DESC
        LIMIT ${limit}
      `;
      const classes = await sql`
        SELECT id, name FROM classes
        WHERE teacher_id IN (SELECT id FROM teachers WHERE school_id = ${session.schoolId})
        ORDER BY name
      `;
      return NextResponse.json({ success: true, data: students, classes });
    }

    const students = classId
      ? await sql`
          SELECT s.id, s.name, s.points, s.avatar_emoji, c.name as class_name
          FROM students s
          JOIN classes c ON s.class_id = c.id
          WHERE s.class_id = ${classId} AND c.teacher_id = ${session.teacherId}
          ORDER BY s.points DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT s.id, s.name, s.points, s.avatar_emoji, c.name as class_name
          FROM students s
          JOIN classes c ON s.class_id = c.id
          WHERE c.teacher_id = ${session.teacherId}
          ORDER BY s.points DESC
          LIMIT ${limit}
        `;

    // 获取班级列表用于筛选
    const classes = await sql`
      SELECT id, name FROM classes WHERE teacher_id = ${session.teacherId} ORDER BY name
    `;

    return NextResponse.json({ success: true, data: students, classes });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ success: false, error: '查询排行榜失败' }, { status: 500 });
  }
}
