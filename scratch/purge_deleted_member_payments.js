import { supabase } from "../lib/supabase.js";

async function purgeOrphanedPayments() {
  console.log("Starting Orphaned Payments Purge...");

  const { data: members } = await supabase.from('members').select('id, permanent_id, full_name');
  const { data: payments } = await supabase.from('payments').select('*');

  console.log(`Checking ${payments.length} payments against ${members.length} active members...`);

  const activeMemberIds = new Set(members.map(m => m.id));
  const activePermIds = new Set(members.map(m => m.permanent_id));
  const activeFullNames = new Set(members.map(m => m.full_name ? m.full_name.trim().toLowerCase() : ''));

  let purgedCount = 0;
  for (const p of payments) {
    const isIdValid = p.member_id && activeMemberIds.has(p.member_id);
    const isPermValid = p.member_id && activePermIds.has(p.member_id);
    const isNameValid = p.member_name && activeFullNames.has(p.member_name.trim().toLowerCase());

    if (!isIdValid && !isPermValid && !isNameValid) {
      console.log(`Purging orphaned payment ID ${p.id} (${p.invoice_id}) for member "${p.member_name}" (${p.member_id})`);
      await supabase.from('payments').delete().eq('id', p.id);
      purgedCount++;
    }
  }

  console.log(`PURGE COMPLETE! Purged ${purgedCount} orphaned payment records.`);
}

purgeOrphanedPayments().catch(console.error);
