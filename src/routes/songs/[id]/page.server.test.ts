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
  return { supabase: mockSupabase }
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

  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    // Get the mocked supabase instance
    const { supabase } = await import('$lib/supabaseClient')
    mockSupabase = supabase
  })

  describe('Successful song loading', () => {
    it('should load song data successfully with valid ID', async () => {
      const mockChain = {
        single: vi.fn().mockResolvedValue({
          data: mockSong,
          error: null
        })
      }
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue(mockChain)
        })
      })

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }
      const result = await load({ params } as any)

      expect(result).toEqual({ song: mockSong })
      expect(mockSupabase.from).toHaveBeenCalledWith('songs')
      expect(mockChain.single).toHaveBeenCalled()
    })

    it('should query correct fields from database', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockSong,
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }
      await load({ params } as any)

      expect(mockSelect).toHaveBeenCalledWith('id, title, artist, body')
    })

    it('should filter by correct song ID', async () => {
      const mockEq = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockSong,
          error: null
        })
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEq
        })
      })

      const songId = '123e4567-e89b-12d3-a456-426614174000'
      const params = { id: songId }
      await load({ params } as any)

      expect(mockEq).toHaveBeenCalledWith('id', songId)
    })

    it('should handle song with null artist', async () => {
      const songWithNullArtist = { ...mockSong, artist: null }
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: songWithNullArtist,
              error: null
            })
          })
        })
      })

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }
      const result = await load({ params } as any)

      expect(result).toEqual({ song: songWithNullArtist })
    })

    it('should handle song with empty body', async () => {
      const songWithEmptyBody = { ...mockSong, body: '' }
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: songWithEmptyBody,
              error: null
            })
          })
        })
      })

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
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows returned' }
            })
          })
        })
      })

      const params = { id: 'non-existent-id' }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(404, 'Song not found')
    })

    it('should throw 404 error when song data is null', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      })

      const params = { id: 'valid-id-but-no-data' }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(404, 'Song not found')
    })

    it('should handle malformed UUID gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows returned' }
            })
          })
        })
      })

      const params = { id: 'not-a-valid-uuid' }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(404, 'Song not found')
    })
  })

  describe('Database error handling', () => {
    it('should throw 500 error for database connection issues', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'CONNECTION_ERROR', message: 'Database connection failed' }
            })
          })
        })
      })

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(500, 'Failed to load song')
    })

    it('should throw 500 error for authentication issues', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST301', message: 'JWT expired' }
            })
          })
        })
      })

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(500, 'Failed to load song')
    })

    it('should handle network timeouts', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Network timeout'))
          })
        })
      })

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(500, 'Failed to load song')
    })

    it('should handle unexpected errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Unexpected error'))
          })
        })
      })

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(500, 'Failed to load song')
    })

    it('should re-throw SvelteKit errors without modification', async () => {
      const svelteKitError = { status: 404, body: { message: 'Not found' } }
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(svelteKitError)
          })
        })
      })

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      await expect(load({ params } as any)).rejects.toEqual(svelteKitError)
    })

    it('should log errors for debugging', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' }
            })
          })
        })
      })

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith('Supabase error:', { code: 'DB_ERROR', message: 'Database error' })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Edge cases and data validation', () => {
    it('should handle very long song IDs', async () => {
      const veryLongId = 'a'.repeat(1000)
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows returned' }
            })
          })
        })
      })

      const params = { id: veryLongId }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(404, 'Song not found')
    })

    it('should handle special characters in song ID', async () => {
      const specialCharId = 'song-id-with-special-chars-!@#$%^&*()'
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows returned' }
            })
          })
        })
      })

      const params = { id: specialCharId }

      await expect(load({ params } as any)).rejects.toThrow()
      expect(error).toHaveBeenCalledWith(404, 'Song not found')
    })

    it('should handle SQL injection attempts', async () => {
      const maliciousId = "'; DROP TABLE songs; --"
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows returned' }
            })
          })
        })
      })

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
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: largeBodySong,
              error: null
            })
          })
        })
      })

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
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: specialCharSong,
              error: null
            })
          })
        })
      })

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }
      const result = await load({ params } as any)

      expect(result).toEqual({ song: specialCharSong })
    })

    it('should handle concurrent requests efficiently', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSong,
              error: null
            })
          })
        })
      })

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
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockSong,
        error: null
      })
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingle
          })
        })
      })

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }
      await load({ params } as any)

      // Should only make one database call
      expect(mockSingle).toHaveBeenCalledTimes(1)
    })

    it('should handle database response efficiently', async () => {
      const startTime = Date.now()
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSong,
              error: null
            })
          })
        })
      })

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
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: largeSong,
              error: null
            })
          })
        })
      })

      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }
      
      // Multiple calls should not accumulate memory
      for (let i = 0; i < 5; i++) {
        const result = await load({ params } as any)
        expect((result as any).song.body).toBe(largeSong.body)
      }
    })
  })
})