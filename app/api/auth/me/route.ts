import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const [settings] = await sql`
      SELECT sound_enabled, sound_volume, animations_reduced
      FROM teacher_settings WHERE teacher_id = ${session.teacherId}
    `;
    return NextResponse.json({
      success: true,
      data: {
        ...session,
        settings: settings ? {
          soundEnabled: settings.sound_enabled,
          soundVolume: settings.sound_volume,
          animationsReduced: settings.animations_reduced,
        } : null,
      },
    });
  } catch {
    return NextResponse.json({ success: true, data: { ...session, settings: null } });
  }
}
