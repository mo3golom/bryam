import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params;

  if (!id) {
    throw error(404, 'Song not found');
  }

  try {
    const { data: song, error: supabaseError } = await supabase
      .from('songs')
      .select('id, title, artist, body')
      .eq('id', id)
      .single();

    if (supabaseError) {
      if (supabaseError.code === 'PGRST116') {
        // No rows returned - song not found
        throw error(404, 'Song not found');
      }
      
      console.error('Supabase error:', supabaseError);
      throw error(500, 'Failed to load song');
    }

    if (!song) {
      throw error(404, 'Song not found');
    }

    return {
      song
    };
  } catch (err) {
    // If it's already a SvelteKit error, re-throw it
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    
    console.error('Error fetching song:', err);
    throw error(500, 'Failed to load song');
  }
};