import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseAvailable = !!supabaseUrl && !!supabaseAnonKey;

if (!isSupabaseAvailable) {
  console.warn('[Supabase] Missing environment variables — auth disabled');
}

export const supabase = isSupabaseAvailable
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (null as any);