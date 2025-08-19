import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { executeSupabaseQuery, type RetryOptions } from '$lib/utils/errorHandling';
import type { SongListItem, Song } from '$lib/types';

// Get Supabase configuration from environment variables
const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
}

// Create Supabase client
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Export the raw client for direct use when needed
export const supabase = supabaseClient;

/**
 * Enhanced Supabase operations with error handling and retry logic
 */
export const supabaseService = {
  /**
   * Fetch all songs with error handling and retry logic
   */
  async fetchSongs(options: RetryOptions = {}): Promise<SongListItem[]> {
    return executeSupabaseQuery(
      async () => {
        const result = await supabaseClient
          .from('songs')
          .select('id, title, artist')
          .order('title');
        return result;
      },
      options
    );
  },

  /**
   * Fetch a single song by ID with error handling and retry logic
   */
  async fetchSongById(id: string, options: RetryOptions = {}): Promise<Song> {
    return executeSupabaseQuery(
      async () => {
        const result = await supabaseClient
          .from('songs')
          .select('id, title, artist, body')
          .eq('id', id)
          .single();
        return result;
      },
      options
    );
  },

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabaseClient
        .from('songs')
        .select('id')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }
};

// Note: Type definitions are in src/lib/types.ts to avoid duplication