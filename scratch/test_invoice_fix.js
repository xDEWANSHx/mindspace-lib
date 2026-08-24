import { createClient } from '@supabase/supabase-js';

const url = 'https://bzdmuuuslrqlivjqbiwj.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZG11dXVzbHJxbGl2anFiaXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQyNTE5MywiZXhwIjoyMTAxMDAxMTkzfQ.G6eHJfQ8u7z2KfxQgI7DqL97dNzOxFYlYOLrgQ3l5q8';

const supabase = createClient(url, key);

async function testFix() {
  const invoiceId = 'INV-147837';
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invoiceId);

  let dbMatch = null;
  if (isUUID) {
    const { data } = await supabase.from('payments').select('*').eq('id', invoiceId).limit(1);
    dbMatch = data;
  } else {
    const { data } = await supabase.from('payments').select('*').ilike('invoice_id', `%${invoiceId}%`).limit(1);
    dbMatch = data;
  }

  console.log('SUCCESSFULLY LOADED INVOICE:', dbMatch?.[0]?.invoice_id, dbMatch?.[0]?.member_name, dbMatch?.[0]?.amount);
}

testFix();
