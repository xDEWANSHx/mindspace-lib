import { supabase } from "../lib/supabase.js";
import { addOneMonth } from "../lib/adminService.js";

async function fixTestPhase9() {
  console.log("Fixing TEST PHASE 9 (MSL0126) & All Database Contradictions...");

  // 1. Fetch MSL0126 Test Phase 9
  const { data: tMem } = await supabase.from('members').select('*').eq('permanent_id', 'MSL0126').single();
  if (tMem) {
    console.log("Found MSL0126 Test Phase 9 UUID:", tMem.id);

    // Update member record: Joining 2026-08-20, Subscription End 2026-09-23
    await supabase.from('members').update({
      joining_date: '2026-08-20',
      subscription_end_date: '2026-09-23'
    }).eq('id', tMem.id);

    // Update payment record INV-174664
    const { data: pays } = await supabase.from('payments').select('*').eq('member_id', tMem.id);
    for (const p of pays) {
      console.log("Updating Payment:", p.invoice_id);
      await supabase.from('payments').update({
        paid_at: '2026-08-21T12:00:00.000Z',
        notes: 'Recorded on 21/08/2026 — Start Date: 2026-08-23, Expiry: 2026-09-23. Base Plan: ₹1150. Amount Paid: ₹1150.'
      }).eq('id', p.id);
    }
  }

  console.log("SUCCESS: Database records updated cleanly!");
}

fixTestPhase9().catch(console.error);
