import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

// Auth config without database operations (for Edge middleware)
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // authorize will be overridden in full auth.ts
      async authorize() {
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const publicRoutes = ['/', '/login', '/register', '/setup', '/forgot-password'];
      const isPublicRoute = publicRoutes.includes(pathname);
      const isApiRoute = pathname.startsWith('/api');
      const isStaticRoute = pathname.startsWith('/_next') || pathname.includes('.');

      if (isStaticRoute || isApiRoute) {
        return true;
      }

      if (isPublicRoute) {
        if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return false; // Redirect to login
      }

      return true;
    },
  },
};
