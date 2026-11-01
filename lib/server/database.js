import 'server-only';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://bzdmuuuslrqlivjqbiwj.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZG11dXVzbHJxbGl2anFiaXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQyNTE5MywiZXhwIjoyMTAxMDAxMTkzfQ.G6eHJfQ8u7z2KfxQgI7DqL97dNzOxFYlYOLrgQ3l5q8';

export function database() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || DEFAULT_KEY;
  if (!url || !key) throw new Error('Server database configuration is missing.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function readSettings() {
  try {
    const { data, error } = await database().from('site_settings').select('content').eq('id', 'default').maybeSingle();
    if (error) return {};
    return data?.content || {};
  } catch (err) {
    console.error('Error reading settings from database:', err);
    return {};
  }
}

