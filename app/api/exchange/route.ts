import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// POST /api/exchange — 执行兑换
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  try {
    const { studentId, giftId } = await request.json();
    if (!studentId || !giftId) {
      return NextResponse.json({ success: false, error: '请选择学生和礼物' }, { status: 400 });
    }

    // 获取学生信息，同时校验学生是否属于当前教师的班级
    const [student] = await sql`
      SELECT s.* FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = ${studentId}
        AND c.teacher_id = ${session.teacherId}
    `;
    if (!student) return NextResponse.json({ success: false, error: '学生不存在或不属于您的班级' }, { status: 404 });

    const [gift] = await sql`
      SELECT * FROM gifts WHERE id = ${giftId} AND is_active = true AND school_id = ${session.schoolId}
    `;
    if (!gift) return NextResponse.json({ success: false, error: '礼物不存在或已下架' }, { status: 404 });

    // 校验积分
    if (student.points < gift.points_price) {
      return NextResponse.json({
        success: false,
        error: `积分不足！需要 ${gift.points_price} 分，当前只有 ${student.points} 分`,
        data: { required: gift.points_price, current: student.points },
      }, { status: 400 });
    }

    // 校验库存
    if (gift.stock === 0) {
      return NextResponse.json({ success: false, error: '礼物已兑换完啦~' }, { status: 400 });
    }

    // 事务：扣积分 + 扣库存 + 写记录
    const [record] = await sql`
      INSERT INTO exchange_records (student_id, gift_id, points_spent)
      VALUES (${studentId}, ${giftId}, ${gift.points_price})
      RETURNING *
    `;

    const [updatedStudent] = await sql`
      UPDATE students SET points = points - ${gift.points_price}
      WHERE id = ${studentId}
      RETURNING *
    `;

    if (gift.stock > 0) {
      await sql`UPDATE gifts SET stock = stock - 1 WHERE id = ${giftId} AND stock > 0`;
    }

    return NextResponse.json({
      success: true,
      data: {
        record,
        student: updatedStudent,
        gift: { id: gift.id, name: gift.name, emoji: gift.emoji },
      },
    });
  } catch (error) {
    console.error('POST /api/exchange error:', error);
    return NextResponse.json({ success: false, error: '兑换失败' }, { status: 500 });
  }
}

// GET /api/exchange — 获取可兑换礼物列表
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '12')));
  const search = searchParams.get('search') || '';
  const offset = (page - 1) * pageSize;

  try {
    const searchPattern = search ? `%${search}%` : '';

    const [countResult] = await sql`
      SELECT COUNT(*)::int as total FROM gifts
      WHERE is_active = true AND school_id = ${session.schoolId}
        AND (${search} = '' OR name ILIKE ${searchPattern})
    `;
    const total = countResult.total;

    const gifts = await sql`
      SELECT * FROM gifts
      WHERE is_active = true AND school_id = ${session.schoolId}
        AND (${search} = '' OR name ILIKE ${searchPattern})
      ORDER BY points_price ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const totalPages = Math.ceil(total / pageSize);
    return NextResponse.json({
      success: true, data: gifts,
      pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: '查询礼物失败' }, { status: 500 });
  }
}
