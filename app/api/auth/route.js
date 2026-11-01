import { NextResponse } from 'next/server';
import { readSettings } from '@/lib/server/database';
import { COOKIE, SESSION_SECONDS, allowAttempt, checkPassword, sameOrigin, sessionFromRequest, signToken } from '@/lib/server/security';
export async function GET(request) {
  const session = sessionFromRequest(request);
  return NextResponse.json(session ? { role: session.role, name: session.name } : { error: 'Please sign in.' }, { status: session ? 200 : 401, headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  try {
    const { username, password } = await request.json();
    if (typeof username !== 'string' || typeof password !== 'string' || username.length > 100 || password.length > 256) return NextResponse.json({ error: 'Invalid credentials.' }, { status: 400 });
    if (!allowAttempt('login:global', 100) || !allowAttempt(`login:${username.trim().toLowerCase()}`, 8, 300000)) return NextResponse.json({ error: 'Too many attempts. Try again in five minutes.' }, { status: 429 });
    const settings = await readSettings();
    let role = null;
    const defaultCredentials = {
      adminUsername: 'mindspace-01',
      adminPassword: 'Harsh@44',
      staffUsername: 'staff-01',
      staffPassword: 'Staff.01'
    };
    for (const candidate of ['admin', 'staff']) {
      const name = settings[`${candidate}Username`] || process.env[`${candidate.toUpperCase()}_USERNAME`] || defaultCredentials[`${candidate}Username`];
      const stored = settings[`${candidate}Password`] || process.env[`${candidate.toUpperCase()}_PASSWORD`] || defaultCredentials[`${candidate}Password`];
      if (username.trim() === name && checkPassword(password, stored)) role = candidate;
    }
    if (!role) return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    const name = role === 'admin' ? 'Harsh Goyal (Admin)' : 'Staff';
    const response = NextResponse.json({ role, name });
    response.cookies.set(COOKIE, signToken({ purpose: 'session', role, name, exp: Date.now() + SESSION_SECONDS * 1000 }), { httpOnly: true, sameSite: 'strict', secure: new URL(request.url).protocol === 'https:', path: '/', maxAge: SESSION_SECONDS });
    return response;
  } catch (err) {
    console.error('Sign-in error in /api/auth:', err);
    return NextResponse.json({ error: 'Sign-in service unavailable. Please retry.' }, { status: 503 });
  }
}
export async function DELETE(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE, '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 });
  return response;
}
