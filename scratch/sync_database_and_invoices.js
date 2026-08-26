import { supabase } from "../lib/supabase.js";
import { addOneMonth } from "../lib/adminService.js";

async function syncAll() {
  console.log("Starting Database & Invoice Sync...");

  const { data: members } = await supabase.from('members').select('*');
  const { data: payments } = await supabase.from('payments').select('*');

  console.log(`Loaded ${members.length} members and ${payments.length} payments.`);

  let updatedCount = 0;
  for (const m of members) {
    const memPayments = (payments || []).filter(p =>
      p.member_id === m.id ||
      p.member_id === m.permanent_id ||
      (p.member_name && m.full_name && p.member_name.trim().toLowerCase() === m.full_name.trim().toLowerCase())
    );

    for (const p of memPayments) {
      if (p.member_id !== m.id) {
        console.log(`Linking payment ${p.invoice_id || p.id} to member UUID ${m.id} (${m.permanent_id})`);
        await supabase.from('payments').update({ member_id: m.id }).eq('id', p.id);
        updatedCount++;
      }
    }
  }

  // Jenifa Tamana Lakra (MSL0034)
  const { data: jenifa } = await supabase.from('members').select('*').eq('permanent_id', 'MSL0034').single();
  if (jenifa) {
    console.log('Updating Jenifa Tamana Lakra (MSL0034): Start Date 2026-08-25, Expiry 2026-09-25...');
    await supabase.from('members').update({
      joining_date: '2026-06-24',
      subscription_end_date: '2026-09-25'
    }).eq('id', jenifa.id);

    await supabase.from('payments').update({
      member_id: jenifa.id,
      start_date: '2026-08-25',
      paid_at: '2026-08-25T12:00:00.000Z'
    }).eq('member_id', jenifa.id);
  }

  // Test Student (MSL0126)
  const { data: testStu } = await supabase.from('members').select('*').eq('permanent_id', 'MSL0126').single();
  if (testStu) {
    console.log('Updating Test Student (MSL0126): Joining 2026-08-18, SubStart 2026-08-26, Expiry 2026-09-26...');
    await supabase.from('members').update({
      joining_date: '2026-08-18',
      subscription_end_date: '2026-09-26'
    }).eq('id', testStu.id);

    await supabase.from('payments').update({
      member_id: testStu.id,
      start_date: '2026-08-26',
      paid_at: '2026-08-26T12:00:00.000Z'
    }).or(`member_id.eq.${testStu.id},member_name.ilike.%test student%`);
  }

  console.log(`SYNC COMPLETE! Linked ${updatedCount} payments.`);
}

syncAll().catch(console.error);
