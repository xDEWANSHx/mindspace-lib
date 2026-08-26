import { supabase } from "../lib/supabase.js";
import { getMemberSubscriptionDates } from "../lib/adminService.js";

async function syncAllInvoicesNow() {
  console.log("Syncing all existing member invoices right now...");

  const { data: members } = await supabase.from('members').select('*');
  const { data: payments } = await supabase.from('payments').select('*');

  if (!members || !payments) {
    console.error("Failed to fetch members or payments from Supabase");
    return;
  }

  let updatedCount = 0;

  for (const m of members) {
    const dates = getMemberSubscriptionDates(m, payments);
    const subStart = dates.subStart !== "--" ? dates.subStart : null;
    const subExpiry = dates.subExpiry !== "--" ? dates.subExpiry : null;

    const memPayments = payments.filter(p =>
      p.member_id === m.id ||
      p.member_id === m.permanent_id ||
      p.member_id === m.student_no ||
      (p.member_name && m.full_name && p.member_name.trim().toLowerCase() === m.full_name.trim().toLowerCase())
    );

    if (memPayments.length > 0) {
      memPayments.sort((a, b) => {
        const tA = a.paid_at ? new Date(a.paid_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
        const tB = b.paid_at ? new Date(b.paid_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
        return tB - tA;
      });

      const latestP = memPayments[0];
      let notes = latestP.notes || "";
      let modified = false;

      if (subStart) {
        if (notes.includes("Start Date:")) {
          notes = notes.replace(/Start Date:\s*\d{4}-\d{2}-\d{2}/i, `Start Date: ${subStart}`);
          modified = true;
        } else {
          notes += ` — Start Date: ${subStart}`;
          modified = true;
        }
      }

      if (subExpiry) {
        if (notes.includes("Expiry:")) {
          notes = notes.replace(/Expiry:\s*\d{4}-\d{2}-\d{2}/i, `Expiry: ${subExpiry}`);
          modified = true;
        } else {
          notes += `, Expiry: ${subExpiry}`;
          modified = true;
        }
      }

      const nameModified = latestP.member_name !== m.full_name;

      if (modified || nameModified) {
        const { error } = await supabase.from('payments').update({
          member_name: m.full_name,
          notes: notes
        }).eq('id', latestP.id);

        if (!error) updatedCount++;
        else console.error("Error updating payment ID", latestP.id, error);
      }
    }
  }

  console.log(`Successfully synced ${updatedCount} invoice receipt records in Supabase!`);
  process.exit(0);
}

syncAllInvoicesNow();
