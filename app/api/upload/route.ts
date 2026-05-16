import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/auth';

async function uploadToLocal(file: File): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });
  const ext = file.name.split('.').pop() || 'webp';
  const filename = `gift-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ success: false, error: '请选择文件' }, { status: 400 });

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: '文件不能超过 2MB' }, { status: 400 });
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: '仅支持 PNG/JPG/GIF/WebP/SVG' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let url: string;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import('@vercel/blob');
      const blob = await put(`gifts/${Date.now()}-${file.name}`, buffer, {
        access: 'private',
        contentType: file.type || 'image/webp',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      // 私有 store 的 URL 无法直接访问，通过代理路由转发
      url = `/api/image?url=${encodeURIComponent(blob.url)}`;
    } else {
      url = await uploadToLocal(file);
    }

    return NextResponse.json({ success: true, data: { url } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Upload error:', msg, error);
    return NextResponse.json({ success: false, error: `上传失败: ${msg}` }, { status: 500 });
  }
}
