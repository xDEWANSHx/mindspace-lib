import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzdmuuuslrqlivjqbiwj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZG11dXVzbHJxbGl2anFiaXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MjUxOTMsImV4cCI6MjEwMTAwMTE5M30.BqcDV2l1WsGdF7ZjKbvj9iqyJDumAkSXP9rpHynuhPc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
