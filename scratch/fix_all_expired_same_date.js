import { createClient } from '@supabase/supabase-js';

const url = 'https://bzdmuuuslrqlivjqbiwj.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZG11dXVzbHJxbGl2anFiaXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQyNTE5MywiZXhwIjoyMTAxMDAxMTkzfQ.G6eHJfQ8u7z2KfxQgI7DqL97dNzOxFYlYOLrgQ3l5q8';

const supabase = createClient(url, key);

function addOneMonth(dateStr) {
  if (!dateStr) return "";
  const parts = String(dateStr).substring(0, 10).split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return "";
  const [y, m, d] = parts;
  let newMonth = m + 1;
  let newYear = y;
  if (newMonth > 12) {
    newMonth = 1;
    newYear++;
  }
  const maxDays = new Date(newYear, newMonth, 0).getDate();
  const newDay = Math.min(d, maxDays);
  return `${newYear}-${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;
}

async function fixSameDateExpiries() {
  console.log("Fetching all members from Supabase...");
  const { data: members, error } = await supabase.from('members').select('*');
  if (error || !members) {
    console.error("Error fetching members:", error);
    return;
  }

  console.log(`Checking ${members.length} members for invalid subscription_end_date <= joining_date...`);
  let fixedCount = 0;

  for (const m of members) {
    const joinStr = m.joining_date ? m.joining_date.substring(0, 10) : "";
    const endStr = m.subscription_end_date ? m.subscription_end_date.substring(0, 10) : "";

    // If subscription_end_date is missing or <= joining_date
    if (joinStr && (!endStr || endStr <= joinStr)) {
      const correctEnd = addOneMonth(joinStr);
      console.log(`Fixing member ${m.full_name} (${m.permanent_id || m.id}): joining_date=${joinStr}, old_expiry=${endStr} -> new_expiry=${correctEnd}`);

      const { error: updateErr } = await supabase
        .from('members')
        .update({
          subscription_end_date: correctEnd,
          status: 'ACTIVE'
        })
        .eq('id', m.id);

      if (updateErr) {
        console.error(`Failed to update member ${m.full_name}:`, updateErr);
      } else {
        fixedCount++;
      }
    }
  }

  console.log(`Successfully fixed ${fixedCount} student records in Supabase!`);
}

fixSameDateExpiries();
