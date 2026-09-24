import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicRoutes = [
  '/',
  '/about',
  '/login',
  '/register',
  '/reset-password',
  '/verify-email',
  '/resend-verification',
  '/terms',
  '/privacy',
];

const publicPrefixes = [
  '/api/auth/',
  '/api/healthcheck',
  '/api/health',
  '/api/healthz',
  // Bearer-token-gated routes — they enforce their own auth, must bypass
  // the cookie redirect (which would 307→/login before the route runs).
  '/api/internal/',
  '/_next/',
  '/favicon',
  '/images/',
  '/videos/',
  '/animations/',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicRoutes.includes(pathname);
  const isPublicPrefix = publicPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isPublicRoute || isPublicPrefix) {
    return NextResponse.next();
  }

  // Auth.js issues encrypted JWT cookies. The former Firebase __session
  // presence check rejected valid logins and accepted arbitrary old cookies.
  // Route handlers still perform their own session/user authorization.
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error(JSON.stringify({ event: 'auth_proxy_unready', reason: 'missing_secret' }));
    return NextResponse.json({ error: 'Authentication temporarily unavailable' }, { status: 503 });
  }
  const session = await getToken({
    req: request,
    secret,
    secureCookie: request.nextUrl.protocol === 'https:',
  });

  if (!session?.sub) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
