import { createClient } from '@supabase/supabase-js';

const url = 'https://bzdmuuuslrqlivjqbiwj.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function test() {
  const tables = ['branches', 'members', 'payments', 'expenses', 'activity_logs'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    console.log(`Table '${t}':`, error ? `ERROR: ${error.message}` : `OK (${data?.length || 0} rows)`);
  }
}

test();
