import { createClient } from '@supabase/supabase-js';
// No database credential is sent to the browser. All requests use our gateway.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzdmuuuslrqlivjqbiwj.supabase.co';
export const supabase = createClient(url, 'same-origin-gateway', {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (input, options = {}) => {
    const target = new URL(typeof input === 'string' ? input : input.url);
    const headers = new Headers(options.headers);
    headers.delete('authorization'); headers.delete('apikey');
    return fetch('/api/database' + target.pathname + target.search, { ...options, headers, credentials: 'same-origin', cache: 'no-store' });
  } }
});
