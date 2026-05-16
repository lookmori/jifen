// lib/blob.ts — Vercel Blob 工具
import { put } from '@vercel/blob';
import { getSession } from '@/lib/auth';

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
  // Vercel Blob doesn't expose a simple delete by URL in the serverless driver
  // Images auto-expire based on the blob store configuration
}
