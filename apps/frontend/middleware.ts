import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
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
