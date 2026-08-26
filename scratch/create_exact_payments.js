import { supabase } from "../lib/supabase.js";
import { generateUUID } from "../lib/adminService.js";

async function createExactPayments() {
  console.log("Creating/updating exact payments for Test Student and Jenifa Tamana Lakra...");

  // 1. Test Student (MSL0126)
  const { data: tMem } = await supabase.from('members').select('*').eq('permanent_id', 'MSL0126').single();
  if (tMem) {
    console.log("Found MSL0126 Test Student UUID:", tMem.id);
    await supabase.from('members').update({
      joining_date: '2026-08-18',
      subscription_end_date: '2026-09-26'
    }).eq('id', tMem.id);

    const testPay = {
      id: generateUUID(),
      member_id: tMem.id,
      invoice_id: 'INV-901604',
      member_name: 'test student',
      amount: 600,
      branch: 'main_branch',
      payment_mode: 'UPI',
      paid_at: '2026-08-26T12:00:00.000Z',
      created_at: '2026-08-26T12:00:00.000Z',
      cash_amount: 0,
      online_amount: 600,
      notes: 'Recorded on 26/08/2026 — Start Date: 2026-08-26, Expiry: 2026-09-26. Base Plan: ₹600. Amount Paid: ₹600.'
    };

    const { error: tErr } = await supabase.from('payments').insert([testPay]);
    if (tErr) console.error("Test Student Payment Insert Error:", tErr);
    else console.log("SUCCESS: Inserted INV-901604 for Test Student (MSL0126)");
  }

  // 2. Jenifa Tamana Lakra (MSL0034)
  const { data: jMem } = await supabase.from('members').select('*').eq('permanent_id', 'MSL0034').single();
  if (jMem) {
    console.log("Found MSL0034 Jenifa Tamana Lakra UUID:", jMem.id);
    await supabase.from('members').update({
      joining_date: '2026-06-24',
      subscription_end_date: '2026-09-25'
    }).eq('id', jMem.id);

    const jenifaPay = {
      id: generateUUID(),
      member_id: jMem.id,
      invoice_id: 'INV-415007',
      member_name: 'JENIFA TAMANA LAKRA',
      amount: 600,
      branch: 'main_branch',
      payment_mode: 'Cash',
      paid_at: '2026-08-25T12:00:00.000Z',
      created_at: '2026-08-25T12:00:00.000Z',
      cash_amount: 600,
      online_amount: 0,
      notes: 'Recorded on 25/08/2026 — Start Date: 2026-08-25, Expiry: 2026-09-25. Base Plan: ₹600. Amount Paid: ₹600.'
    };

    const { error: jErr } = await supabase.from('payments').insert([jenifaPay]);
    if (jErr) console.error("Jenifa Payment Insert Error:", jErr);
    else console.log("SUCCESS: Inserted INV-415007 for Jenifa Tamana Lakra (MSL0034)");
  }
}

createExactPayments().catch(console.error);
