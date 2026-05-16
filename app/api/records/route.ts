import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// DELETE /api/records — 删除积分记录或兑换记录
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  try {
    const { id, recordType } = await request.json();
    if (!id || !recordType) {
      return NextResponse.json({ success: false, error: '参数不完整' }, { status: 400 });
    }

    if (recordType === 'exchange') {
      // 校验权限：兑换记录的学生必须属于当前教师的班级
      if (session.role !== 'admin') {
        const [ownership] = await sql`
          SELECT 1 FROM exchange_records er
          JOIN students s ON er.student_id = s.id
          JOIN classes c ON s.class_id = c.id
          WHERE er.id = ${id} AND c.teacher_id = ${session.teacherId}
          LIMIT 1
        `;
        if (!ownership) return NextResponse.json({ success: false, error: '无权限删除该记录' }, { status: 403 });
      }
      await sql`DELETE FROM exchange_records WHERE id = ${id}`;
    } else {
      // point record: 'add' 或 'deduct'
      if (session.role !== 'admin') {
        const [ownership] = await sql`
          SELECT 1 FROM point_records pr
          JOIN students s ON pr.student_id = s.id
          JOIN classes c ON s.class_id = c.id
          WHERE pr.id = ${id} AND c.teacher_id = ${session.teacherId}
          LIMIT 1
        `;
        if (!ownership) return NextResponse.json({ success: false, error: '无权限删除该记录' }, { status: 403 });
      }
      await sql`DELETE FROM point_records WHERE id = ${id}`;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE record error:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}

// GET /api/records — 获取积分变动 + 兑换记录
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
  const type = searchParams.get('type') || 'all';
  const studentId = searchParams.get('studentId') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const offset = (page - 1) * pageSize;

  try {
    // 获取可查看的学生ID范围：管理员看全校，教师只看自己班级
    const classStudents = session.role === 'admin'
      ? await sql`
          SELECT s.id FROM students s
          JOIN classes c ON s.class_id = c.id
          WHERE c.teacher_id IN (SELECT id FROM teachers WHERE school_id = ${session.schoolId})
        ` as { id: string }[]
      : await sql`
          SELECT s.id FROM students s
          JOIN classes c ON s.class_id = c.id
          WHERE c.teacher_id = ${session.teacherId}
        ` as { id: string }[];
    const studentIds = classStudents.map(s => s.id);

    if (studentIds.length === 0) {
      return NextResponse.json({
        success: true, data: [],
        pagination: { page, pageSize, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
      });
    }

    let total = 0;
    let records: unknown[] = [];

    if (type === 'exchange') {
      const countResult = await sql`
        SELECT COUNT(*)::int as total FROM exchange_records er
        WHERE er.student_id = ANY(${studentIds})
          ${studentId ? sql`AND er.student_id = ${studentId}` : sql``}
          ${dateFrom ? sql`AND er.exchanged_at >= ${dateFrom}::timestamptz` : sql``}
          ${dateTo ? sql`AND er.exchanged_at <= ${dateTo}::timestamptz` : sql``}
      `;
      total = countResult[0].total;
      const items = await sql`
        SELECT er.*, s.name as student_name, s.avatar_emoji as student_emoji,
               g.name as gift_name, g.emoji as gift_emoji, g.image_url as gift_image_url
        FROM exchange_records er
        JOIN students s ON er.student_id = s.id
        JOIN gifts g ON er.gift_id = g.id
        WHERE er.student_id = ANY(${studentIds})
          ${studentId ? sql`AND er.student_id = ${studentId}` : sql``}
          ${dateFrom ? sql`AND er.exchanged_at >= ${dateFrom}::timestamptz` : sql``}
          ${dateTo ? sql`AND er.exchanged_at <= ${dateTo}::timestamptz` : sql``}
        ORDER BY er.exchanged_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      records = items.map((r: Record<string, unknown>) => ({ ...r, recordType: 'exchange' }));
    } else if (type === 'point') {
      const countResult = await sql`
        SELECT COUNT(*)::int as total FROM point_records pr
        WHERE pr.student_id = ANY(${studentIds})
          ${studentId ? sql`AND pr.student_id = ${studentId}` : sql``}
          ${dateFrom ? sql`AND pr.created_at >= ${dateFrom}::timestamptz` : sql``}
          ${dateTo ? sql`AND pr.created_at <= ${dateTo}::timestamptz` : sql``}
      `;
      total = countResult[0].total;
      const items = await sql`
        SELECT pr.*, s.name as student_name, s.avatar_emoji as student_emoji
        FROM point_records pr
        JOIN students s ON pr.student_id = s.id
        WHERE pr.student_id = ANY(${studentIds})
          ${studentId ? sql`AND pr.student_id = ${studentId}` : sql``}
          ${dateFrom ? sql`AND pr.created_at >= ${dateFrom}::timestamptz` : sql``}
          ${dateTo ? sql`AND pr.created_at <= ${dateTo}::timestamptz` : sql``}
        ORDER BY pr.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      records = items.map((r: Record<string, unknown>) => ({ ...r, recordType: r.type }));
    } else {
      // Combined: get both types in a UNION
      const countResult = await sql`
        SELECT COUNT(*)::int as total FROM (
          SELECT 1 FROM point_records pr
          WHERE pr.student_id = ANY(${studentIds})
            ${studentId ? sql`AND pr.student_id = ${studentId}` : sql``}
            ${dateFrom ? sql`AND pr.created_at >= ${dateFrom}::timestamptz` : sql``}
            ${dateTo ? sql`AND pr.created_at <= ${dateTo}::timestamptz` : sql``}
          UNION ALL
          SELECT 1 FROM exchange_records er
          WHERE er.student_id = ANY(${studentIds})
            ${studentId ? sql`AND er.student_id = ${studentId}` : sql``}
            ${dateFrom ? sql`AND er.exchanged_at >= ${dateFrom}::timestamptz` : sql``}
            ${dateTo ? sql`AND er.exchanged_at <= ${dateTo}::timestamptz` : sql``}
        ) combined
      `;
      total = countResult[0].total;

      // Fetch point records with student info
      const pointItems = await sql`
        SELECT pr.id, pr.student_id, pr.teacher_id, pr.points_change, pr.reason, pr.type, pr.created_at,
               s.name as student_name, s.avatar_emoji as student_emoji,
               NULL as gift_name, NULL as gift_emoji, NULL as gift_image_url, pr.points_change as points_spent
        FROM point_records pr
        JOIN students s ON pr.student_id = s.id
        WHERE pr.student_id = ANY(${studentIds})
          ${studentId ? sql`AND pr.student_id = ${studentId}` : sql``}
          ${dateFrom ? sql`AND pr.created_at >= ${dateFrom}::timestamptz` : sql``}
          ${dateTo ? sql`AND pr.created_at <= ${dateTo}::timestamptz` : sql``}
      `;

      // Fetch exchange records with student and gift info
      const exchangeItems = await sql`
        SELECT er.id, er.student_id, NULL as teacher_id, NULL as points_change, NULL as reason,
               'exchange' as type, er.exchanged_at as created_at,
               s.name as student_name, s.avatar_emoji as student_emoji,
               g.name as gift_name, g.emoji as gift_emoji, g.image_url as gift_image_url, er.points_spent
        FROM exchange_records er
        JOIN students s ON er.student_id = s.id
        JOIN gifts g ON er.gift_id = g.id
        WHERE er.student_id = ANY(${studentIds})
          ${studentId ? sql`AND er.student_id = ${studentId}` : sql``}
          ${dateFrom ? sql`AND er.exchanged_at >= ${dateFrom}::timestamptz` : sql``}
          ${dateTo ? sql`AND er.exchanged_at <= ${dateTo}::timestamptz` : sql``}
      `;

      // Merge and sort
      interface MergedRecord {
        id: string; student_id: string; student_name: string; student_emoji: string;
        points_change?: number; points_spent?: number;
        reason?: string; type?: string;
        gift_name?: string; gift_emoji?: string; gift_image_url?: string;
        created_at: string; recordType: string;
      }
      const pointMerged = pointItems.map((r: Record<string, unknown>) => ({
        ...r, recordType: r.type as string, created_at: r.created_at as string,
      })) as unknown as MergedRecord[];
      const exchMerged = exchangeItems.map((r: Record<string, unknown>) => ({
        ...r, recordType: 'exchange', created_at: r.created_at as string,
      })) as unknown as MergedRecord[];
      const allRecords: MergedRecord[] = [...pointMerged, ...exchMerged];
      allRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      records = allRecords.slice(offset, offset + pageSize) as unknown[];
    }

    const totalPages = Math.ceil(total / pageSize);
    return NextResponse.json({
      success: true, data: records,
      pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (error) {
    console.error('GET records error:', error);
    return NextResponse.json({ success: false, error: '查询记录失败' }, { status: 500 });
  }
}
