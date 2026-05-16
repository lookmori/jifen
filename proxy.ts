import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'jifen-dev-secret-change-in-production-min-32-chars-long!!'
);

const publicPaths = ['/login', '/api/auth/login', '/api/seed', '/api/schema'];
const adminPaths = ['/admin'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开路径直接放行
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 静态资源放行
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.match(/\.(svg|png|jpg|ico|mp3)$/)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('jifen-token')?.value;

  // 未登录 → 重定向到登录页
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 验证 token
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const role = payload.role as string;

    // 管理员路由保护
    if (adminPaths.some(p => pathname.startsWith(p)) && role !== 'admin' && role !== 'super_admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch {
    // Token 无效
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('jifen-token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
