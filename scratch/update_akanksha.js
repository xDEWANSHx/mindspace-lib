import { createClient } from '@supabase/supabase-js';

const url = 'https://bzdmuuuslrqlivjqbiwj.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZG11dXVzbHJxbGl2anFiaXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQyNTE5MywiZXhwIjoyMTAxMDAxMTkzfQ.G6eHJfQ8u7z2KfxQgI7DqL97dNzOxFYlYOLrgQ3l5q8';

const supabase = createClient(url, key);

async function fixAkanksha() {
  console.log("Searching for Akanksha Singh...");

  // 1. Fetch member
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .ilike('full_name', '%akanksha%');

  console.log("Members found:", members);

  // 2. Fetch payments for Akanksha or INV-941438
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .or('invoice_id.eq.INV-941438,member_name.ilike.%akanksha%');

  console.log("Payments found:", payments);

  if (payments && payments.length > 0) {
    for (const p of payments) {
      console.log(`Updating payment ${p.invoice_id} paid_at to 2026-07-20...`);
      const { error: uErr } = await supabase
        .from('payments')
        .update({
          paid_at: '2026-07-20T12:00:00.000Z',
          created_at: '2026-07-20T12:00:00.000Z'
        })
        .eq('id', p.id);
      if (uErr) console.error("Payment update error:", uErr);
      else console.log(`Payment ${p.invoice_id} updated successfully!`);
    }
  }

  if (members && members.length > 0) {
    for (const m of members) {
      console.log(`Updating member ${m.full_name} joining_date to 2026-07-20 and subscription_end_date to 2026-08-20...`);
      const { error: uErr } = await supabase
        .from('members')
        .update({
          joining_date: '2026-07-20',
          created_at: '2026-07-20T12:00:00.000Z',
          subscription_end_date: '2026-08-20',
          status: 'DUE_SOON'
        })
        .eq('id', m.id);
      if (uErr) console.error("Member update error:", uErr);
      else console.log(`Member ${m.full_name} updated successfully!`);
    }
  }

  console.log("Fix complete!");
}

fixAkanksha();
