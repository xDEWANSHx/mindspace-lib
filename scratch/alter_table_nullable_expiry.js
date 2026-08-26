const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZG11dXVzbHJxbGl2anFiaXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQyNTE5MywiZXhwIjoyMTAxMDAxMTkzfQ.G6eHJfQ8u7z2KfxQgI7DqL97dNzOxFYlYOLrgQ3l5q8';

async function alterTable() {
  const sql = `ALTER TABLE public.members ALTER COLUMN subscription_end_date DROP NOT NULL;`;

  const endpoints = [
    `https://api.supabase.com/v1/projects/bzdmuuuslrqlivjqbiwj/database/query`,
    `https://bzdmuuuslrqlivjqbiwj.supabase.co/rest/v1/rpc/exec_sql`,
    `https://bzdmuuuslrqlivjqbiwj.supabase.co/pg_meta/v1/query`
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey
        },
        body: JSON.stringify({ query: sql, sql: sql })
      });
      console.log(ep, res.status, await res.text());
    } catch (e) {
      console.log(ep, 'Error:', e.message);
    }
  }
}

alterTable();
