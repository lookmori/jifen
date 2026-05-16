import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/gifts — 获取礼物列表
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '12')));
  const search = searchParams.get('search') || '';
  const showInactive = searchParams.get('showInactive') === 'true';
  const offset = (page - 1) * pageSize;

  try {
    const schoolFilter = session.role === 'super_admin'
      ? sql``
      : sql`AND school_id = ${session.schoolId}`;

    let countResult;
    let gifts;
    if (search) {
      const searchPattern = `%${search}%`;
      countResult = await sql`
        SELECT COUNT(*)::int as total FROM gifts
        WHERE TRUE ${schoolFilter}
          ${showInactive ? sql`` : sql`AND is_active = true`}
          AND name ILIKE ${searchPattern}
      `;
      gifts = await sql`
        SELECT * FROM gifts
        WHERE TRUE ${schoolFilter}
          ${showInactive ? sql`` : sql`AND is_active = true`}
          AND name ILIKE ${searchPattern}
        ORDER BY points_price ASC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
    } else {
      countResult = await sql`
        SELECT COUNT(*)::int as total FROM gifts
        WHERE TRUE ${schoolFilter}
          ${showInactive ? sql`` : sql`AND is_active = true`}
      `;
      gifts = await sql`
        SELECT * FROM gifts
        WHERE TRUE ${schoolFilter}
          ${showInactive ? sql`` : sql`AND is_active = true`}
        ORDER BY points_price ASC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
    }

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / pageSize);
    return NextResponse.json({
      success: true, data: gifts,
      pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (error) {
    console.error('GET gifts error:', error);
    return NextResponse.json({ success: false, error: '查询礼物失败' }, { status: 500 });
  }
}

// POST /api/gifts — 创建礼物（仅管理员）
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  if (session.role !== 'admin' && session.role !== 'super_admin') return NextResponse.json({ success: false, error: '仅管理员可操作' }, { status: 403 });

  try {
    const { name, description, imageUrl, pointsPrice, stock, emoji } = await request.json();
    if (!name?.trim() || !imageUrl?.trim() || !pointsPrice || pointsPrice <= 0) {
      return NextResponse.json({ success: false, error: '请填写名称、图片地址和积分价格' }, { status: 400 });
    }

    const [gift] = await sql`
      INSERT INTO gifts (school_id, name, description, image_url, points_price, stock, emoji)
      VALUES (${session.schoolId}, ${name.trim()}, ${description?.trim() || ''}, ${imageUrl.trim()}, ${pointsPrice}, ${stock ?? -1}, ${emoji?.trim() || '🎁'})
      RETURNING *
    `;
    return NextResponse.json({ success: true, data: gift });
  } catch (error) {
    console.error('POST gift error:', error);
    return NextResponse.json({ success: false, error: '创建礼物失败' }, { status: 500 });
  }
}
