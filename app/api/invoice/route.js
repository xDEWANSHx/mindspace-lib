import { database } from '@/lib/server/database';
import { sessionFromRequest, signToken, verifyToken } from '@/lib/server/security';

export async function GET(request) {
  const url = new URL(request.url);
  const session = sessionFromRequest(request);
  const token = verifyToken(url.searchParams.get('token'), 'invoice');
  if (!session && !token) return Response.json({ error: 'Sign in or use a secure invoice share link.' }, { status: 401 });
  const id = token?.id || url.searchParams.get('id');
  if (!id || id.length > 100) return Response.json({ error: 'Invoice ID is required.' }, { status: 400 });
  try {
    const db = database();
    const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id);
    const { data, error } = await db.from('payments').select('*').eq(uuid ? 'id' : 'invoice_id', id).limit(2);
    if (error) throw error;
    if (data?.length !== 1) return Response.json({ error: 'Invoice not found or ID is ambiguous.' }, { status: 404 });
    const payment = data[0];
    let member = null;
    if (payment.member_id) {
      for (const column of ['id', 'permanent_id', 'student_no']) {
        if (column === 'id' && !/^[\da-f-]{36}$/i.test(payment.member_id)) continue;
        const result = await db.from('members').select('id,permanent_id,student_no,full_name,mobile,shift,seat_no,joining_date,subscription_end_date,has_locker,locker_no,plan_amount,outstanding_dues,due_date').eq(column, payment.member_id).limit(2);
        if (result.error) throw result.error;
        if (result.data?.length === 1) { member = result.data[0]; break; }
      }
    }
    // Shared receipts contain one transaction only, never the full ledger.
    const shareToken = token ? url.searchParams.get('token') : signToken({ purpose: 'invoice', id: payment.id, exp: Date.now() + 30 * 86400000 });
    return Response.json({ payment, member, shareToken }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Invoice could not be loaded. Please retry.' }, { status: 503 }); }
}
