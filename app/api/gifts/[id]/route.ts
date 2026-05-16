import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// PUT /api/gifts/[id] — 更新礼物（仅管理员）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  if (session.role !== 'admin' && session.role !== 'super_admin') return NextResponse.json({ success: false, error: '仅管理员可操作' }, { status: 403 });

  const { id } = await params;

  try {
    const { name, description, imageUrl, pointsPrice, stock, emoji } = await request.json();

    const [gift] = await sql`
      UPDATE gifts SET
        name = COALESCE(${name?.trim() || null}, name),
        description = COALESCE(${description?.trim() ?? null}, description),
        image_url = COALESCE(${imageUrl?.trim() || null}, image_url),
        points_price = COALESCE(${pointsPrice || null}, points_price),
        stock = COALESCE(${stock !== undefined ? stock : null}, stock),
        emoji = COALESCE(${emoji?.trim() || null}, emoji)
      WHERE id = ${id} AND school_id = ${session.schoolId}
      RETURNING *
    `;
    if (!gift) return NextResponse.json({ success: false, error: '礼物不存在或无权限' }, { status: 404 });
    return NextResponse.json({ success: true, data: gift });
  } catch (error) {
    console.error('PUT gift error:', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}

// DELETE /api/gifts/[id] — 删除礼物（仅管理员）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  if (session.role !== 'admin' && session.role !== 'super_admin') return NextResponse.json({ success: false, error: '仅管理员可操作' }, { status: 403 });

  const { id } = await params;

  try {
    const result = await sql`
      DELETE FROM gifts WHERE id = ${id} AND school_id = ${session.schoolId}
      RETURNING id
    `;
    if (result.length === 0) return NextResponse.json({ success: false, error: '礼物不存在或无权限' }, { status: 404 });
    return NextResponse.json({ success: true, data: { id: result[0].id } });
  } catch (error) {
    console.error('DELETE gift error:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}

// PATCH /api/gifts/[id] — 切换上架/下架（仅管理员）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  if (session.role !== 'admin' && session.role !== 'super_admin') return NextResponse.json({ success: false, error: '仅管理员可操作' }, { status: 403 });

  const { id } = await params;

  try {
    const { isActive } = await request.json();
    const [gift] = await sql`
      UPDATE gifts SET is_active = ${isActive}
      WHERE id = ${id} AND school_id = ${session.schoolId}
      RETURNING *
    `;
    if (!gift) return NextResponse.json({ success: false, error: '礼物不存在或无权限' }, { status: 404 });
    return NextResponse.json({ success: true, data: gift });
  } catch (error) {
    console.error('PATCH gift error:', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}
