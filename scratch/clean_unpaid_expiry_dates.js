import { supabase } from "../lib/supabase.js";

async function cleanUnpaidExpiryDates() {
  console.log("Fetching members and payments from Supabase...");
  
  const { data: members, error: mErr } = await supabase.from('members').select('*');
  if (mErr) {
    console.error("Error fetching members:", mErr);
    return;
  }
  
  const { data: payments, error: pErr } = await supabase.from('payments').select('*');
  if (pErr) {
    console.error("Error fetching payments:", pErr);
    return;
  }

  console.log(`Loaded ${members.length} members and ${payments.length} payments.`);

  let updatedCount = 0;

  for (const m of members) {
    // Find all payments for this member
    const memPayments = payments.filter(p =>
      p.member_id === m.id ||
      p.member_id === m.permanent_id ||
      p.member_id === m.student_no ||
      (p.member_name && m.full_name && p.member_name.trim().toLowerCase() === m.full_name.trim().toLowerCase())
    );

    // If member has ZERO payments recorded and has an auto-generated valid subscription_end_date
    if (memPayments.length === 0 && m.subscription_end_date && !String(m.subscription_end_date).startsWith("1970")) {
      console.log(`Clearing auto-generated subscription_end_date (${m.subscription_end_date}) for unpaid member: ${m.full_name} (${m.permanent_id})`);
      const { error: uErr } = await supabase
        .from('members')
        .update({ subscription_end_date: '1970-01-01' })
        .eq('id', m.id);
        
      if (uErr) {
        console.error(`Failed to update member ${m.full_name}:`, uErr);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Cleaned up subscription_end_date for ${updatedCount} unpaid members.`);
  process.exit(0);
}

cleanUnpaidExpiryDates();
