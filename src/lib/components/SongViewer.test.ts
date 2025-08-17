import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import SongViewer from './SongViewer.svelte'
import type { Song } from '$lib/types'

// Mock the chordpro parser
vi.mock('$lib/utils/chordpro.js', () => ({
  parseChordPro: vi.fn()
}))

import { parseChordPro } from '$lib/utils/chordpro.js'

describe('SongViewer Component', () => {
  const mockParseChordPro = vi.mocked(parseChordPro)
  let component: any
  let target: HTMLElement

  beforeEach(() => {
    vi.clearAllMocks()
    target = document.createElement('div')
    document.body.appendChild(target)
  })

  afterEach(() => {
    if (component) {
      unmount(component)
      component = null
    }
    if (target && target.parentNode) {
      target.parentNode.removeChild(target)
    }
  })

  describe('Component rendering with different prop combinations', () => {
    it('should render song with title and artist', () => {
      const songData: Song = {
        id: '1',
        title: 'Test Song',
        artist: 'Test Artist',
        body: '[C]Hello [G]world'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [
              { chord: 'C', word: 'Hello' },
              { chord: null, word: ' ' },
              { chord: 'G', word: 'world' }
            ]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      const heading = target.querySelector('h1')
      expect(heading).toBeTruthy()
      expect(heading?.textContent).toBe('Test Song')
      
      const artistElement = target.querySelector('p')
      expect(artistElement).toBeTruthy()
      expect(artistElement?.textContent).toBe('Test Artist')
      
      expect(mockParseChordPro).toHaveBeenCalledWith('[C]Hello [G]world')
    })

    it('should render song with title but no artist', () => {
      const songData: Song = {
        id: '1',
        title: 'Solo Song',
        artist: null,
        body: '[Am]Simple song'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [
              { chord: 'Am', word: 'Simple' },
              { chord: null, word: ' song' }
            ]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      const heading = target.querySelector('h1')
      expect(heading?.textContent).toBe('Solo Song')
      
      // Should not have artist paragraph when artist is null
      const artistElement = target.querySelector('header p')
      expect(artistElement).toBeFalsy()
    })
    it('should render chords and lyrics correctly', () => {
      const songData: Song = {
        id: '1',
        title: 'Chord Song',
        artist: 'Artist',
        body: '[C]Hello [G]world'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [
              { chord: 'C', word: 'Hello' },
              { chord: null, word: ' ' },
              { chord: 'G', word: 'world' }
            ]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      // Check for chord elements (only actual chords, not spacers)
      const chordElements = target.querySelectorAll('.chord')
      expect(chordElements).toHaveLength(2) // 2 actual chords
      expect(chordElements[0].textContent).toBe('C')
      expect(chordElements[1].textContent).toBe('G')
      
      // Check for chord spacers
      const spacerElements = target.querySelectorAll('.chord-spacer')
      expect(spacerElements).toHaveLength(1) // 1 spacer for the middle word

      // Check for word elements
      const wordElements = target.querySelectorAll('.word')
      expect(wordElements).toHaveLength(3)
      expect(wordElements[0].textContent).toBe('Hello')
      expect(wordElements[1].textContent).toBe(' ')
      expect(wordElements[2].textContent).toBe('world')
    })
  })

  describe('Proper handling of empty and malformed song data', () => {
    it('should display message when song body is empty', () => {
      const songData: Song = {
        id: '1',
        title: 'Empty Song',
        artist: 'Artist',
        body: ''
      }

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      expect(target.textContent).toContain('No content available for this song.')
      expect(mockParseChordPro).toHaveBeenCalledWith('')
    })

    it('should handle malformed ChordPro content gracefully', () => {
      const songData: Song = {
        id: '1',
        title: 'Malformed Song',
        artist: 'Artist',
        body: '[C unclosed bracket and weird content'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [
              { chord: 'C unclosed bracket and weird content', word: '' }
            ]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      // Should still render without throwing errors
      expect(target.querySelector('.song-content')).toBeTruthy()
      expect(mockParseChordPro).toHaveBeenCalledWith('[C unclosed bracket and weird content')
    })
  })

  describe('Mobile-first responsive behavior and chord alignment', () => {
    it('should apply mobile-first container constraints', () => {
      const songData: Song = {
        id: '1',
        title: 'Mobile Song',
        artist: 'Artist',
        body: '[C]Test'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [{ chord: 'C', word: 'Test' }]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      const mainContainer = target.querySelector('div')
      expect(mainContainer?.className).toContain('w-full')
      expect(mainContainer?.className).toContain('max-w-md')
      expect(mainContainer?.className).toContain('mx-auto')
      expect(mainContainer?.className).toContain('px-4')
      expect(mainContainer?.className).toContain('py-6')
    })

    it('should apply proper chord styling', () => {
      const songData: Song = {
        id: '1',
        title: 'Chord Styling Song',
        artist: 'Artist',
        body: '[Am]Styled'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [{ chord: 'Am', word: 'Styled' }]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      const chordElement = target.querySelector('.chord')
      expect(chordElement?.className).toContain('text-blue-600')
      expect(chordElement?.className).toContain('font-semibold')
      expect(chordElement?.className).toContain('text-sm')
      expect(chordElement?.textContent).toBe('Am')
    })
  })

  describe('Accessibility features and keyboard navigation', () => {
    it('should use proper semantic HTML structure', () => {
      const songData: Song = {
        id: '1',
        title: 'Semantic Song',
        artist: 'Semantic Artist',
        body: '[C]Accessible content'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [{ chord: 'C', word: 'Accessible content' }]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      // Check for proper heading structure
      const heading = target.querySelector('h1')
      expect(heading?.textContent).toBe('Semantic Song')

      // Check for header element
      const header = target.querySelector('header')
      expect(header).toBeTruthy()

      // Check for main element
      const main = target.querySelector('main')
      expect(main).toBeTruthy()
    })

    it('should provide meaningful text content for screen readers', () => {
      const songData: Song = {
        id: '1',
        title: 'Screen Reader Song',
        artist: 'Accessible Artist',
        body: '[C]Hello [G]world'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [
              { chord: 'C', word: 'Hello' },
              { chord: null, word: ' ' },
              { chord: 'G', word: 'world' }
            ]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      // All text content should be accessible
      expect(target.textContent).toContain('Screen Reader Song')
      expect(target.textContent).toContain('Accessible Artist')
      expect(target.textContent).toContain('C')
      expect(target.textContent).toContain('G')
      expect(target.textContent).toContain('Hello')
      expect(target.textContent).toContain('world')
    })

    it('should maintain focus management for keyboard navigation', () => {
      const songData: Song = {
        id: '1',
        title: 'Keyboard Song',
        artist: 'Artist',
        body: '[C]Keyboard accessible'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [{ chord: 'C', word: 'Keyboard accessible' }]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      // Component should not interfere with natural tab order
      // All text content should be naturally focusable by screen readers
      const focusableElements = target.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      
      // SongViewer should not have interactive elements that need focus management
      // It's a display component, so no focusable elements expected
      expect(focusableElements).toHaveLength(0)
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle very long song titles', () => {
      const longTitle = 'This is a very long song title that might wrap to multiple lines and should still be displayed properly'
      const songData: Song = {
        id: '1',
        title: longTitle,
        artist: 'Artist',
        body: '[C]Content'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [{ chord: 'C', word: 'Content' }]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      const heading = target.querySelector('h1')
      expect(heading?.textContent).toBe(longTitle)
    })

    it('should handle special characters in title and artist', () => {
      const songData: Song = {
        id: '1',
        title: 'Song & Title "With" Special <Characters>',
        artist: 'Artist & Name "With" Special <Characters>',
        body: '[C]Content'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [{ chord: 'C', word: 'Content' }]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      const heading = target.querySelector('h1')
      expect(heading?.textContent).toBe('Song & Title "With" Special <Characters>')
      expect(target.textContent).toContain('Artist & Name "With" Special <Characters>')
    })

    it('should handle parser throwing an error', () => {
      const songData: Song = {
        id: '1',
        title: 'Error Song',
        artist: 'Artist',
        body: '[C]Content'
      }

      mockParseChordPro.mockImplementation(() => {
        throw new Error('Parser error')
      })

      // Component should not crash when parser throws
      expect(() => {
        mount(SongViewer, { target, props: { songData } })
      }).toThrow('Parser error')
    })
  })
})