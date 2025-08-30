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
    // Reset mock implementation to default behavior
    mockParseChordPro.mockImplementation((text: string) => ({
      lines: []
    }))
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
              { chord: 'C', chordPosition: 0, word: 'Hello' },
              { chord: null, chordPosition: null, word: ' ' },
              { chord: 'G', chordPosition: 1, word: 'world' }
            ]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      const heading = target.querySelector('#song-title')
      expect(heading).toBeTruthy()
      expect(heading?.textContent).toBe('Test Song')
      
      const artistElement = target.querySelector('#song-artist')
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
              { chord: 'Am', chordPosition: 0, word: 'Simple' },
              { chord: null, chordPosition: null, word: ' song' }
            ]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      const heading = target.querySelector('#song-title')
      expect(heading?.textContent).toBe('Solo Song')
      
      // Should not have artist paragraph when artist is null
      const artistElement = target.querySelector('#song-artist')
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
              { chord: 'C', chordPosition: 0, word: 'Hello' },
              { chord: null, chordPosition: null, word: ' ' },
              { chord: 'G', chordPosition: 1, word: 'world' }
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
              { chord: 'C unclosed bracket and weird content', chordPosition: 0, word: '' }
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
            parts: [{ chord: 'Am', chordPosition: 0, word: 'Styled' }]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      const chordElement = target.querySelector('.chord')
      expect(chordElement?.textContent).toBe('Am')
    })

    it('should maintain chord-to-lyric alignment with multiple chords per line', () => {
      const songData: Song = {
        id: '1',
        title: 'Multi-chord Song',
        artist: 'Artist',
        body: '[C]Some[G]where [Am]over the [F]rainbow'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [
              { chord: 'C', chordPosition: 0, word: 'Some' },
              { chord: 'G', chordPosition: 1, word: 'where' },
              { chord: null, chordPosition: null, word: ' over the ' },
              { chord: 'Am', chordPosition: 2, word: 'rainbow' },
              { chord: null, chordPosition: null, word: ' ' },
              { chord: 'F', chordPosition: 3, word: 'way up high' }
            ]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      const chordWordPairs = target.querySelectorAll('.chord-word-pair')
      expect(chordWordPairs).toHaveLength(6)

      // Verify chord alignment structure
      const firstPair = chordWordPairs[0]
      const chordElement = firstPair.querySelector('.chord')
      const wordElement = firstPair.querySelector('.word')
      
      expect(chordElement?.textContent).toBe('C')
      expect(wordElement?.textContent).toBe('Some')
    })

    it('should handle empty lines for proper song spacing', () => {
      const songData: Song = {
        id: '1',
        title: 'Spaced Song',
        artist: 'Artist',
        body: '[C]First line\n\n[G]Second line'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [{ chord: 'C', chordPosition: 0, word: 'First line' }]
          },
          {
            parts: [{ chord: null, chordPosition: null, word: '' }]
          },
          {
            parts: [{ chord: 'G', chordPosition: 0, word: 'Second line' }]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      const lineContainers = target.querySelectorAll('.line-container')
      expect(lineContainers).toHaveLength(3)

      // Check for empty line spacing
      const emptyLineSpacing = target.querySelector('.h-4')
      expect(emptyLineSpacing).toBeTruthy()
    })

    it('should apply touch-friendly styling for mobile devices', () => {
      const songData: Song = {
        id: '1',
        title: 'Touch Song',
        artist: 'Artist',
        body: '[C]Touch friendly'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [{ chord: 'C', chordPosition: 0, word: 'Touch friendly' }]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      const lineContainer = target.querySelector('.line-container')
      expect(lineContainer).toBeTruthy()
      
      // Verify touch-action is set for mobile optimization
      const computedStyle = window.getComputedStyle(lineContainer!)
      expect(lineContainer?.className).toContain('line-container')
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
            parts: [{ chord: 'C', chordPosition: 0, word: 'Accessible content' }]
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

      // Check for section element (song content)
      const section = target.querySelector('section')
      expect(section).toBeTruthy()
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
              { chord: 'C', chordPosition: 0, word: 'Hello' },
              { chord: null, chordPosition: null, word: ' ' },
              { chord: 'G', chordPosition: 1, word: 'world' }
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

    it('should have proper heading hierarchy for screen readers', () => {
      const songData: Song = {
        id: '1',
        title: 'Hierarchy Song',
        artist: 'Artist',
        body: '[C]Content'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [{ chord: 'C', chordPosition:0,  word: 'Content' }]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      // Should have exactly one h1 element
      const h1Elements = target.querySelectorAll('h1')
      expect(h1Elements).toHaveLength(1)
      
      // Should not have any other heading levels (h2, h3, etc.)
      const otherHeadings = target.querySelectorAll('h2, h3, h4, h5, h6')
      expect(otherHeadings).toHaveLength(0)
    })

    it('should support screen reader navigation with proper text structure', () => {
      const songData: Song = {
        id: '1',
        title: 'Navigation Song',
        artist: 'Navigation Artist',
        body: '[C]First [G]line\n[Am]Second [F]line'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [
              { chord: 'C', chordPosition: 0, word: 'First' },
              { chord: null, chordPosition: null, word: ' ' },
              { chord: 'G', chordPosition: 1, word: 'line' }
            ]
          },
          {
            parts: [
              { chord: 'Am', chordPosition: 0, word: 'Second' },
              { chord: null, chordPosition: null, word: ' ' },
              { chord: 'F', chordPosition: 1, word: 'line' }
            ]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      // Verify all text content is present and accessible
      const allText = target.textContent || ''
      expect(allText).toContain('Navigation Song')
      expect(allText).toContain('Navigation Artist')
      expect(allText).toContain('C')
      expect(allText).toContain('First')
      expect(allText).toContain('G')
      expect(allText).toContain('line')
      expect(allText).toContain('Am')
      expect(allText).toContain('Second')
      expect(allText).toContain('F')

      // Verify proper document structure for screen readers
      const header = target.querySelector('header')
      const section = target.querySelector('section')
      expect(header).toBeTruthy()
      expect(section).toBeTruthy()
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
            parts: [{ chord: 'C', chordPosition: 0, word: 'Content' }]
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
            parts: [{ chord: 'C', chordPosition: 0,  word: 'Content' }]
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

      // Component should not crash when parser throws, but should show error state
      component = mount(SongViewer, { target, props: { songData } })
      flushSync()
      
      expect(target.textContent).toContain('Unable to parse song content')
      expect(target.textContent).toContain('[C]Content') // Should show raw content
    })

    it('should handle whitespace-only song body', () => {
      // Reset mock to normal behavior for this test
      mockParseChordPro.mockReturnValue({
        lines: []
      })

      const songData: Song = {
        id: '1',
        title: 'Whitespace Song',
        artist: 'Artist',
        body: '   \n\t  \n   '
      }

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      expect(target.textContent).toContain('No content available for this song.')
      expect(mockParseChordPro).toHaveBeenCalledWith('   \n\t  \n   ')
    })

    it('should handle null body gracefully', () => {
      // Reset mock to normal behavior for this test
      mockParseChordPro.mockReturnValue({
        lines: []
      })

      const songData: Song = {
        id: '1',
        title: 'Null Body Song',
        artist: 'Artist',
        body: null as any // Simulating potential null value
      }

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      expect(target.textContent).toContain('No content available for this song.')
    })

    it('should handle undefined artist gracefully', () => {
      const songData: Song = {
        id: '1',
        title: 'Undefined Artist Song',
        artist: undefined as any,
        body: '[C]Content'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [{ chord: 'C', chordPosition:0, word: 'Content' }]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      const heading = target.querySelector('#song-title')
      expect(heading?.textContent).toBe('Undefined Artist Song')
      
      // Should not display artist section when undefined
      const artistElement = target.querySelector('#song-artist')
      expect(artistElement).toBeFalsy()
    })

    it('should handle empty string artist', () => {
      const songData: Song = {
        id: '1',
        title: 'Empty Artist Song',
        artist: '',
        body: '[C]Content'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [{ chord: 'C', chordPosition: 0, word: 'Content' }]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      const heading = target.querySelector('#song-title')
      expect(heading?.textContent).toBe('Empty Artist Song')
      
      // Should NOT display artist section when empty string (falsy in Svelte)
      const artistElement = target.querySelector('#song-artist')
      expect(artistElement).toBeFalsy()
    })

    it('should handle complex chord progressions with many chords per line', () => {
      const songData: Song = {
        id: '1',
        title: 'Complex Chords',
        artist: 'Artist',
        body: '[C][G][Am][F][C][G][F][C]'
      }

      mockParseChordPro.mockReturnValue({
        lines: [
          {
            parts: [
              { chord: 'C', chordPosition: 0, word: '' },
              { chord: 'G', chordPosition: 1, word: '' },
              { chord: 'Am', chordPosition: 2, word: '' },
              { chord: 'F', chordPosition: 3, word: '' },
              { chord: 'C', chordPosition: 4, word: '' },
              { chord: 'G', chordPosition: 5, word: '' },
              { chord: 'F', chordPosition: 6, word: '' },
              { chord: 'C', chordPosition: 7, word: '' }
            ]
          }
        ]
      })

      component = mount(SongViewer, { target, props: { songData } })
      flushSync()

      const chordElements = target.querySelectorAll('.chord')
      expect(chordElements).toHaveLength(8)
      
      const chordTexts = Array.from(chordElements).map(el => el.textContent)
      expect(chordTexts).toEqual(['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'])
    })
  })
})