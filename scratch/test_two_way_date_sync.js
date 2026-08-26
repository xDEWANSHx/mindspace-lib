import { supabase } from "../lib/supabase.js";
import { getMemberSubscriptionDates, subtractOneMonth, addOneMonth } from "../lib/adminService.js";

async function testTwoWaySync() {
  console.log("Testing 2-way sync between Subscription Start Date and Expiry Date...");

  console.log("subtractOneMonth('2026-09-26') =", subtractOneMonth('2026-09-26'));
  console.log("addOneMonth('2026-08-26') =", addOneMonth('2026-08-26'));

  // Update MSL0126 in DB to subscription_end_date = 2026-09-26
  const { data: members } = await supabase.from('members').select('*').eq('permanent_id', 'MSL0126');
  if (members && members.length > 0) {
    const mem = members[0];
    await supabase.from('members').update({ subscription_end_date: '2026-09-26' }).eq('id', mem.id);

    const { data: freshM } = await supabase.from('members').select('*').eq('id', mem.id);
    const { data: freshP } = await supabase.from('payments').select('*');

    const dates = getMemberSubscriptionDates(freshM[0], freshP);
    console.log("Computed dates output:", dates);

    if (dates.subStart === "2026-08-26" && dates.subExpiry === "2026-09-26") {
      console.log("PASS: Subscription Start Date (2026-08-26) and Expiry Date (2026-09-26) are 100% in sync!");
    } else {
      console.error("FAIL: Dates mismatch:", dates);
    }
  }

  process.exit(0);
}

testTwoWaySync();
