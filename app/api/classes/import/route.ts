import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  if (session.role !== 'teacher') {
    return NextResponse.json({ success: false, error: '仅教师可以导入班级' }, { status: 403 });
  }

  try {
    const { items } = await request.json();
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: '没有要导入的数据' }, { status: 400 });
    }

    let success = 0;
    let failed = 0;

    for (const item of items) {
      try {
        const name = item.name?.trim();
        if (!name) { failed++; continue; }
        await sql`INSERT INTO classes (name, teacher_id) VALUES (${name}, ${session.teacherId})`;
        success++;
      } catch { failed++; }
    }

    return NextResponse.json({ success: true, data: { total: items.length, success, failed } });
  } catch (error) {
    return NextResponse.json({ success: false, error: '导入失败' }, { status: 500 });
  }
}
