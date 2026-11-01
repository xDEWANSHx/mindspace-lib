import { NextResponse } from 'next/server';
import { allowedPage, sessionFromRequest } from '@/lib/server/security';
export function proxy(request) {
  const session = sessionFromRequest(request);
  if (!session) return NextResponse.redirect(new URL('/login', request.url));
  if (!allowedPage(session.role, request.nextUrl.pathname)) return NextResponse.redirect(new URL('/dashboard', request.url));
  return NextResponse.next();
}
export const config = { matcher: ['/dashboard/:path*'] };
