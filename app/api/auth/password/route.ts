import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// PUT /api/auth/password — 修改密码
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  try {
    const { oldPassword, newPassword } = await request.json();
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ success: false, error: '请填写旧密码和新密码' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: '新密码至少6位' }, { status: 400 });
    }

    const [teacher] = await sql`
      SELECT password_hash FROM teachers WHERE id = ${session.teacherId}
    `;
    if (!teacher) return NextResponse.json({ success: false, error: '教师不存在' }, { status: 404 });

    const valid = await bcrypt.compare(oldPassword, teacher.password_hash);
    if (!valid) return NextResponse.json({ success: false, error: '旧密码错误' }, { status: 400 });

    const hash = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE teachers SET password_hash = ${hash} WHERE id = ${session.teacherId}`;

    return NextResponse.json({ success: true, data: { message: '密码已修改' } });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ success: false, error: '修改失败' }, { status: 500 });
  }
}
