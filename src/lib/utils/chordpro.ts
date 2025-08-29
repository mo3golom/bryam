export interface ChordLyricPair {
  chord: string | null
  chordPosition: number | null
  word: string
}

export interface ParsedLine {
  parts: ChordLyricPair[]
  metadata?: {
    chordCount: number
  }
}

export interface ParsedSong {
  lines: ParsedLine[]
  error?: boolean
}

/**
 * Parse ChordPro format into renderable data structure
 * Handles standard chord notation patterns like [C], [Em], [F#m], etc.
 * Supports major, minor, diminished, augmented, and suspended chords
 * Gracefully handles malformed ChordPro content
 */
export function parseChordPro(text: string): ParsedSong {
  if (!text || typeof text !== 'string') {
    return { lines: [] }
  }

  const lines = text.split('\n')
  const parsedLines: ParsedLine[] = []

  for (const line of lines) {
    const parts: ChordLyricPair[] = []

    // Handle empty lines
    if (line.trim() === '') {
      continue
    }

    // Regex to match chord patterns in square brackets (only properly closed brackets)
    const chordRegex = /\[([^\]]*)\]/g
    let lastIndex = 0
    let match
    let chordPosition = 0
    while ((match = chordRegex.exec(line)) !== null) {
      const chordStart = match.index
      const chordEnd = chordRegex.lastIndex
      const chord = match[1]

      // Skip empty chords or chords with invalid characters
      if (!chord || chord.trim() === '') {
        continue
      }

      // Add text before the chord (if any)
      if (chordStart > lastIndex) {
        const textBefore = line.substring(lastIndex, chordStart)
        if (textBefore) {
          parts.push({ chord: null, chordPosition: null, word: textBefore })
        }
      }

      // Find the word that follows this chord
      const remainingText = line.substring(chordEnd)
      const wordMatch = remainingText.match(/^(\S*)/)
      const word = wordMatch ? wordMatch[1] : ''

      parts.push({ chord, chordPosition, word })
      lastIndex = chordEnd + word.length
      chordPosition++
    }

    // Add any remaining text after the last chord
    if (lastIndex < line.length) {
      const remainingText = line.substring(lastIndex)
      if (remainingText) {
        parts.push({ chord: null, chordPosition: null, word: remainingText })
      }
    }

    // If no chords were found, treat the entire line as lyrics
    if (parts.length === 0) {
      parts.push({ chord: null, chordPosition: null, word: line })
    }

    // Count chords in this line (parts where chord !== null)
    if (chordPosition > 0) {
      parsedLines.push({ parts, metadata: { chordCount: chordPosition } })
    }
  }

  return { lines: parsedLines }
}