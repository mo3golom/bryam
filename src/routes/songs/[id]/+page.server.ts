import { error } from '@sveltejs/kit';
import { supabaseService } from '$lib/server/supabaseClient';
import { analyzeError } from '$lib/utils/errorHandling';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params;

  if (!id) {
    throw error(404, 'Song not found');
  }

  try {
    const song = await supabaseService.fetchSongById(id, {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 5000
    });

    return {
      song
    };
  } catch (err) {
    // If it's already a SvelteKit error, re-throw it
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    
    console.error('Error fetching song:', err);
    
    // Analyze the error to provide appropriate response
    const errorInfo = analyzeError(err);
    
    // Handle specific error cases
    if (err && typeof err === 'object' && 'code' in err) {
      const supabaseError = err as { code: string };
      
      if (supabaseError.code === 'PGRST116') {
        // No rows returned - song not found
        throw error(404, 'Song not found');
      }
    }
    
    // For network errors, return 503 Service Unavailable
    if (errorInfo.isNetworkError) {
      throw error(503, 'Service temporarily unavailable. Please try again later.');
    }
    
    // For other errors, return 500
    throw error(500, errorInfo.message);
  }
};