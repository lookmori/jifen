import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { randomEmoji } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  try {
    const { classId, items } = await request.json();
    if (!classId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: '班级ID和数据不能为空' }, { status: 400 });
    }

    // 校验班级是否归当前教师管辖
    if (session.role === 'teacher') {
      const classOwner = await sql`
        SELECT 1 FROM classes WHERE id = ${classId} AND teacher_id = ${session.teacherId} LIMIT 1
      `;
      if (classOwner.length === 0) {
        return NextResponse.json({ success: false, error: '班级不存在或无权限' }, { status: 403 });
      }
    }

    let success = 0;
    let failed = 0;

    for (const item of items) {
      try {
        const name = item.name?.trim();
        if (!name) { failed++; continue; }
        const emoji = randomEmoji();
        await sql`INSERT INTO students (name, class_id, avatar_emoji) VALUES (${name}, ${classId}, ${emoji})`;
        success++;
      } catch { failed++; }
    }

    return NextResponse.json({ success: true, data: { total: items.length, success, failed } });
  } catch (error) {
    return NextResponse.json({ success: false, error: '导入失败' }, { status: 500 });
  }
}
