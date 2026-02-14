import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const protectedPrefixes = ['/dashboard', '/auction', '/admin', '/profile'];
const protectedPatterns = [/^\/auctions\/[^/]+\/live/, /^\/auctions\/[^/]+\/register/];
const authPages = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const isAuthenticated = Boolean(refreshToken);

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
    '/login',
    '/register',
  ],
};
