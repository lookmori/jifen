import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// PUT /api/admin/schools/[id] — 更新学校
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { name, adminId } = await request.json();

    const updates: string[] = [];
    const values: Record<string, string> = {};

    if (name) {
      values.name = name.trim();
    }
    if (adminId !== undefined) {
      values.admin_id = adminId;
    }

    const result = await sql`
      UPDATE schools SET
        name = COALESCE(${values.name || null}, name),
        admin_id = ${values.admin_id !== undefined ? values.admin_id : sql`admin_id`}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: '学校不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('PUT /api/admin/schools error:', error);
    return NextResponse.json({ success: false, error: '更新学校失败' }, { status: 500 });
  }
}

// DELETE /api/admin/schools/[id] — 删除学校 (级联删除)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const result = await sql`
      DELETE FROM schools WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: '学校不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id: result[0].id } });
  } catch (error) {
    console.error('DELETE /api/admin/schools error:', error);
    return NextResponse.json({ success: false, error: '删除学校失败' }, { status: 500 });
  }
}
