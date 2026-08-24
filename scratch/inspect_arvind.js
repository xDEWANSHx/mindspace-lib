import { createClient } from '@supabase/supabase-js';

const url = 'https://bzdmuuuslrqlivjqbiwj.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZG11dXVzbHJxbGl2anFiaXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQyNTE5MywiZXhwIjoyMTAxMDAxMTkzfQ.G6eHJfQ8u7z2KfxQgI7DqL97dNzOxFYlYOLrgQ3l5q8';

const supabase = createClient(url, key);

async function inspectArvind() {
  const { data: members } = await supabase.from('members').select('*');
  const { data: payments } = await supabase.from('payments').select('*');

  const arvind = members.find(m => m.full_name && m.full_name.toLowerCase().includes('arvind'));
  console.log("=== ARVIND MEMBER RECORD ===");
  console.log(arvind);

  if (arvind) {
    const arvindPayments = payments.filter(p => p.member_id === arvind.id || (p.member_name && p.member_name.toLowerCase().includes('arvind')));
    console.log(`=== ARVIND PAYMENTS (${arvindPayments.length}) ===`);
    console.log(arvindPayments);
  }
}

inspectArvind();
