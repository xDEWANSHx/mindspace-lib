import { createClient } from '@supabase/supabase-js';

const url = 'https://bzdmuuuslrqlivjqbiwj.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZG11dXVzbHJxbGl2anFiaXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQyNTE5MywiZXhwIjoyMTAxMDAxMTkzfQ.G6eHJfQ8u7z2KfxQgI7DqL97dNzOxFYlYOLrgQ3l5q8';

const supabase = createClient(url, key);

async function healJoiningDates() {
  const { data: members, error: mErr } = await supabase.from('members').select('*');
  const { data: payments, error: pErr } = await supabase.from('payments').select('*');

  if (mErr || pErr) {
    console.error('Error fetching data:', mErr || pErr);
    return;
  }

  console.log(`Analyzing ${members.length} members and ${payments.length} payments...`);
  let fixedCount = 0;

  for (const m of members) {
    const mPayments = payments.filter(
      p => p.member_id === m.id || (p.member_name && m.full_name && p.member_name.trim().toLowerCase() === m.full_name.trim().toLowerCase())
    );

    if (mPayments.length > 0) {
      const paymentDates = mPayments
        .map(p => (p.paid_at || p.created_at || "").substring(0, 10))
        .filter(Boolean);
      paymentDates.sort();

      const earliestPaymentDate = paymentDates[0];
      const currentJoin = m.joining_date ? String(m.joining_date).substring(0, 10) : null;

      if (!currentJoin || currentJoin > earliestPaymentDate) {
        console.log(`Fixing ${m.full_name} (${m.permanent_id}): joining_date was '${currentJoin}', earliest payment date is '${earliestPaymentDate}'`);
        const { error: updateErr } = await supabase
          .from('members')
          .update({ joining_date: earliestPaymentDate })
          .eq('id', m.id);

        if (updateErr) {
          console.error(`Error updating member ${m.full_name}:`, updateErr);
        } else {
          fixedCount++;
        }
      }
    }
  }

  console.log(`\n🎉 Data Healing Complete! Updated ${fixedCount} student member joining dates in Supabase.`);
}

healJoiningDates();
