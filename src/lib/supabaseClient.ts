import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// Get Supabase configuration from environment variables
const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
}

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our database schema
export interface Song {
  id: string;
  title: string;
  artist: string | null;
  body: string;
  created_at: string;
}

export interface SongListItem {
  id: string;
  title: string;
  artist: string | null;
}