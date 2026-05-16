import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/settings — 获取教师设置
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  try {
    const [row] = await sql`
      SELECT * FROM teacher_settings WHERE teacher_id = ${session.teacherId}
    `;
    if (!row) {
      // 确认教师记录存在（防止 DB 重置后外键约束失败）
      const [teacher] = await sql`SELECT id FROM teachers WHERE id = ${session.teacherId}`;
      if (!teacher) {
        // 教师不存在（DB 已重置），返回默认设置
        return NextResponse.json({
          success: true,
          data: { sound_enabled: true, sound_volume: 0.5, animations_reduced: false },
        });
      }

      const [created] = await sql`
        INSERT INTO teacher_settings (teacher_id) VALUES (${session.teacherId})
        RETURNING *
      `;
      return NextResponse.json({ success: true, data: created });
    }
    return NextResponse.json({ success: true, data: row });
  } catch (error) {
    console.error('GET settings error:', error);
    return NextResponse.json({ success: false, error: '查询设置失败' }, { status: 500 });
  }
}

// PUT /api/settings — 更新教师设置
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  try {
    const { soundEnabled, soundVolume, animationsReduced } = await request.json();

    // 确认教师记录存在
    const [teacher] = await sql`SELECT id FROM teachers WHERE id = ${session.teacherId}`;
    if (!teacher) {
      return NextResponse.json({ success: false, error: '账号不存在，请重新登录' }, { status: 401 });
    }

    const [settings] = await sql`
      INSERT INTO teacher_settings (teacher_id, sound_enabled, sound_volume, animations_reduced)
      VALUES (${session.teacherId}, ${soundEnabled ?? true}, ${soundVolume ?? 0.5}, ${animationsReduced ?? false})
      ON CONFLICT (teacher_id)
      DO UPDATE SET
        sound_enabled = COALESCE(${soundEnabled ?? null}, teacher_settings.sound_enabled),
        sound_volume = COALESCE(${soundVolume ?? null}, teacher_settings.sound_volume),
        animations_reduced = COALESCE(${animationsReduced ?? null}, teacher_settings.animations_reduced),
        updated_at = NOW()
      RETURNING *
    `;
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('PUT settings error:', error);
    return NextResponse.json({ success: false, error: '保存设置失败' }, { status: 500 });
  }
}
