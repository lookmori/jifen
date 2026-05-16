import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// PUT /api/classes/[id] — 更新班级
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  const { id } = await params;

  try {
    const { name } = await request.json();
    const result = await sql`
      UPDATE classes SET name = COALESCE(${name?.trim() || null}, name)
      WHERE id = ${id} AND teacher_id = ${session.teacherId}
      RETURNING *
    `;
    if (result.length === 0) return NextResponse.json({ success: false, error: '班级不存在或无权限' }, { status: 404 });
    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}

// DELETE /api/classes/[id] — 删除班级
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  const { id } = await params;

  try {
    // 先删除班级下学生的兑换记录（exchange_records 没有 ON DELETE CASCADE）
    await sql`
      DELETE FROM exchange_records WHERE student_id IN (
        SELECT id FROM students WHERE class_id = ${id}
      )
    `;
    const result = await sql`
      DELETE FROM classes WHERE id = ${id} AND teacher_id = ${session.teacherId}
      RETURNING id
    `;
    if (result.length === 0) return NextResponse.json({ success: false, error: '班级不存在或无权限' }, { status: 404 });
    return NextResponse.json({ success: true, data: { id: result[0].id } });
  } catch (error) {
    console.error('DELETE class error:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
