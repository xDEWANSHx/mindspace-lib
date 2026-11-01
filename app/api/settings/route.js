import { database, readSettings } from '@/lib/server/database';
import { hashPassword, publicSettings, sameOrigin, sessionFromRequest } from '@/lib/server/security';
export async function GET() {
  try { return Response.json(publicSettings(await readSettings()), { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return Response.json({ error: 'Settings unavailable.' }, { status: 503 }); }
}
export async function POST(request) {
  if (!sameOrigin(request) || sessionFromRequest(request)?.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const patch = await request.json();
    if (!patch || Array.isArray(patch) || typeof patch !== 'object') return Response.json({ error: 'Invalid settings.' }, { status: 400 });
    const content = { ...await readSettings(), ...publicSettings(patch) };
    for (const role of ['admin', 'staff']) {
      const password = patch[`${role}Password`];
      if (password) {
        if (typeof password !== 'string' || password.length < 8 || password.length > 256) return Response.json({ error: 'Use passwords between 8 and 256 characters.' }, { status: 400 });
        content[`${role}Password`] = hashPassword(password);
      }
    }
    const { error } = await database().from('site_settings').upsert({ id: 'default', content, updated_at: new Date().toISOString() });
    if (error) throw error;
    return Response.json({ success: true });
  } catch { return Response.json({ error: 'Settings were not saved. Please retry.' }, { status: 503 }); }
}
