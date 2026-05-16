import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const { schoolId, teacherId, role } = session;

    // 构建数据范围过滤：管理员看全校，教师只看自己的班级
    const studentScope = role === 'admin'
      ? sql`JOIN classes c ON s.class_id = c.id JOIN schools sch ON c.teacher_id = sch.admin_id WHERE sch.id = ${schoolId}`
      : sql`JOIN classes c ON s.class_id = c.id WHERE c.teacher_id = ${teacherId}`;

    const [classCount] = await sql`
      SELECT COUNT(*)::int as count FROM classes
      ${role === 'admin'
        ? sql`WHERE teacher_id IN (SELECT id FROM teachers WHERE school_id = ${schoolId})`
        : sql`WHERE teacher_id = ${teacherId}`
      }
    `;
    const [studentCount] = await sql`
      SELECT COUNT(*)::int as count FROM students s
      ${role === 'admin'
        ? sql`JOIN classes c ON s.class_id = c.id WHERE c.teacher_id IN (SELECT id FROM teachers WHERE school_id = ${schoolId})`
        : sql`JOIN classes c ON s.class_id = c.id WHERE c.teacher_id = ${teacherId}`
      }
    `;
    const [giftCount] = await sql`
      SELECT COUNT(*)::int as count FROM gifts WHERE is_active = true AND school_id = ${schoolId}
    `;
    const [todayExchange] = await sql`
      SELECT COUNT(*)::int as count FROM exchange_records er
      JOIN students s ON er.student_id = s.id
      ${role === 'admin'
        ? sql`JOIN classes c ON s.class_id = c.id WHERE c.teacher_id IN (SELECT id FROM teachers WHERE school_id = ${schoolId})`
        : sql`JOIN classes c ON s.class_id = c.id WHERE c.teacher_id = ${teacherId}`
      }
      AND er.exchanged_at::date = CURRENT_DATE
    `;
    const [totalPoints] = await sql`
      SELECT COALESCE(SUM(s.points), 0)::int as total FROM students s
      ${role === 'admin'
        ? sql`JOIN classes c ON s.class_id = c.id WHERE c.teacher_id IN (SELECT id FROM teachers WHERE school_id = ${schoolId})`
        : sql`JOIN classes c ON s.class_id = c.id WHERE c.teacher_id = ${teacherId}`
      }
    `;

    // 最近动态 — 按学校/教师范围过滤
    const recentExchanges = await sql`
      SELECT er.id, 'exchange' as type, s.name as student_name, s.avatar_emoji as student_emoji,
             g.name as gift_name, g.emoji as gift_emoji, er.points_spent as points,
             er.exchanged_at as created_at
      FROM exchange_records er
      JOIN students s ON er.student_id = s.id
      JOIN gifts g ON er.gift_id = g.id
      JOIN classes c ON s.class_id = c.id
      ${role === 'admin'
        ? sql`WHERE c.teacher_id IN (SELECT id FROM teachers WHERE school_id = ${schoolId})`
        : sql`WHERE c.teacher_id = ${teacherId}`
      }
      ORDER BY er.exchanged_at DESC LIMIT 5
    `;

    const recentPoints = await sql`
      SELECT pr.id, CASE WHEN pr.type = 'add' THEN 'point_add' ELSE 'point_deduct' END as type,
             s.name as student_name, s.avatar_emoji as student_emoji,
             pr.reason as description, pr.points_change as points, pr.type as point_type,
             pr.created_at
      FROM point_records pr
      JOIN students s ON pr.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      ${role === 'admin'
        ? sql`WHERE c.teacher_id IN (SELECT id FROM teachers WHERE school_id = ${schoolId})`
        : sql`WHERE c.teacher_id = ${teacherId}`
      }
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
