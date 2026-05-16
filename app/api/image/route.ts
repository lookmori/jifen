import { NextRequest, NextResponse } from 'next/server';

// GET /api/image?url=<encoded-url> — 代理私有 Vercel Blob 图片
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse('Missing url', { status: 400 });

  try {
    if (!url.includes('blob.vercel-storage.com')) {
      return new NextResponse('Invalid source', { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return new NextResponse('Not configured', { status: 500 });

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return new NextResponse('Image not found', { status: 404 });

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/webp';

    return new NextResponse(buffer, {
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=86400',
      },
    });
  } catch {
    return new NextResponse('Proxy error', { status: 500 });
  }
}
