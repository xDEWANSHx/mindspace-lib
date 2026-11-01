import { sameOrigin, sessionFromRequest } from '@/lib/server/security';

const tables = new Set(['branches', 'members', 'payments', 'expenses', 'leads', 'activity_logs']);
const staffTables = new Set(['branches', 'members', 'payments', 'leads']);
export async function handle(request, context) {
  const session = sessionFromRequest(request);
  if (!session) return Response.json({ message: 'Please sign in.', code: 'AUTH_REQUIRED' }, { status: 401 });
  const read = ['GET', 'HEAD'].includes(request.method);
  if (!read && !sameOrigin(request)) return Response.json({ message: 'Invalid origin.' }, { status: 403 });
  const { path } = await context.params;
  const url = new URL(request.url);
  const table = path[2];
  const rest = path.length === 3 && path[0] === 'rest' && path[1] === 'v1' && tables.has(table);
  const storage = path[0] === 'storage' && path[1] === 'v1' && path[2] === 'object' && path[3] === 'mindspace-media' && path[4] === 'uploads' && path.length === 6 && request.method === 'POST';
  if (!rest && !storage) return Response.json({ message: 'Resource not allowed.' }, { status: 403 });
  if (session.role !== 'admin' && (request.method === 'DELETE' || (rest && !staffTables.has(table) && !(table === 'activity_logs' && request.method === 'POST')) || (table === 'branches' && !read))) return Response.json({ message: 'Admin access required.' }, { status: 403 });
  // Do not allow embedded joins to bypass the table permissions above.
  const select = url.searchParams.get('select');
  if (select && !/^(\*|[a-z_]+(?:,[a-z_]+)*)$/i.test(select)) return Response.json({ message: 'Unsupported projection.' }, { status: 400 });
  try {
    const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzdmuuuslrqlivjqbiwj.supabase.co';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZG11dXVzbHJxbGl2anFiaXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQyNTE5MywiZXhwIjoyMTAxMDAxMTkzfQ.G6eHJfQ8u7z2KfxQgI7DqL97dNzOxFYlYOLrgQ3l5q8';
    if (!base || !key) throw new Error('Missing configuration');
    const headers = new Headers({ apikey: key, Authorization: `Bearer ${key}` });
    for (const name of ['content-type', 'accept', 'prefer', 'range', 'range-unit', 'x-upsert', 'cache-control']) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const body = read ? undefined : await request.arrayBuffer();
    if (body && body.byteLength > 6 * 1024 * 1024) return Response.json({ message: 'Request too large.' }, { status: 413 });
    if (storage) {
      const contentType = request.headers.get('content-type') || '';
      let imageType = contentType;
      if (contentType.startsWith('multipart/form-data')) {
        const form = await new Response(body, { headers: { 'Content-Type': contentType } }).formData();
        const file = [...form.values()].find(value => typeof value !== 'string');
        imageType = file?.type || '';
      }
      if (!/^image\/(jpeg|png|webp|gif)$/.test(imageType)) return Response.json({ message: 'Only image uploads are supported.' }, { status: 400 });
    }
    const upstream = await fetch(`${base.replace(/\/$/, '')}/${path.map(encodeURIComponent).join('/')}${url.search}`, { method: request.method, headers, body, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(20000) });
    const outputHeaders = new Headers({ 'Cache-Control': 'no-store' });
    for (const name of ['content-type', 'content-range', 'range-unit']) {
      const value = upstream.headers.get(name);
      if (value) outputHeaders.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers: outputHeaders });
  } catch { return Response.json({ message: 'Database request failed. Check connection and retry.', code: 'GATEWAY_UNAVAILABLE' }, { status: 503 }); }
}
export { handle as GET, handle as HEAD, handle as POST, handle as PATCH, handle as DELETE };
