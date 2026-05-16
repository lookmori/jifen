import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// 根据角色构建班级查询条件
function classScope(role: string, teacherId: string, schoolId: string) {
  if (role === 'super_admin') return sql``;
  if (role === 'admin') return sql`WHERE teacher_id IN (SELECT id FROM teachers WHERE school_id = ${schoolId})`;
  return sql`WHERE teacher_id = ${teacherId}`;
}

// 根据角色构建学生查询条件
function studentScope(role: string, teacherId: string, schoolId: string) {
  if (role === 'super_admin') return sql``;
  if (role === 'admin') return sql`JOIN classes c ON s.class_id = c.id WHERE c.teacher_id IN (SELECT id FROM teachers WHERE school_id = ${schoolId})`;
  return sql`JOIN classes c ON s.class_id = c.id WHERE c.teacher_id = ${teacherId}`;
}

// 根据角色构建兑换/积分记录的条件
function recordJoinScope(role: string, teacherId: string, schoolId: string) {
  if (role === 'super_admin') return sql`JOIN classes c ON s.class_id = c.id`;
  if (role === 'admin') return sql`JOIN classes c ON s.class_id = c.id WHERE c.teacher_id IN (SELECT id FROM teachers WHERE school_id = ${schoolId})`;
  return sql`JOIN classes c ON s.class_id = c.id WHERE c.teacher_id = ${teacherId}`;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const { schoolId, teacherId, role } = session;

    const [classCount] = await sql`
      SELECT COUNT(*)::int as count FROM classes
      ${classScope(role, teacherId, schoolId)}
    `;

    const [studentCount] = await sql`
      SELECT COUNT(*)::int as count FROM students s
      ${studentScope(role, teacherId, schoolId)}
    `;

    // 礼物：超级管理员看全部，管理员和教师看自己学校的
    const giftFilter = role === 'super_admin'
      ? sql`WHERE is_active = true`
      : sql`WHERE is_active = true AND school_id = ${schoolId}`;

    const [giftCount] = await sql`
      SELECT COUNT(*)::int as count FROM gifts ${giftFilter}
    `;

    // 今日兑换
    const [todayExchange] = role === 'super_admin'
      ? await sql`
          SELECT COUNT(*)::int as count FROM exchange_records er
          WHERE er.exchanged_at::date = CURRENT_DATE
        `
      : await sql`
          SELECT COUNT(*)::int as count FROM exchange_records er
          JOIN students s ON er.student_id = s.id
          ${recordJoinScope(role, teacherId, schoolId)}
          AND er.exchanged_at::date = CURRENT_DATE
        `;

    const [totalPoints] = await sql`
      SELECT COALESCE(SUM(s.points), 0)::int as total FROM students s
      ${studentScope(role, teacherId, schoolId)}
    `;

    // 最近动态
    const recordScope = recordJoinScope(role, teacherId, schoolId);

    const recentExchanges = await sql`
      SELECT er.id, 'exchange' as type, s.name as student_name, s.avatar_emoji as student_emoji,
             g.name as gift_name, g.emoji as gift_emoji, er.points_spent as points,
             er.exchanged_at as created_at
      FROM exchange_records er
      JOIN students s ON er.student_id = s.id
      JOIN gifts g ON er.gift_id = g.id
      ${recordScope}
      ORDER BY er.exchanged_at DESC LIMIT 5
    `;

    const recentPoints = await sql`
      SELECT pr.id, CASE WHEN pr.type = 'add' THEN 'point_add' ELSE 'point_deduct' END as type,
             s.name as student_name, s.avatar_emoji as student_emoji,
             pr.reason as description, pr.points_change as points, pr.type as point_type,
             pr.created_at
      FROM point_records pr
      JOIN students s ON pr.student_id = s.id
      ${recordScope}
      ORDER BY pr.created_at DESC LIMIT 5
    `;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          classCount: classCount.count,
          studentCount: studentCount.count,
          giftCount: giftCount.count,
          todayExchangeCount: todayExchange.count,
          totalPointsAwarded: totalPoints.total,
        },
        recentExchanges,
        recentPoints,
      },
    });
  } catch (error) {
    console.error('GET /api/dashboard/stats error:', error);
    return NextResponse.json({ success: false, error: '获取统计数据失败' }, { status: 500 });
  }
}
