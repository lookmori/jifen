// lib/blob.ts — Vercel Blob 工具
import { put, del } from '@vercel/blob';
import { getSession } from '@/lib/auth';
import { unlink } from 'fs/promises';
import path from 'path';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function uploadImage(file: File): Promise<{ url: string } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: '未登录' };

  if (file.size > MAX_SIZE) return { error: '图片大小不能超过 2MB' };

  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) return { error: '仅支持 PNG、JPEG、WebP、GIF 格式' };

  const ext = file.name.split('.').pop() || 'png';
  const filename = `${session.schoolId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const blob = await put(filename, file, { access: 'public' });
  return { url: blob.url };
}

export async function deleteImage(url: string): Promise<void> {
  if (!url) return;

  try {
    // Vercel Blob 代理 URL: /api/image?url=<encoded-blob-url>
    if (url.startsWith('/api/image?url=')) {
      const encoded = url.replace('/api/image?url=', '');
      const blobUrl = decodeURIComponent(encoded);
      if (blobUrl.includes('blob.vercel-storage.com') && process.env.BLOB_READ_WRITE_TOKEN) {
        await del(blobUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
      }
      return;
    }

    // 本地文件: /uploads/gift-xxx.webp
    if (url.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', url);
      await unlink(filePath);
      return;
    }

    // 直接 Vercel Blob URL (public uploads)
    if (url.includes('blob.vercel-storage.com') && process.env.BLOB_READ_WRITE_TOKEN) {
      await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
      return;
    }
  } catch {
    // 删除失败不阻断主流程，图片会自然过期
    console.warn('Failed to delete image:', url);
  }
}
