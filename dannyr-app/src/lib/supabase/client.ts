'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Browser-side Supabase client with anon key
// Used in client components for real-time subscriptions and reads
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
