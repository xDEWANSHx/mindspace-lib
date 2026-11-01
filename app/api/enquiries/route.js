import { randomUUID } from 'node:crypto';
import { database } from '@/lib/server/database';
import { allowAttempt, sameOrigin } from '@/lib/server/security';
export async function POST(request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid origin.' }, { status: 403 });
  try {
    const form = await request.json();
    if (typeof form.name !== 'string' || !form.name.trim() || form.name.length > 150 || typeof form.mobile !== 'string' || !/^\+?[\d\s()-]{10,18}$/.test(form.mobile)) return Response.json({ error: 'Enter a name and valid phone number.' }, { status: 400 });
    if (!allowAttempt('enquiry:global', 60) || !allowAttempt(`enquiry:${form.mobile.replace(/\D/g, '')}`, 3, 300000)) return Response.json({ error: 'Please wait before sending another enquiry.' }, { status: 429 });
    const text = key => String(form[key] || '').slice(0, 1000);
    const { error } = await database().from('leads').insert({ id: randomUUID(), full_name: form.name.trim(), phone: form.mobile, interest: text('shift') || 'Full Day', status: 'new', branch: 'main_branch', notes: `Email: ${text('email')} | Exam: ${text('purpose')} | Source: ${text('source')} | Note: ${text('message')}`, created_at: new Date().toISOString() });
    if (error) throw error;
    return Response.json({ success: true });
  } catch { return Response.json({ error: 'Enquiry could not be saved. Please retry.' }, { status: 503 }); }
}
