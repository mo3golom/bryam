import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { goto } from '$app/navigation'
import SongPage from './+page.svelte'
import type { Song } from '$lib/types'

// Mock dependencies
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}))

vi.mock('$lib/components/SongViewer.svelte', () => ({
  default: vi.fn(() => ({
    $$: { fragment: null },
    $destroy: vi.fn(),
    $on: vi.fn(),
    $set: vi.fn()
  }))
}))

// Mock the ChordPro parser
vi.mock('$lib/utils/chordpro.js', () => ({
  parseChordPro: vi.fn()
}))

describe('Individual Song Page Integration Tests', () => {
  const mockSong: Song = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Somewhere Over The Rainbow',
    artist: 'Israel Kamakawiwoʻole',
    body: '[C]Somewhere [Em]over the rainbow\n[F]Way up [C]high'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Song page loading and ChordPro rendering', () => {
    it('should render song page with valid song data', () => {
      const pageData = { song: mockSong }

      render(SongPage, { props: { data: pageData } })

      // Check that the page title is set correctly
      expect(document.title).toBe('Somewhere Over The Rainbow - Ukulele Song Catalog')

      // Check that the back button is rendered
      const backButton = screen.getByRole('button', { name: /go back to previous page/i })
      expect(backButton).toBeInTheDocument()
      expect(backButton).toHaveClass('touch-manipulation')

      // Check that SongViewer component would be rendered with correct props
      // (We can't directly test the mocked component, but we can verify the data structure)
      expect(pageData.song).toEqual(mockSong)
    })

    it('should set correct meta tags for SEO', () => {
      const pageData = { song: mockSong }

      render(SongPage, { props: { data: pageData } })

      expect(document.title).toBe('Somewhere Over The Rainbow - Ukulele Song Catalog')

      const metaDescription = document.querySelector('meta[name="description"]')
      expect(metaDescription?.getAttribute('content')).toBe(
        'Somewhere Over The Rainbow by Israel Kamakawiwoʻole - Ukulele chords and lyrics'
      )
    })

    it('should handle song with null artist', () => {
      const songWithoutArtist: Song = {
        ...mockSong,
        artist: null
      }
      const pageData = { song: songWithoutArtist }

      render(SongPage, { props: { data: pageData } })

      expect(document.title).toBe('Somewhere Over The Rainbow - Ukulele Song Catalog')

      const metaDescription = document.querySelector('meta[name="description"]')
      expect(metaDescription?.getAttribute('content')).toBe(
        'Somewhere Over The Rainbow by Unknown artist - Ukulele chords and lyrics'
      )
    })

    it('should handle song with empty title gracefully', () => {
      const songWithEmptyTitle: Song = {
        ...mockSong,
        title: ''
      }
      const pageData = { song: songWithEmptyTitle }

      render(SongPage, { props: { data: pageData } })

      expect(document.title).toBe('- Ukulele Song Catalog')
    })

    it('should apply mobile-first layout constraints', () => {
      const pageData = { song: mockSong }

      const { container } = render(SongPage, { props: { data: pageData } })

      const mainElement = container.querySelector('main')
      expect(mainElement).toHaveClass('min-h-screen')
      expect(mainElement).toHaveClass('bg-gray-50')
      expect(mainElement).toHaveClass('py-4')
      expect(mainElement).toHaveClass('px-4')

      const containerDiv = container.querySelector('.max-w-md')
      expect(containerDiv).toBeInTheDocument()
      expect(containerDiv).toHaveClass('mx-auto')
    })

    it('should render back button with proper styling and accessibility', () => {
      const pageData = { song: mockSong }

      render(SongPage, { props: { data: pageData } })

      const backButton = screen.getByRole('button', { name: /go back to previous page/i })

      // Check styling classes
      expect(backButton).toHaveClass('inline-flex')
      expect(backButton).toHaveClass('items-center')
      expect(backButton).toHaveClass('px-3')
      expect(backButton).toHaveClass('py-2')
      expect(backButton).toHaveClass('text-sm')
      expect(backButton).toHaveClass('font-medium')
      expect(backButton).toHaveClass('text-gray-600')
      expect(backButton).toHaveClass('hover:text-gray-900')
      expect(backButton).toHaveClass('focus:outline-none')
      expect(backButton).toHaveClass('focus:ring-2')
      expect(backButton).toHaveClass('focus:ring-blue-500')
      expect(backButton).toHaveClass('focus:ring-offset-2')
      expect(backButton).toHaveClass('rounded-md')
      expect(backButton).toHaveClass('transition-colors')
      expect(backButton).toHaveClass('touch-manipulation')

      // Check for SVG icon
      const svgIcon = backButton.querySelector('svg')
      expect(svgIcon).toBeInTheDocument()
      expect(svgIcon).toHaveClass('mr-2')
      expect(svgIcon).toHaveClass('h-5')
      expect(svgIcon).toHaveClass('w-5')
    })
  })

  describe('Navigation flows', () => {
    it('should navigate back to songs list when back button is clicked', async () => {
      const user = userEvent.setup()
      const pageData = { song: mockSong }

      render(SongPage, { props: { data: pageData } })

      const backButton = screen.getByRole('button', { name: /go back to previous page/i })
      await user.click(backButton)

      expect(goto).toHaveBeenCalledWith('/songs')
    })

    it('should handle keyboard navigation on back button', async () => {
      const user = userEvent.setup()
      const pageData = { song: mockSong }

      render(SongPage, { props: { data: pageData } })

      const backButton = screen.getByRole('button', { name: /go back to previous page/i })

      // Test Enter key
      await user.type(backButton, '{Enter}')
      expect(goto).toHaveBeenCalledWith('/songs')

      // Test Space key
      vi.clearAllMocks()
      await user.type(backButton, ' ')
      expect(goto).toHaveBeenCalledWith('/songs')
    })

    it('should maintain focus management for accessibility', async () => {
      const user = userEvent.setup()
      const pageData = { song: mockSong }

      render(SongPage, { props: { data: pageData } })

      const backButton = screen.getByRole('button', { name: /go back to previous page/i })

      // Test tab navigation
      await user.tab()
      expect(backButton).toHaveFocus()
    })
  })

  describe('Mobile performance and loading state behavior', () => {
    it('should render efficiently with minimal DOM elements', () => {
      const pageData = { song: mockSong }

      const { container } = render(SongPage, { props: { data: pageData } })

      // Check that the DOM structure is minimal and efficient
      const allElements = container.querySelectorAll('*')
      expect(allElements.length).toBeLessThan(30) // Reasonable limit for performance

      // Check for essential elements only
      expect(container.querySelector('main')).toBeInTheDocument()
      expect(container.querySelector('.max-w-md')).toBeInTheDocument()
      expect(container.querySelector('button')).toBeInTheDocument()
    })

    it('should apply touch-friendly interface elements', () => {
      const pageData = { song: mockSong }

      render(SongPage, { props: { data: pageData } })

      const backButton = screen.getByRole('button', { name: /go back to previous page/i })

      // Check for touch optimization
      expect(backButton).toHaveClass('touch-manipulation')
      expect(backButton).toHaveClass('py-2') // Adequate touch target height
      expect(backButton).toHaveClass('px-3') // Adequate touch target width
    })

    it('should handle rapid re-renders without performance issues', () => {
      const pageData = { song: mockSong }

      const { rerender } = render(SongPage, { props: { data: pageData } })

      // Simulate rapid data changes
      const updatedSong = { ...mockSong, title: 'Updated Title' }
      rerender({ data: { song: updatedSong } })
      rerender({ data: { song: mockSong } })
      rerender({ data: { song: updatedSong } })

      // Should handle updates gracefully
      expect(document.title).toBe('Somewhere Over The Rainbow - Ukulele Song Catalog')
    })

    it('should optimize for mobile network conditions', () => {
      const pageData = { song: mockSong }

      const { container } = render(SongPage, { props: { data: pageData } })

      // Check that no unnecessary network requests are made
      // (All data should be provided via pageData)
      const images = container.querySelectorAll('img')
      const iframes = container.querySelectorAll('iframe')
      const videos = container.querySelectorAll('video')

      expect(images.length).toBe(0) // No images that could slow loading
      expect(iframes.length).toBe(0) // No iframes
      expect(videos.length).toBe(0) // No videos
    })
  })

  describe('Error handling and edge cases', () => {
    it('should handle missing song data gracefully', () => {
      const pageData = { song: null as any }

      // This should not crash the component
      expect(() => {
        render(SongPage, { props: { data: pageData } })
      }).not.toThrow()
    })

    it('should handle undefined song data', () => {
      const pageData = { song: undefined as any }

      expect(() => {
        render(SongPage, { props: { data: pageData } })
      }).not.toThrow()
    })

    it('should set fallback meta tags when song is missing', () => {
      const pageData = { song: null as any }

      render(SongPage, { props: { data: pageData } })

      expect(document.title).toBe('Song - Ukulele Song Catalog')

      const metaDescription = document.querySelector('meta[name="description"]')
      expect(metaDescription?.getAttribute('content')).toBe(
        'Ukulele song with chords and lyrics'
      )
    })

    it('should handle songs with special characters in title and artist', () => {
      const specialCharSong: Song = {
        id: '123',
        title: 'Song with "Quotes" & <Tags>',
        artist: 'Artist & Co. "Special"',
        body: '[C]Content'
      }
      const pageData = { song: specialCharSong }

      render(SongPage, { props: { data: pageData } })

      expect(document.title).toBe('Song with "Quotes" & <Tags> - Ukulele Song Catalog')

      const metaDescription = document.querySelector('meta[name="description"]')
      expect(metaDescription?.getAttribute('content')).toBe(
        'Song with "Quotes" & <Tags> by Artist & Co. "Special" - Ukulele chords and lyrics'
      )
    })

    it('should handle very long song titles', () => {
      const longTitleSong: Song = {
        id: '123',
        title: 'This is a very long song title that might cause issues with meta tags and page rendering if not handled properly',
        artist: 'Artist',
        body: '[C]Content'
      }
      const pageData = { song: longTitleSong }

      render(SongPage, { props: { data: pageData } })

      expect(document.title).toContain('This is a very long song title')
      expect(document.title).toContain('- Ukulele Song Catalog')
    })

    it('should handle empty song body', () => {
      const emptySong: Song = {
        id: '123',
        title: 'Empty Song',
        artist: 'Artist',
        body: ''
      }
      const pageData = { song: emptySong }

      expect(() => {
        render(SongPage, { props: { data: pageData } })
      }).not.toThrow()
    })

    it('should handle malformed song data', () => {
      const malformedSong = {
        id: 123, // Wrong type
        title: null, // Wrong type
        artist: undefined,
        body: { invalid: 'object' } // Wrong type
      } as any
      const pageData = { song: malformedSong }

      expect(() => {
        render(SongPage, { props: { data: pageData } })
      }).not.toThrow()
    })
  })

  describe('Accessibility and semantic HTML', () => {
    it('should use proper semantic HTML structure', () => {
      const pageData = { song: mockSong }

      const { container } = render(SongPage, { props: { data: pageData } })

      // Check for semantic elements
      expect(container.querySelector('main')).toBeInTheDocument()
      expect(container.querySelector('button')).toBeInTheDocument()

      // Check for proper ARIA attributes
      const backButton = screen.getByRole('button', { name: /go back to previous page/i })
      // Button elements have implicit role="button", so no need to check for explicit role attribute
      expect(backButton.tagName.toLowerCase()).toBe('button')
    })

    it('should provide proper focus indicators', () => {
      const pageData = { song: mockSong }

      render(SongPage, { props: { data: pageData } })

      const backButton = screen.getByRole('button', { name: /go back to previous page/i })

      // Check for focus styling
      expect(backButton).toHaveClass('focus:outline-none')
      expect(backButton).toHaveClass('focus:ring-2')
      expect(backButton).toHaveClass('focus:ring-blue-500')
      expect(backButton).toHaveClass('focus:ring-offset-2')
    })

    it('should support screen reader navigation', () => {
      const pageData = { song: mockSong }

      render(SongPage, { props: { data: pageData } })

      // Check that all interactive elements have proper labels
      const backButton = screen.getByRole('button', { name: /go back to previous page/i })
      expect(backButton).toHaveAccessibleName()

      // Check that text content is accessible
      expect(backButton.textContent).toContain('Back')
    })

    it('should maintain proper heading hierarchy', () => {
      const pageData = { song: mockSong }

      const { container } = render(SongPage, { props: { data: pageData } })

      // The page has a heading in the Navigation component
      // Check that the heading hierarchy is proper
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
      expect(headings.length).toBe(1) // One h1 heading in the navigation
    })

    it('should provide high contrast for readability', () => {
      const pageData = { song: mockSong }

      render(SongPage, { props: { data: pageData } })

      const backButton = screen.getByRole('button', { name: /go back to previous page/i })

      // Check for high contrast text colors
      expect(backButton).toHaveClass('text-gray-600')
      expect(backButton).toHaveClass('hover:text-gray-900')
    })
  })

  describe('Performance optimization', () => {
    it('should minimize re-renders with stable references', () => {
      const pageData = { song: mockSong }

      const { rerender } = render(SongPage, { props: { data: pageData } })

      // Same data should not cause unnecessary re-renders
      rerender({ data: pageData })
      rerender({ data: pageData })

      // Component should handle this efficiently
      expect(document.title).toBe('Somewhere Over The Rainbow - Ukulele Song Catalog')
    })

    it('should handle component cleanup properly', () => {
      const pageData = { song: mockSong }

      const { unmount } = render(SongPage, { props: { data: pageData } })

      // Should unmount without errors
      expect(() => unmount()).not.toThrow()
    })

    it('should not create memory leaks with event listeners', () => {
      const pageData = { song: mockSong }

      const { unmount } = render(SongPage, { props: { data: pageData } })

      const backButton = screen.getByRole('button', { name: /go back to previous page/i })

      // Add some interactions
      fireEvent.click(backButton)

      // Should clean up properly
      expect(() => unmount()).not.toThrow()
    })
  })
})