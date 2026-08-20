import { createClient } from '@supabase/supabase-js';

const url = 'https://bzdmuuuslrqlivjqbiwj.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZG11dXVzbHJxbGl2anFiaXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQyNTE5MywiZXhwIjoyMTAxMDAxMTkzfQ.G6eHJfQ8u7z2KfxQgI7DqL97dNzOxFYlYOLrgQ3l5q8';

const supabase = createClient(url, key);

async function checkRohit() {
  const { data: members } = await supabase.from('members').select('*').ilike('full_name', '%rohit%');
  console.log("Rohit Members:", members);

  const { data: payments } = await supabase.from('payments').select('*').eq('invoice_id', 'INV-837053');
  console.log("Invoice INV-837053 Payment:", payments);
}

checkRohit();
