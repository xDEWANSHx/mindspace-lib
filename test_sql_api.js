const url = 'https://bzdmuuuslrqlivjqbiwj.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testEndpoints() {
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

  // Test 1: /pg
  try {
    const res = await fetch(`${url}/pg`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      },
      body: JSON.stringify({ query: sql })
    });
    console.log('/pg response:', res.status, await res.text());
  } catch (e) {
    console.log('/pg error:', e.message);
  }
}

testEndpoints();
