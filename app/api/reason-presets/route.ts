import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/reason-presets — 获取原因预设
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  const type = request.nextUrl.searchParams.get('type') || '';

  try {
    const presets = type
      ? await sql`SELECT * FROM reason_presets WHERE school_id = ${session.schoolId} AND type = ${type} ORDER BY created_at ASC`
      : await sql`SELECT * FROM reason_presets WHERE school_id = ${session.schoolId} ORDER BY type, created_at ASC`;
    return NextResponse.json({ success: true, data: presets });
  } catch (error) {
    console.error('GET reason presets error:', error);
    return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
  }
}

// POST /api/reason-presets — 创建原因预设
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  try {
    const { label, type } = await request.json();
    if (!label?.trim() || !['add', 'deduct'].includes(type)) {
      return NextResponse.json({ success: false, error: '参数不完整' }, { status: 400 });
    }

    const [preset] = await sql`
      INSERT INTO reason_presets (school_id, teacher_id, label, type)
      VALUES (${session.schoolId}, ${session.teacherId}, ${label.trim()}, ${type})
      RETURNING *
    `;
    return NextResponse.json({ success: true, data: preset });
  } catch (error) {
    console.error('POST reason preset error:', error);
    return NextResponse.json({ success: false, error: '创建失败' }, { status: 500 });
  }
}

// DELETE /api/reason-presets?id=xxx — 删除原因预设
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 });

  try {
    await sql`DELETE FROM reason_presets WHERE id = ${id} AND school_id = ${session.schoolId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE reason preset error:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
