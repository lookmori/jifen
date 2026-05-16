import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// PUT /api/admin/teachers/[id] — 更新教师信息
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
    const { name, phone, schoolId, role } = await request.json();

    // 如果修改了手机号，检查同一学校内是否已被其他教师使用
    if (phone) {
      const existing = await sql`
        SELECT id FROM teachers WHERE phone = ${phone} AND school_id = COALESCE(${schoolId || null}, (SELECT school_id FROM teachers WHERE id = ${id}))
        AND id != ${id}
      `;
      if (existing.length > 0) {
        return NextResponse.json({ success: false, error: '该手机号在此学校已被其他教师使用' }, { status: 409 });
      }
    }

    // 先查出当前信息，用于判断角色变更
    const [current] = await sql`SELECT school_id, role FROM teachers WHERE id = ${id}`;
    if (!current) {
      return NextResponse.json({ success: false, error: '教师不存在' }, { status: 404 });
    }

    // 非超级管理员只能编辑自己学校的教师，且不能跨学校转移
    if (session.phone !== 'admin') {
      if (current.school_id !== session.schoolId) {
        return NextResponse.json({ success: false, error: '无权编辑其他学校的教师' }, { status: 403 });
      }
      if (schoolId && schoolId !== session.schoolId) {
        return NextResponse.json({ success: false, error: '不能将教师转移到其他学校' }, { status: 403 });
      }
    }

    const result = await sql`
      UPDATE teachers SET
        name = COALESCE(${name || null}, name),
        phone = COALESCE(${phone || null}, phone),
        school_id = COALESCE(${schoolId || null}, school_id),
        role = COALESCE(${role || null}, role)
      WHERE id = ${id}
      RETURNING id, name, phone, school_id, role, is_active, avatar_emoji
    `;

    const updated = result[0];
    const newRole = role || current.role;
    const newSchoolId = schoolId || current.school_id;

    // 角色变为 admin → 设为该学校管理员
    if (newRole === 'admin') {
      await sql`UPDATE schools SET admin_id = ${id} WHERE id = ${newSchoolId}`;
    } else if (current.role === 'admin' && newRole !== 'admin') {
      // 原为 admin 现被降级 → 清除学校的 admin_id
      await sql`UPDATE schools SET admin_id = NULL WHERE id = ${current.school_id} AND admin_id = ${id}`;
    }

    // 如果换了学校：原学校如果以此人为管理员，需清除；新学校如果是 admin 角色，设为管理员
    if (schoolId && schoolId !== current.school_id) {
      await sql`UPDATE schools SET admin_id = NULL WHERE id = ${current.school_id} AND admin_id = ${id}`;
      if (newRole === 'admin') {
        await sql`UPDATE schools SET admin_id = ${id} WHERE id = ${newSchoolId}`;
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('PUT /api/admin/teachers error:', error);
    return NextResponse.json({ success: false, error: '更新教师失败' }, { status: 500 });
  }
}

// PATCH /api/admin/teachers/[id] — 重置密码 / 切换状态
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'reset-password') {
      const newPassword = body.password || '123456';
      const passwordHash = await bcrypt.hash(newPassword, 10);

      await sql`UPDATE teachers SET password_hash = ${passwordHash} WHERE id = ${id}`;

      return NextResponse.json({ success: true, data: { newPassword } });
    }

    if (action === 'toggle-status') {
      const result = await sql`
        UPDATE teachers SET is_active = NOT is_active
        WHERE id = ${id}
        RETURNING id, is_active
      `;

      if (result.length === 0) {
        return NextResponse.json({ success: false, error: '教师不存在' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: result[0] });
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('PATCH /api/admin/teachers error:', error);
    return NextResponse.json({ success: false, error: '操作失败' }, { status: 500 });
  }
}
