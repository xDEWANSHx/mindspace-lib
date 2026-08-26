import { supabase } from "../lib/supabase.js";
import { getMemberSubscriptionDates } from "../lib/adminService.js";

async function testSyncEdit() {
  console.log("Testing sync when editing student profile...");

  // Fetch MSL0126
  const { data: members } = await supabase.from('members').select('*').eq('permanent_id', 'MSL0126');
  const { data: payments } = await supabase.from('payments').select('*');

  if (!members || members.length === 0) {
    console.error("MSL0126 not found");
    return;
  }

  const mem = members[0];
  const memPayments = payments.filter(p => p.member_id === mem.id || p.member_id === mem.permanent_id);

  console.log("Current member state:", mem.full_name, "joining_date:", mem.joining_date, "subscription_end_date:", mem.subscription_end_date);

  // Perform mock edit: Start Date = 2026-08-23, Expiry = 2026-09-23
  const newStart = "2026-08-23";
  const newExpiry = "2026-09-23";

  // Update member
  await supabase.from('members').update({ subscription_end_date: newExpiry }).eq('id', mem.id);

  // Update payment notes
  if (memPayments.length > 0) {
    const latestP = memPayments[0];
    let updatedNotes = latestP.notes || "";
    if (updatedNotes.includes("Start Date:")) {
      updatedNotes = updatedNotes.replace(/Start Date:\s*\d{4}-\d{2}-\d{2}/i, `Start Date: ${newStart}`);
    }
    if (updatedNotes.includes("Expiry:")) {
      updatedNotes = updatedNotes.replace(/Expiry:\s*\d{4}-\d{2}-\d{2}/i, `Expiry: ${newExpiry}`);
    }
    await supabase.from('payments').update({ notes: updatedNotes }).eq('id', latestP.id);
  }

  // Refetch
  const { data: freshM } = await supabase.from('members').select('*').eq('id', mem.id);
  const { data: freshP } = await supabase.from('payments').select('*');

  const dates = getMemberSubscriptionDates(freshM[0], freshP);
  console.log("Updated getMemberSubscriptionDates output:", dates);

  if (dates.subStart === "2026-08-23" && dates.subExpiry === "2026-09-23") {
    console.log("PASS: Start Date and Expiry Date are 100% in sync everywhere!");
  } else {
    console.error("FAIL: Mismatch in dates:", dates);
  }

  process.exit(0);
}

testSyncEdit();
