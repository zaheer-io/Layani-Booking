import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug log for environment variables (masked)
if (typeof window !== 'undefined') {
  console.log('Supabase check:', {
    url: supabaseUrl ? 'Set' : 'Missing',
    key: supabaseAnonKey ? 'Set' : 'Missing'
  });
}

if (!supabaseUrl || supabaseUrl === 'undefined' || !supabaseAnonKey || supabaseAnonKey === 'undefined') {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file or Render dashboard settings.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

