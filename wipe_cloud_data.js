const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bzdmuuuslrqlivjqbiwj.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZG11dXVzbHJxbGl2anFiaXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQyNTE5MywiZXhwIjoyMTAxMDAxMTkzfQ.G6eHJfQ8u7z2KfxQgI7DqL97dNzOxFYlYOLrgQ3l5q8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function wipeData() {
  console.log('Wiping all records from cloud database...');
  
  const res1 = await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Payments delete result:', res1.error || 'SUCCESS');

  const res2 = await supabase.from('members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Members delete result:', res2.error || 'SUCCESS');

  const res3 = await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Expenses delete result:', res3.error || 'SUCCESS');

  const res4 = await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Activity Logs delete result:', res4.error || 'SUCCESS');

  const res5 = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Leads delete result:', res5.error || 'SUCCESS');

  console.log('Cloud database wipe complete!');
}

wipeData();
