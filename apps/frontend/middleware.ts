import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const adminRoles = new Set(['SUPERADMIN', 'ADMIN']);
const protectedPrefixes = [
  '/dashboard',
  '/auction',
  '/admin',
  '/profile',
  '/payments',
  '/my-adjudications',
];
const protectedPatterns = [/^\/auctions\/[^/]+\/live/, /^\/auctions\/[^/]+\/register/];
const authPages = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authFlag = request.cookies.get('martillo_auth')?.value;
  const role = request.cookies.get('martillo_role')?.value;
  const isAuthenticated = authFlag === '1';

  const isProtected =
    protectedPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    protectedPatterns.some((pattern) => pattern.test(pathname));
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthPage = authPages.some((prefix) => pathname.startsWith(prefix));
  if (isAuthPage && isAuthenticated) {
    const homeUrl = new URL(adminRoles.has(role ?? '') ? '/admin' : '/dashboard', request.url);
    return NextResponse.redirect(homeUrl);
  }

  if (pathname.startsWith('/dashboard') && adminRoles.has(role ?? '')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  if (pathname.startsWith('/profile') && adminRoles.has(role ?? '')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  const isAdminRoute = pathname.startsWith('/admin');
  if (isAdminRoute && !adminRoles.has(role ?? '')) {
    const homeUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auction/:path*',
    '/admin/:path*',
    '/auctions/:path*/live',
    '/auctions/:path*/register',
    '/profile',
    '/payments/:path*',
    '/my-adjudications',
    '/login',
    '/register',
  ],
};
