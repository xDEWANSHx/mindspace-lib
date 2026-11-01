import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const COOKIE = 'mindspace_session';
export const SESSION_SECONDS = 8 * 60 * 60;
const restricted = ['/dashboard/analytics', '/dashboard/expenses', '/dashboard/settings', '/dashboard/activities', '/dashboard/loss-payment'];
const DEFAULT_SECRET = '197bd12ecefc411796c10df96fcdbfd7021d708d61258b5d34fe9ba3c878136b80276e1d8781bc100383b9f4ed86abff';

function secret() {
  const value = process.env.SESSION_SECRET || DEFAULT_SECRET;
  if (!value || value.length < 32) throw new Error('Server session configuration is missing.');
  return value;
}
function equal(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}
export function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${createHmac('sha256', secret()).update(body).digest('base64url')}`;
}
export function verifyToken(token, purpose = 'session') {
  try {
    const [body, signature, extra] = (token || '').split('.');
    if (!body || !signature || extra || !equal(signature, createHmac('sha256', secret()).update(body).digest('base64url'))) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.purpose === purpose && payload.exp > Date.now() ? payload : null;
  } catch { return null; }
}
export function sessionFromRequest(request) {
  const cookie = (request.headers.get('cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`));
  const session = verifyToken(cookie?.slice(COOKIE.length + 1));
  return session && ['admin', 'staff'].includes(session.role) ? session : null;
}
export function allowedPage(role, path) {
  return role === 'admin' || (role === 'staff' && !restricted.some(p => path === p || path.startsWith(`${p}/`)));
}
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https:') ? 'https' : 'http');
  const hostOrigin = host ? `${proto}://${host}` : null;
  let urlOrigin = null;
  try { urlOrigin = new URL(request.url).origin; } catch {}
  
  const matches = (hostOrigin && origin === hostOrigin) || (urlOrigin && origin === urlOrigin);
  if (!matches) return false;
  return request.headers.get('sec-fetch-site') !== 'cross-site';
}
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function checkPassword(password, stored) {
  if (!password || !stored) return false;
  if (!stored.startsWith('scrypt:')) return equal(password, stored);
  const [, salt, hash] = stored.split(':');
  return equal(scryptSync(password, salt, 64).toString('hex'), hash);
}
export function publicSettings(content = {}) {
  return Object.fromEntries(Object.entries(content).filter(([key]) => !/password|username|secret|token|credential|key/i.test(key)));
}
const attempts = new Map();
export function allowAttempt(key, maximum = 10, windowMs = 60000) {
  const now = Date.now();
  for (const [k, value] of attempts) if (value.until <= now) attempts.delete(k);
  const item = attempts.get(key) || { count: 0, until: now + windowMs };
  item.count++; attempts.set(key, item);
  return item.count <= maximum;
}
