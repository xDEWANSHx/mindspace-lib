import { supabase } from "../lib/supabase.js";

async function fixTestPhase12() {
  console.log("Fixing test product phase 12 member and payment sync...");

  const { data: members } = await supabase.from('members').select('*').eq('permanent_id', 'MSL0126');
  if (members && members.length > 0) {
    const mem = members[0];
    console.log("Found member MSL0126:", mem.full_name, "joining_date:", mem.joining_date, "subscription_end_date:", mem.subscription_end_date);

    // Sync member subscription_end_date to 2026-09-23
    const { error: mErr } = await supabase
      .from('members')
      .update({ subscription_end_date: '2026-09-23' })
      .eq('id', mem.id);

    if (mErr) console.error("Error updating member:", mErr);
    else console.log("Successfully updated MSL0126 subscription_end_date to 2026-09-23!");

    // Update latest payment start_date / notes
    const { data: payments } = await supabase.from('payments').select('*').eq('member_id', mem.id);
    if (payments && payments.length > 0) {
      const latestP = payments[0];
      let notes = latestP.notes || "";
      notes = notes.replace(/Start Date:\s*\d{4}-\d{2}-\d{2}/i, "Start Date: 2026-08-23");
      notes = notes.replace(/Expiry:\s*\d{4}-\d{2}-\d{2}/i, "Expiry: 2026-09-23");

      const { error: pErr } = await supabase
        .from('payments')
        .update({
          start_date: '2026-08-23',
          notes: notes
        })
        .eq('id', latestP.id);

      if (pErr) console.error("Error updating payment:", pErr);
      else console.log("Successfully synced latest payment record for MSL0126!");
    }
  }

  process.exit(0);
}

fixTestPhase12();
