import { createClient } from '@supabase/supabase-js';

const url = 'https://bzdmuuuslrqlivjqbiwj.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZG11dXVzbHJxbGl2anFiaXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQyNTE5MywiZXhwIjoyMTAxMDAxMTkzfQ.G6eHJfQ8u7z2KfxQgI7DqL97dNzOxFYlYOLrgQ3l5q8';

const supabase = createClient(url, key);

async function fixPaymentMemberIds() {
  const { data: members, error: mErr } = await supabase.from('members').select('*');
  const { data: payments, error: pErr } = await supabase.from('payments').select('*');

  if (mErr || pErr) {
    console.error('Error fetching data:', mErr || pErr);
    return;
  }

  console.log(`Analyzing ${members.length} members and ${payments.length} payments...`);
  let remappedCount = 0;
  let memberSubEndFixed = 0;

  // Map each member name / mobile to active member object
  const memberMapByMobile = new Map();
  const memberMapByName = new Map();

  for (const m of members) {
    if (m.mobile) {
      const cleanMob = String(m.mobile).replace(/\D/g, '');
      if (cleanMob) memberMapByMobile.set(cleanMob, m);
    }
    if (m.full_name) {
      const cleanName = m.full_name.trim().toLowerCase();
      if (cleanName) memberMapByName.set(cleanName, m);
    }
  }

  for (const p of payments) {
    let targetMember = null;
    if (p.member_id) {
      targetMember = members.find(m => m.id === p.member_id);
    }
    if (!targetMember && p.mobile) {
      const cleanMob = String(p.mobile).replace(/\D/g, '');
      targetMember = memberMapByMobile.get(cleanMob);
    }
    if (!targetMember && p.member_name) {
      const cleanName = p.member_name.trim().toLowerCase();
      targetMember = memberMapByName.get(cleanName);
    }

    if (targetMember && p.member_id !== targetMember.id) {
      console.log(`Remapping payment ${p.invoice_id} (${p.member_name}) from member_id '${p.member_id}' to active member_id '${targetMember.id}' (${targetMember.full_name})`);
      const { error: pUpdateErr } = await supabase
        .from('payments')
        .update({ member_id: targetMember.id })
        .eq('id', p.id);

      if (pUpdateErr) {
        console.error(`Error updating payment ${p.invoice_id}:`, pUpdateErr);
      } else {
        remappedCount++;
        p.member_id = targetMember.id;
      }
    }
  }

  // Now recalculate subscription_end_date for all members based on their actual latest payment!
  for (const m of members) {
    const mPayments = payments.filter(p => p.member_id === m.id);
    if (mPayments.length > 0) {
      // Sort payments chronologically (oldest to newest)
      mPayments.sort((a, b) => {
        const tA = new Date(a.paid_at || a.created_at).getTime();
        const tB = new Date(b.paid_at || b.created_at).getTime();
        return tA - tB;
      });

      const latestPayment = mPayments[mPayments.length - 1];
      const latestPaidDate = (latestPayment.paid_at || latestPayment.created_at || "").substring(0, 10);
      
      if (latestPaidDate) {
        // Calculate expected subscription end date (latest paid date + 1 month)
        const parts = latestPaidDate.split('-').map(Number);
        if (parts.length === 3) {
          const [y, month, d] = parts;
          const target = new Date(y, month, d); // +1 month
          if (target.getDate() !== d) target.setDate(0);
          const yStr = target.getFullYear();
          const mStr = String(target.getMonth() + 1).padStart(2, '0');
          const dStr = String(target.getDate()).padStart(2, '0');
          const calculatedSubEnd = `${yStr}-${mStr}-${dStr}`;

          const currentSubEnd = m.subscription_end_date ? String(m.subscription_end_date).substring(0, 10) : "";

          if (currentSubEnd < calculatedSubEnd) {
            console.log(`Fixing member ${m.full_name} (${m.permanent_id}): subscription_end_date was '${currentSubEnd}', updating to '${calculatedSubEnd}' based on latest payment ${latestPayment.invoice_id} (${latestPaidDate})`);
            const { error: mSubErr } = await supabase
              .from('members')
              .update({ subscription_end_date: calculatedSubEnd, is_active: true, status: 'ACTIVE' })
              .eq('id', m.id);

            if (mSubErr) {
              console.error(`Error updating subscription_end_date for ${m.full_name}:`, mSubErr);
            } else {
              memberSubEndFixed++;
            }
          }
        }
      }
    }
  }

  console.log(`\n🎉 Remapped ${remappedCount} orphan/mismatched payments and updated ${memberSubEndFixed} member subscription end dates.`);
}

fixPaymentMemberIds();
