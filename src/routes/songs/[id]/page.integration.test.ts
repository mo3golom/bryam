import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { goto } from '$app/navigation'
import SongPage from './+page.svelte'
import type { Song } from '$lib/types'

// Mock dependencies
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}))

// Mock Supabase (not needed for these tests but imported by components)
vi.mock('$lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }
}))

vi.mock('$lib/components/SongViewer.svelte', () => ({
  default: vi.fn(() => ({
    $$: { fragment: null },
    $destroy: vi.fn(),
    $on: vi.fn(),
    $set: vi.fn()
  }))
}))

vi.mock('$lib/utils/chordpro.js', () => ({
  parseChordPro: vi.fn(() => ({
    lines: [
      {
        parts: [
          { chord: 'C', word: 'Somewhere' },
          { chord: null, word: ' ' },
          { chord: 'Em', word: 'over' },
          { chord: null, word: ' the rainbow' }
        ]
      }
    ]
  }))
}))

describe('End-to-End User Journey Integration Tests', () => {
  const mockSong: Song = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Somewhere Over The Rainbow',
    artist: 'Israel Kamakawiwoʻole',
    body: '[C]Somewhere [Em]over the rainbow\n[F]Way up [C]high\n[F]And the [C]dreams that you [Am]dream of\n[G]Once in a lulla[Am]by [F]'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset document title
    document.title = ''
    // Clear any existing meta tags
    const existingMeta = document.querySelector('meta[name="description"]')
    if (existingMeta) {
      existingMeta.remove()
    }
  })

  afterEach(() => {
    cleanup()
  })

  describe('Complete user journey from song list to song display', () => {
    it('should simulate navigation from song list to individual song page', async () => {
      const user = userEvent.setup()

      // Step 1: Simulate being on a song page (as if navigated from song list)
      const pageData = { song: mockSong }
      render(SongPage, { props: { data: pageData } })

      // Step 2: Verify song page content is displayed correctly
      expect(document.title).toBe('Somewhere Over The Rainbow - Ukulele Song Catalog')
      
      const backButton = screen.getByRole('button', { name: /back to songs/i })
      expect(backButton).toBeInTheDocument()

      // Step 3: Navigate back to song list
      await user.click(backButton)
      expect(goto).toHaveBeenCalledWith('/songs')
    })

    it('should handle keyboard navigation on song page', async () => {
      const user = userEvent.setup()

      // Step 1: Render song page (simulating navigation from song list)
      const pageData = { song: mockSong }
      render(SongPage, { props: { data: pageData } })

      // Step 2: Navigate back with keyboard
      const backButton = screen.getByRole('button', { name: /back to songs/i })
      
      await user.tab()
      expect(backButton).toHaveFocus()
      
      await user.keyboard('{Enter}')
      expect(goto).toHaveBeenCalledWith('/songs')
    })

    it('should maintain accessibility on song page', async () => {
      const user = userEvent.setup()

      // Step 1: Song page accessibility (simulating navigation from song list)
      const pageData = { song: mockSong }
      const { container } = render(SongPage, { props: { data: pageData } })

      // Verify semantic HTML structure
      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
      
      const backButton = screen.getByRole('button', { name: /back to songs/i })
      expect(backButton).toHaveAccessibleName()
      expect(backButton).toHaveClass('focus:ring-2')
      expect(backButton).toHaveClass('focus:ring-blue-500')

      // Verify meta information for screen readers
      expect(document.title).toBe('Somewhere Over The Rainbow - Ukulele Song Catalog')
      
      const metaDescription = document.querySelector('meta[name="description"]')
      expect(metaDescription?.getAttribute('content')).toBe(
        'Somewhere Over The Rainbow by Israel Kamakawiwoʻole - Ukulele chords and lyrics'
      )

      // Test navigation accessibility
      await user.click(backButton)
      expect(goto).toHaveBeenCalledWith('/songs')
    })

    it('should handle mobile-first responsive behavior on song page', async () => {
      const user = userEvent.setup()

      // Step 1: Song page mobile layout (simulating navigation from song list)
      const pageData = { song: mockSong }
      const { container } = render(SongPage, { props: { data: pageData } })

      // Verify mobile-first constraints in song page
      const pageMain = container.querySelector('main')
      expect(pageMain).toHaveClass('min-h-screen')
      expect(pageMain).toHaveClass('bg-gray-50')
      expect(pageMain).toHaveClass('py-4')
      expect(pageMain).toHaveClass('px-4')

      const pageContainer = container.querySelector('.max-w-md')
      expect(pageContainer).toBeInTheDocument()
      expect(pageContainer).toHaveClass('mx-auto')

      const backButton = screen.getByRole('button', { name: /back to songs/i })
      expect(backButton).toHaveClass('touch-manipulation')
      expect(backButton).toHaveClass('py-3')
      expect(backButton).toHaveClass('px-4')

      // Test navigation works on mobile
      await user.click(backButton)
      expect(goto).toHaveBeenCalledWith('/songs')
    })

    it('should handle error states gracefully in the user journey', async () => {
      const user = userEvent.setup()

      // Test song page with null data (simulating 404 scenario)
      const pageData = { song: null as any }
      
      // This would normally be handled by the server load function throwing a 404
      // but we can test the component's resilience to null data
      expect(() => {
        render(SongPage, { props: { data: pageData } })
      }).not.toThrow()

      // Should still render back button for navigation
      const backButton = screen.getByRole('button', { name: /back to songs/i })
      expect(backButton).toBeInTheDocument()
      
      await user.click(backButton)
      expect(goto).toHaveBeenCalledWith('/songs')
    })

    it('should maintain performance on song page', async () => {
      const user = userEvent.setup()

      // Step 1: Measure song page render performance
      const pageStartTime = performance.now()
      const pageData = { song: mockSong }
      render(SongPage, { props: { data: pageData } })
      const pageEndTime = performance.now()
      const pageRenderTime = pageEndTime - pageStartTime

      expect(pageRenderTime).toBeLessThan(100) // Should render quickly

      // Step 2: Measure navigation performance
      const navStartTime = performance.now()
      const backButton = screen.getByRole('button', { name: /back to songs/i })
      await user.click(backButton)
      const navEndTime = performance.now()
      const navTime = navEndTime - navStartTime

      expect(navTime).toBeLessThan(50) // Navigation should be instant
      expect(goto).toHaveBeenCalledWith('/songs')
    })

    it('should handle rapid navigation on song page without issues', async () => {
      const user = userEvent.setup()

      // Step 1: Rapid navigation on song page
      const pageData = { song: mockSong }
      render(SongPage, { props: { data: pageData } })

      const backButton = screen.getByRole('button', { name: /back to songs/i })
      
      // Rapid clicks on back button
      await user.click(backButton)
      await user.click(backButton)
      await user.click(backButton)

      // Should handle rapid clicks gracefully
      expect(goto).toHaveBeenCalledTimes(3)
      expect(goto).toHaveBeenCalledWith('/songs')
    })

    it('should support navigation flow simulation', async () => {
      const user = userEvent.setup()

      // Step 1: Song page (simulating navigation from song list)
      const pageData = { song: mockSong }
      render(SongPage, { props: { data: pageData } })

      // Verify we're on the song page
      expect(document.title).toBe('Somewhere Over The Rainbow - Ukulele Song Catalog')

      // Navigate back
      const backButton = screen.getByRole('button', { name: /back to songs/i })
      await user.click(backButton)
      expect(goto).toHaveBeenCalledWith('/songs')

      // This simulates the navigation flow that would happen in a real app
      // The actual routing would be handled by SvelteKit
    })
  })

  describe('Loading state behavior and performance', () => {
    it('should load song page efficiently without loading states', async () => {
      // Song page should load without loading state (data pre-loaded by server)
      const pageData = { song: mockSong }
      render(SongPage, { props: { data: pageData } })

      // Should immediately show content (no loading state needed)
      const backButton = screen.getByRole('button', { name: /back to songs/i })
      expect(backButton).toBeInTheDocument()
      expect(document.title).toBe('Somewhere Over The Rainbow - Ukulele Song Catalog')
    })

    it('should handle page transitions gracefully', async () => {
      // Song page should load immediately (server-side loaded)
      const pageData = { song: mockSong }
      render(SongPage, { props: { data: pageData } })

      expect(document.title).toBe('Somewhere Over The Rainbow - Ukulele Song Catalog')
      
      const backButton = screen.getByRole('button', { name: /back to songs/i })
      expect(backButton).toBeInTheDocument()
    })

    it('should optimize for mobile network conditions', async () => {
      const user = userEvent.setup()

      // Song page optimized for mobile
      const pageData = { song: mockSong }
      const { container } = render(SongPage, { props: { data: pageData } })

      // Verify mobile optimizations
      const backButton = screen.getByRole('button', { name: /back to songs/i })
      expect(backButton).toHaveClass('touch-manipulation')

      // Check for minimal DOM structure
      const pageElements = container.querySelectorAll('*')
      expect(pageElements.length).toBeLessThan(20) // Minimal DOM for performance

      // No external resources that could slow mobile loading
      expect(container.querySelectorAll('img, iframe, video')).toHaveLength(0)

      // Test navigation works efficiently
      await user.click(backButton)
      expect(goto).toHaveBeenCalledWith('/songs')
    })
  })
})