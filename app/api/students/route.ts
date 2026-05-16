import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { randomEmoji } from '@/lib/utils';

// POST /api/students — 创建学生
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  try {
    const { name, classId } = await request.json();
    if (!name?.trim() || !classId) {
      return NextResponse.json({ success: false, error: '姓名和班级不能为空' }, { status: 400 });
    }

    // 校验班级是否归当前教师管辖
    if (session.role !== 'admin') {
      const classOwner = await sql`
        SELECT 1 FROM classes WHERE id = ${classId} AND teacher_id = ${session.teacherId} LIMIT 1
      `;
      if (classOwner.length === 0) {
        return NextResponse.json({ success: false, error: '班级不存在或无权限' }, { status: 403 });
      }
    }

    const emoji = randomEmoji();
    const result = await sql`
      INSERT INTO students (name, class_id, avatar_emoji) VALUES (${name.trim()}, ${classId}, ${emoji})
      RETURNING *
    `;
    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('POST student error:', error);
    return NextResponse.json({ success: false, error: '添加学生失败' }, { status: 500 });
  }
}

// GET /api/students — 跨班级搜索学生 (兑换页用)
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') || '';
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));

  try {
    const searchPattern = search ? `%${search}%` : '';

    // 教师只看自己班级的学生，管理员看全校学生
    const scopeFilter = session.role === 'admin'
      ? sql`AND c.teacher_id IN (SELECT id FROM teachers WHERE school_id = ${session.schoolId})`
      : sql`AND c.teacher_id = ${session.teacherId}`;

    const students = await sql`
      SELECT s.*, c.name as class_name FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE (${search} = '' OR s.name ILIKE ${searchPattern})
        ${scopeFilter}
      ORDER BY s.points DESC
      LIMIT ${pageSize}
    `;
    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    console.error('GET students error:', error);
    return NextResponse.json({ success: false, error: '搜索失败' }, { status: 500 });
  }
}
