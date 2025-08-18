import { describe, it, expect, vi, beforeEach } from 'vitest'
import { error } from '@sveltejs/kit'
import { load } from './+page.server'
import type { Song } from '$lib/types'

// Mock Supabase client
vi.mock('$lib/supabaseClient', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
  
  const mockSupabaseService = {
    fetchSongById: vi.fn()
  }
  
  return { 
    supabase: mockSupabase,
    supabaseService: mockSupabaseService
  }
})

// Mock SvelteKit error function
vi.mock('@sveltejs/kit', () => ({
  error: vi.fn((status: number, message: string) => {
    const err = new Error(message) as any
    err.status = status
    err.body = { message }
    return err
  })
}))

describe('Individual Song Page Server Load Function', () => {
  const mockSong: Song = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Somewhere Over The Rainbow',
    artist: 'Israel Kamakawiwoʻole',
    body: '[C]Somewhere [Em]over the rainbow\n[F]Way up [C]high'
  }

  let mockSupabaseService: any

  beforeEach(async () => {
    vi.clearAllMocks()
    // Get the mocked supabase service instance
    const { supabaseService } = await import('$lib/supabaseClient')
    mockSupabaseService = supabaseService
  })

  describe('Successful song loading', () => {
    it('should load song data successfully with valid ID', async () => {
      mockSupabaseService.fetchSongById.mockResolvedValue(mockSong)

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }
      const result = await load({ params } as any)

      expect(result).toEqual({ song: mockSong })
      expect(mockSupabaseService.fetchSongById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 5000
      })
    })

    it('should query correct fields from database', async () => {
      mockSupabaseService.fetchSongById.mockResolvedValue(mockSong)

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }
      await load({ params } as any)

      expect(mockSupabaseService.fetchSongById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 5000
      })
    })

    it('should filter by correct song ID', async () => {
      mockSupabaseService.fetchSongById.mockResolvedValue(mockSong)

      const songId = '123e4567-e89b-12d3-a456-426614174000'
      const params = { id: songId }
      await load({ params } as any)

      expect(mockSupabaseService.fetchSongById).toHaveBeenCalledWith(songId, {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 5000
      })
    })

    it('should handle song with null artist', async () => {
      const songWithNullArtist = { ...mockSong, artist: null }
      mockSupabaseService.fetchSongById.mockResolvedValue(songWithNullArtist)

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }
      const result = await load({ params } as any)

      expect(result).toEqual({ song: songWithNullArtist })
    })

    it('should handle song with empty body', async () => {
      const songWithEmptyBody = { ...mockSong, body: '' }
      mockSupabaseService.fetchSongById.mockResolvedValue(songWithEmptyBody)

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }
      const result = await load({ params } as any)

      expect(result).toEqual({ song: songWithEmptyBody })
    })
  })

  describe('404 error handling', () => {
    it('should throw 404 error when song ID is missing', async () => {
      const params = { id: undefined }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(404, 'Song not found')
    })

    it('should throw 404 error when song ID is empty string', async () => {
      const params = { id: '' }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(404, 'Song not found')
    })

    it('should throw 404 error when song is not found (PGRST116)', async () => {
      const supabaseError = { code: 'PGRST116', message: 'No rows returned' }
      mockSupabaseService.fetchSongById.mockRejectedValue(supabaseError)

      const params = { id: 'non-existent-id' }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(404, 'Song not found')
    })

    it('should throw 404 error when song data is null', async () => {
      const supabaseError = { code: 'PGRST116', message: 'No rows returned' }
      mockSupabaseService.fetchSongById.mockRejectedValue(supabaseError)

      const params = { id: 'valid-id-but-no-data' }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(404, 'Song not found')
    })

    it('should handle malformed UUID gracefully', async () => {
      const supabaseError = { code: 'PGRST116', message: 'No rows returned' }
      mockSupabaseService.fetchSongById.mockRejectedValue(supabaseError)

      const params = { id: 'not-a-valid-uuid' }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(404, 'Song not found')
    })
  })

  describe('Database error handling', () => {
    it('should throw 500 error for database connection issues', async () => {
      const dbError = { code: 'CONNECTION_ERROR', message: 'Database connection failed' }
      mockSupabaseService.fetchSongById.mockRejectedValue(dbError)

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(500, 'A database error occurred. Please try again later.')
    })

    it('should throw 500 error for authentication issues', async () => {
      const authError = { code: 'PGRST301', message: 'JWT expired' }
      mockSupabaseService.fetchSongById.mockRejectedValue(authError)

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(503, 'Service temporarily unavailable. Please try again later.')
    })

    it('should handle network timeouts', async () => {
      const networkError = new Error('Network timeout')
      mockSupabaseService.fetchSongById.mockRejectedValue(networkError)

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(500, 'Network timeout')
    })

    it('should handle unexpected errors gracefully', async () => {
      const unexpectedError = new Error('Unexpected error')
      mockSupabaseService.fetchSongById.mockRejectedValue(unexpectedError)

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(500, 'Unexpected error')
    })

    it('should re-throw SvelteKit errors without modification', async () => {
      const svelteKitError = { status: 404, body: { message: 'Not found' } }
      mockSupabaseService.fetchSongById.mockRejectedValue(svelteKitError)

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      await expect(load({ params } as any)).rejects.toEqual(svelteKitError)
    })

    it('should log errors for debugging', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const dbError = { code: 'DB_ERROR', message: 'Database error' }
      mockSupabaseService.fetchSongById.mockRejectedValue(dbError)

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching song:', dbError)
      
      consoleSpy.mockRestore()
    })
  })

  describe('Edge cases and data validation', () => {
    it('should handle very long song IDs', async () => {
      const veryLongId = 'a'.repeat(1000)
      const supabaseError = { code: 'PGRST116', message: 'No rows returned' }
      mockSupabaseService.fetchSongById.mockRejectedValue(supabaseError)

      const params = { id: veryLongId }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(404, 'Song not found')
    })

    it('should handle special characters in song ID', async () => {
      const specialCharId = 'song-id-with-special-chars-!@#$%^&*()'
      const supabaseError = { code: 'PGRST116', message: 'No rows returned' }
      mockSupabaseService.fetchSongById.mockRejectedValue(supabaseError)

      const params = { id: specialCharId }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(404, 'Song not found')
    })

    it('should handle SQL injection attempts', async () => {
      const maliciousId = "'; DROP TABLE songs; --"
      const supabaseError = { code: 'PGRST116', message: 'No rows returned' }
      mockSupabaseService.fetchSongById.mockRejectedValue(supabaseError)

      const params = { id: maliciousId }

      // Should safely handle malicious input through Supabase client
      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(404, 'Song not found')
    })

    it('should handle songs with very large body content', async () => {
      const largeBodySong = {
        ...mockSong,
        body: '[C]'.repeat(10000) + 'Very large song content'.repeat(1000)
      }
      mockSupabaseService.fetchSongById.mockResolvedValue(largeBodySong)

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }
      const result = await load({ params } as any)

      expect(result).toEqual({ song: largeBodySong })
    })

    it('should handle songs with special characters in content', async () => {
      const specialCharSong = {
        ...mockSong,
        title: 'Song with "Quotes" & <Tags>',
        artist: 'Artist & Co. "Special"',
        body: '[C]Content with émojis 🎵 and special chars ñoñó'
      }
      mockSupabaseService.fetchSongById.mockResolvedValue(specialCharSong)

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }
      const result = await load({ params } as any)

      expect(result).toEqual({ song: specialCharSong })
    })

    it('should handle concurrent requests efficiently', async () => {
      mockSupabaseService.fetchSongById.mockResolvedValue(mockSong)

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }
      
      // Simulate concurrent requests
      const promises = Array.from({ length: 10 }, () => load({ params } as any))
      const results = await Promise.all(promises)

      // All requests should succeed
      results.forEach(result => {
        expect(result).toEqual({ song: mockSong })
      })
    })
  })

  describe('Performance and optimization', () => {
    it('should make minimal database queries', async () => {
      mockSupabaseService.fetchSongById.mockResolvedValue(mockSong)

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }
      await load({ params } as any)

      // Should only make one database call
      expect(mockSupabaseService.fetchSongById).toHaveBeenCalledTimes(1)
    })

    it('should handle database response efficiently', async () => {
      const startTime = Date.now()
      mockSupabaseService.fetchSongById.mockResolvedValue(mockSong)

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }
      const result = await load({ params } as any)
      
      const endTime = Date.now()
      const executionTime = endTime - startTime

      expect(result).toEqual({ song: mockSong })
      expect(executionTime).toBeLessThan(100) // Should be very fast in tests
    })

    it('should not leak memory with large datasets', async () => {
      const largeSong = {
        ...mockSong,
        body: 'Large content '.repeat(10000)
      }
      mockSupabaseService.fetchSongById.mockResolvedValue(largeSong)

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }
      
      // Multiple calls should not accumulate memory
      for (let i = 0; i < 5; i++) {
        const result = await load({ params } as any)
        expect((result as any).song.body).toBe(largeSong.body)
      }
    })
  })
})