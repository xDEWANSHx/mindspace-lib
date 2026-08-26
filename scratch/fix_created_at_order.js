import { supabase } from "../lib/supabase.js";

async function fixCreatedAtOrder() {
  console.log("Updating timestamps for top records so ID descending order is rock-solid...");

  // MSL0125 -> 2026-08-25T12:00:04Z
  // MSL0124 -> 2026-08-25T12:00:03Z
  // MSL0123 -> 2026-08-25T12:00:02Z
  // MSL0122 -> 2026-08-25T12:00:01Z

  const updates = [
    { permanent_id: 'MSL0125', created_at: '2026-08-25T12:00:04+00:00' },
    { permanent_id: 'MSL0124', created_at: '2026-08-25T12:00:03+00:00' },
    { permanent_id: 'MSL0123', created_at: '2026-08-25T12:00:02+00:00' },
    { permanent_id: 'MSL0122', created_at: '2026-08-25T12:00:01+00:00' }
  ];

  for (const u of updates) {
    const { error } = await supabase
      .from('members')
      .update({ created_at: u.created_at })
      .eq('permanent_id', u.permanent_id);

    if (error) console.error("Error updating", u.permanent_id, error);
    else console.log(`Successfully updated ${u.permanent_id} created_at timestamp!`);
  }

  process.exit(0);
}

fixCreatedAtOrder();
