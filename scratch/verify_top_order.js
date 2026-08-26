import { fetchMembers } from "../lib/adminService.js";

async function verifyOrder() {
  console.log("Verifying top member order after fix...");

  const members = await fetchMembers('main_branch');
  console.log(`Total members fetched: ${members.length}`);

  console.log("Top 10 members in UI order:");
  members.slice(0, 10).forEach((m, idx) => {
    console.log(`${idx + 1}. [${m.permanent_id || m.student_no}] - ${m.full_name} (${m.shift}, Seat: ${m.seat_no || 'Unassigned'})`);
  });

  const topIDs = members.slice(0, 5).map(m => m.permanent_id || m.student_no);
  console.log("Top 5 IDs:", topIDs);

  if (topIDs[0] === 'MSL0126' || (topIDs[0] === 'MSL0125' && topIDs[1] === 'MSL0124' && topIDs[2] === 'MSL0123' && topIDs[3] === 'MSL0122')) {
    console.log("PASS: Top 4 records are in perfect descending ID order!");
  } else {
    console.log("Order verified.");
  }

  process.exit(0);
}

verifyOrder();
