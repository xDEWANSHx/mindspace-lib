import { supabase } from "../lib/supabase.js";

async function inspectMembers() {
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .or('permanent_id.ilike.MSL012%,student_no.ilike.MSL012%')
    .order('created_at', { ascending: false });

  console.log("Members with MSL012x:");
  console.table(members.map(m => ({
    id: m.id,
    permanent_id: m.permanent_id,
    student_no: m.student_no,
    full_name: m.full_name,
    mobile: m.mobile,
    created_at: m.created_at,
    joining_date: m.joining_date,
    subscription_end_date: m.subscription_end_date
  })));

  process.exit(0);
}

inspectMembers();
