import { describe, it, expect } from 'vitest'
import { parseChordPro } from './chordpro'
import type { ParsedSong, ParsedLine, ChordLyricPair } from './chordpro'

describe('ChordPro Parser', () => {
  describe('Basic chord pattern recognition', () => {
    it('should parse simple chord and lyric combinations', () => {
      const input = '[C]Hello [G]world'
      const result = parseChordPro(input)
      
      expect(result.lines).toHaveLength(1)
  expect(result.lines[0].parts).toEqual([
        { chord: 'C', word: 'Hello' },
        { chord: null, word: ' ' },
        { chord: 'G', word: 'world' }
      ])
  expect(result.lines[0].metadata?.chordCount).toBe(2)
    })

    it('should handle chords at the beginning of words', () => {
      const input = '[Am]Amazing [F]grace'
      const result = parseChordPro(input)
      
      expect(result.lines[0].parts).toEqual([
        { chord: 'Am', word: 'Amazing' },
        { chord: null, word: ' ' },
        { chord: 'F', word: 'grace' }
      ])
  expect(result.lines[0].metadata?.chordCount).toBe(2)
    })

    it('should handle chords in the middle of words', () => {
      const input = 'Some[C]where over the [G]rainbow'
      const result = parseChordPro(input)
      
      expect(result.lines[0].parts).toEqual([
        { chord: null, word: 'Some' },
        { chord: 'C', word: 'where' },
        { chord: null, word: ' over the ' },
        { chord: 'G', word: 'rainbow' }
      ])
  expect(result.lines[0].metadata?.chordCount).toBe(2)
    })

    it('should handle multiple chords on the same word', () => {
      const input = '[C][G]word'
      const result = parseChordPro(input)
      
      expect(result.lines[0].parts).toEqual([
        { chord: 'C', word: '[G]word' },
        { chord: 'G', word: 'word' }
      ])
  // In this case parser treats the first part as a chord with the following text
  expect(result.lines[0].metadata?.chordCount).toBe(2)
    })
  })

  describe('Chord variations support', () => {
    it('should support major chords', () => {
      const input = '[C] [D] [E] [F] [G] [A] [B]'
      const result = parseChordPro(input)
      
      const chords = result.lines[0].parts.filter(part => part.chord).map(part => part.chord)
      expect(chords).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
    })

    it('should support minor chords', () => {
      const input = '[Am] [Dm] [Em] [Fm] [Gm] [Bm]'
      const result = parseChordPro(input)
      
      const chords = result.lines[0].parts.filter(part => part.chord).map(part => part.chord)
      expect(chords).toEqual(['Am', 'Dm', 'Em', 'Fm', 'Gm', 'Bm'])
    })

    it('should support diminished chords', () => {
      const input = '[Cdim] [F#dim] [Bdim]'
      const result = parseChordPro(input)
      
      const chords = result.lines[0].parts.filter(part => part.chord).map(part => part.chord)
      expect(chords).toEqual(['Cdim', 'F#dim', 'Bdim'])
    })

    it('should support augmented chords', () => {
      const input = '[Caug] [F#aug] [Baug]'
      const result = parseChordPro(input)
      
      const chords = result.lines[0].parts.filter(part => part.chord).map(part => part.chord)
      expect(chords).toEqual(['Caug', 'F#aug', 'Baug'])
    })

    it('should support suspended chords', () => {
      const input = '[Csus2] [Dsus4] [Gsus] [Asus2] [Fsus4]'
      const result = parseChordPro(input)
      
      const chords = result.lines[0].parts.filter(part => part.chord).map(part => part.chord)
      expect(chords).toEqual(['Csus2', 'Dsus4', 'Gsus', 'Asus2', 'Fsus4'])
    })

    it('should support complex chord variations', () => {
      const input = '[C7] [Am7] [F#m7b5] [Gmaj7] [Dm9] [C/E]'
      const result = parseChordPro(input)
      
      const chords = result.lines[0].parts.filter(part => part.chord).map(part => part.chord)
      expect(chords).toEqual(['C7', 'Am7', 'F#m7b5', 'Gmaj7', 'Dm9', 'C/E'])
    })

    it('should support sharp and flat chords', () => {
      const input = '[F#] [Bb] [C#m] [Ebmaj7] [Ab] [Db]'
      const result = parseChordPro(input)
      
      const chords = result.lines[0].parts.filter(part => part.chord).map(part => part.chord)
      expect(chords).toEqual(['F#', 'Bb', 'C#m', 'Ebmaj7', 'Ab', 'Db'])
    })
  })

  describe('Lyrics without chords', () => {
    it('should handle lines with no chords as plain lyrics', () => {
      const input = 'This is just a line of lyrics'
      const result = parseChordPro(input)
      
      expect(result.lines).toHaveLength(1)
      expect(result.lines[0].parts).toEqual([
        { chord: null, word: 'This is just a line of lyrics' }
      ])
    })

    it('should handle empty input', () => {
      const input = ''
      const result = parseChordPro(input)
      
      expect(result.lines).toHaveLength(0)
    })

    it('should handle single empty line', () => {
      const input = '\n'
      const result = parseChordPro(input)
      
      expect(result.lines).toHaveLength(2)
      expect(result.lines[0].parts).toEqual([{ chord: null, word: '' }])
      expect(result.lines[1].parts).toEqual([{ chord: null, word: '' }])
    })

    it('should handle whitespace-only lines', () => {
      const input = '   \t  '
      const result = parseChordPro(input)
      
      expect(result.lines).toHaveLength(1)
      expect(result.lines[0].parts).toEqual([
        { chord: null, word: '' }
      ])
    })
  })

  describe('Multi-line content', () => {
    it('should parse multiple lines correctly', () => {
      const input = `[C]Somewhere [Em]over the rainbow
[F]Way up [C]high
And the dreams that you dream of
[G]Once in a lulla[Am]by`
      
      const result = parseChordPro(input)
      
      expect(result.lines).toHaveLength(4)
      
      // First line
      expect(result.lines[0].parts).toEqual([
        { chord: 'C', word: 'Somewhere' },
        { chord: null, word: ' ' },
        { chord: 'Em', word: 'over' },
        { chord: null, word: ' the rainbow' }
      ])
      
      // Second line
      expect(result.lines[1].parts).toEqual([
        { chord: 'F', word: 'Way' },
        { chord: null, word: ' up ' },
        { chord: 'C', word: 'high' }
      ])
      
      // Third line (no chords)
      expect(result.lines[2].parts).toEqual([
        { chord: null, word: 'And the dreams that you dream of' }
      ])
      
      // Fourth line
      expect(result.lines[3].parts).toEqual([
        { chord: 'G', word: 'Once' },
        { chord: null, word: ' in a lulla' },
        { chord: 'Am', word: 'by' }
      ])
    })

    it('should handle lines with only chords', () => {
      const input = `[C] [G] [Am] [F]
Lyrics on the next line`
      
      const result = parseChordPro(input)
      
      expect(result.lines).toHaveLength(2)
      expect(result.lines[0].parts).toEqual([
        { chord: 'C', word: '' },
        { chord: null, word: ' ' },
        { chord: 'G', word: '' },
        { chord: null, word: ' ' },
        { chord: 'Am', word: '' },
        { chord: null, word: ' ' },
        { chord: 'F', word: '' }
      ])
    })
  })

  describe('Malformed content handling', () => {
    it('should handle unclosed brackets gracefully', () => {
      const input = '[C Hello [G]world'
      const result = parseChordPro(input)
      
      expect(result.lines[0].parts).toEqual([
        { chord: 'C Hello [G', word: 'world' }
      ])
    })

    it('should handle empty brackets', () => {
      const input = '[] Hello [G]world []'
      const result = parseChordPro(input)
      
      expect(result.lines[0].parts).toEqual([
        { chord: null, word: '[] Hello ' },
        { chord: 'G', word: 'world' },
        { chord: null, word: ' []' }
      ])
    })

    it('should handle brackets with only whitespace', () => {
      const input = '[  ] Hello [G]world'
      const result = parseChordPro(input)
      
      expect(result.lines[0].parts).toEqual([
        { chord: null, word: '[  ] Hello ' },
        { chord: 'G', word: 'world' }
      ])
    })

    it('should handle nested brackets', () => {
      const input = '[[C]] Hello [G[Am]]world'
      const result = parseChordPro(input)
      
      expect(result.lines[0].parts).toEqual([
        { chord: '[C', word: ']' },
        { chord: null, word: ' Hello ' },
        { chord: 'G[Am', word: ']world' }
      ])
    })

    it('should handle special characters in text', () => {
      const input = '[C]Hello & [G]world! @#$%^&*()'
      const result = parseChordPro(input)
      
      expect(result.lines[0].parts).toEqual([
        { chord: 'C', word: 'Hello' },
        { chord: null, word: ' & ' },
        { chord: 'G', word: 'world!' },
        { chord: null, word: ' @#$%^&*()' }
      ])
    })

    it('should handle null input', () => {
      const result = parseChordPro(null as any)
      expect(result.lines).toEqual([])
    })

    it('should handle undefined input', () => {
      const result = parseChordPro(undefined as any)
      expect(result.lines).toEqual([])
    })

    it('should handle non-string input', () => {
      const result = parseChordPro(123 as any)
      expect(result.lines).toEqual([])
    })
  })

  describe('Edge cases and performance', () => {
    it('should handle very long lines', () => {
      const longLyrics = 'This is a very long line of lyrics that goes on and on and on '.repeat(10)
      const input = `[C]${longLyrics}[G]end`
      const result = parseChordPro(input)
      
      expect(result.lines).toHaveLength(1)
      expect(result.lines[0].parts).toHaveLength(3)
      expect(result.lines[0].parts[0].chord).toBe('C')
      expect(result.lines[0].parts[2].chord).toBe('G')
    })

    it('should handle many chords in one line', () => {
      const manyChords = Array.from({ length: 50 }, (_, i) => `[C${i}]word${i}`).join(' ')
      const result = parseChordPro(manyChords)
      
      expect(result.lines).toHaveLength(1)
      expect(result.lines[0].parts.filter(part => part.chord)).toHaveLength(50)
    })

    it('should handle large song content efficiently', () => {
      const largeSong = Array.from({ length: 100 }, (_, i) => 
        `[C]Line ${i} with [G]chords and [Am]lyrics [F]here`
      ).join('\n')
      
      const startTime = performance.now()
      const result = parseChordPro(largeSong)
      const endTime = performance.now()
      
      expect(result.lines).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(100) // Should complete in less than 100ms
    })

    it('should handle consecutive spaces correctly', () => {
      const input = '[C]Hello     [G]world'
      const result = parseChordPro(input)
      
      expect(result.lines[0].parts).toEqual([
        { chord: 'C', word: 'Hello' },
        { chord: null, word: '     ' },
        { chord: 'G', word: 'world' }
      ])
    })

    it('should handle tabs and other whitespace', () => {
      const input = '[C]Hello\t[G]world\n'
      const result = parseChordPro(input)
      
      expect(result.lines).toHaveLength(2)
      expect(result.lines[0].parts).toEqual([
        { chord: 'C', word: 'Hello' },
        { chord: null, word: '\t' },
        { chord: 'G', word: 'world' }
      ])
    })

    it('should preserve exact spacing for chord alignment', () => {
      const input = '[C]  [G]  [Am]  [F]'
      const result = parseChordPro(input)
      
      expect(result.lines[0].parts).toEqual([
        { chord: 'C', word: '' },
        { chord: null, word: '  ' },
        { chord: 'G', word: '' },
        { chord: null, word: '  ' },
        { chord: 'Am', word: '' },
        { chord: null, word: '  ' },
        { chord: 'F', word: '' }
      ])
    })
  })

  describe('Real-world song examples', () => {
    it('should parse "Somewhere Over The Rainbow" correctly', () => {
      const song = `[C]Somewhere [Em]over the rainbow
[F]Way up [C]high
[F]And the [C]dreams that you [Am]dream of
[G]Once in a lulla[Am]by [F]

[C]Oh some[Em]where over the rainbow
[F]Blue birds [C]fly
[F]And the [C]dreams that you [Am]dream of
[G]Dreams really do come [C]true`
      
      const result = parseChordPro(song)
      
      expect(result.lines).toHaveLength(9) // 8 lines + 1 empty line
      
      // Check first line
      expect(result.lines[0].parts).toEqual([
        { chord: 'C', word: 'Somewhere' },
        { chord: null, word: ' ' },
        { chord: 'Em', word: 'over' },
        { chord: null, word: ' the rainbow' }
      ])
      
      // Check empty line
      expect(result.lines[4].parts).toEqual([
        { chord: null, word: '' }
      ])
    })

    it('should handle instrumental sections', () => {
      const song = `Verse:
[C] [G] [Am] [F]
[C] [G] [F] [C]

Chorus:
[F]Sing along [C]now
[G]Everyone [Am]together`
      
      const result = parseChordPro(song)
      
      expect(result.lines).toHaveLength(7)
      
      // Check verse label
      expect(result.lines[0].parts).toEqual([
        { chord: null, word: 'Verse:' }
      ])
      
      // Check chord-only line
      expect(result.lines[1].parts.filter(part => part.chord)).toHaveLength(4)
    })
  })
})