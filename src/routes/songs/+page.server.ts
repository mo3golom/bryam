import { supabaseService } from '$lib/server/supabaseClient';
import { analyzeError } from '$lib/utils/errorHandling';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async () => {
  try {
    const songs = await supabaseService.fetchSongs({
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 5000
    });
    return { songs };
  } catch (err) {
    console.error('Error fetching songs:', err);
    const errorInfo = analyzeError(err);
    return {
      songs: [],
      error: errorInfo.message
    };
  }
};
