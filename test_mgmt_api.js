const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testMgmt() {
  const sql = `
  CREATE TABLE IF NOT EXISTS branches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      total_capacity INT NOT NULL DEFAULT 113,
      address TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );
  `;

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

testMgmt();
