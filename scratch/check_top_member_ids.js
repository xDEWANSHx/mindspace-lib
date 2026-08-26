import { supabase } from "../lib/supabase.js";

async function checkTopMembers() {
  console.log("Checking top members in database...");
  const { data: members, error } = await supabase
    .from('members')
    .select('id, permanent_id, student_no, full_name, created_at, joining_date')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching members:", error);
    return;
  }

  console.log(`Fetched ${members.length} members.`);
  console.log("Top 15 members in DB (by created_at desc):");
  members.slice(0, 15).forEach((m, idx) => {
    console.log(`${idx + 1}. [${m.permanent_id || m.student_no}] - ${m.full_name} | created_at: ${m.created_at} | joining_date: ${m.joining_date}`);
  });

  process.exit(0);
}

checkTopMembers();
