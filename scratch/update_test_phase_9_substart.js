import { supabase } from "../lib/supabase.js";

async function updateSubStart21() {
  console.log("Updating TEST PHASE 9 (MSL0126) Sub. Start (Current) to 2026-08-21 in Supabase...");

  const { data: m } = await supabase.from('members').select('*').eq('permanent_id', 'MSL0126').single();
  if (m) {
    console.log("Found MSL0126 Member UUID:", m.id);

    // Update member record
    await supabase.from('members').update({
      joining_date: '2026-08-20',
      subscription_end_date: '2026-09-21'
    }).eq('id', m.id);

    // Update payment record INV-174664
    const { data: pays } = await supabase.from('payments').select('*').eq('member_id', m.id);
    for (const p of pays) {
      console.log("Updating Payment:", p.invoice_id);
      await supabase.from('payments').update({
        paid_at: '2026-08-21T12:00:00.000Z',
        notes: 'Recorded on 21/08/2026 — Start Date: 2026-08-21, Expiry: 2026-09-21. Base Plan: ₹1150. Amount Paid: ₹1150.'
      }).eq('id', p.id);
    }
  }

  console.log("SUCCESSFULLY UPDATED Sub. Start to 2026-08-21 & Expiry to 2026-09-21 in Supabase!");
}

updateSubStart21().catch(console.error);
