import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { UserRole } from '@prisma/client';

const publicRoutes = ['/', '/login', '/register', '/setup', '/forgot-password'];

const roleRoutes: Record<string, UserRole[]> = {
  '/dashboard': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
  '/admin': ['SUPER_ADMIN', 'ADMIN'],
  '/admin/users': ['SUPER_ADMIN', 'ADMIN'],
  '/admin/settings': ['SUPER_ADMIN'],
  '/admin/drives': ['SUPER_ADMIN', 'ADMIN'],
  '/documents': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
  '/appointments': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
  '/messages': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
  '/profile': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  if (publicRoutes.includes(pathname)) {
    if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(userRole as UserRole)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      break;
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
