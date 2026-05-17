import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { deleteImage } from '@/lib/blob';

// DELETE /api/students/[id] — 删除学生
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  const { id: studentId } = await params;

  try {
    // 先收集该学生的所有图片 URL，级联删除前清理存储
    const imageRecords = await sql`
      SELECT image_url FROM point_records
      WHERE student_id = ${studentId} AND image_url IS NOT NULL
    ` as { image_url: string }[];

    const result = await sql`
      DELETE FROM students WHERE id = ${studentId}
      AND class_id IN (SELECT id FROM classes WHERE teacher_id = ${session.teacherId})
      RETURNING id
    `;
    if (result.length === 0) return NextResponse.json({ success: false, error: '学生不存在或无权限' }, { status: 404 });

    // 异步清理图片文件（不阻塞响应）
    Promise.all(imageRecords.map(r => deleteImage(r.image_url).catch(() => {})));

    return NextResponse.json({ success: true, data: { id: result[0].id } });
  } catch (error) {
    console.error('DELETE student error:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}

// GET /api/students/[id] — 获取学生详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  const { id: studentId } = await params;

  try {
    const [student] = await sql`
      SELECT s.*, c.name as class_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = ${studentId}
    `;
    if (!student) return NextResponse.json({ success: false, error: '学生不存在' }, { status: 404 });

    // 同时获取兑换次数
    const [exchangeCount] = await sql`
      SELECT COUNT(*)::int as total FROM exchange_records WHERE student_id = ${studentId}
    `;

    return NextResponse.json({
      success: true,
      data: { ...student, exchangeCount: exchangeCount.total },
    });
  } catch (error) {
    console.error('GET student error:', error);
    return NextResponse.json({ success: false, error: '查询学生失败' }, { status: 500 });
  }
}
