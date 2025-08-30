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
 * Splits text into parts separating spaces from words
 * All spaces become dedicated parts without chords
 * All words are trimmed of leading/trailing spaces
 */
function splitTextWithSpaces(text: string): ChordLyricPair[] {
  if (!text) return []
  
  const parts: ChordLyricPair[] = []
  let currentIndex = 0
  
  while (currentIndex < text.length) {
    // Find the next space or non-space sequence
    if (text[currentIndex] === ' ' || text[currentIndex] === '\t') {
      // Collect consecutive spaces/tabs
      let spaceEnd = currentIndex
      while (spaceEnd < text.length && (text[spaceEnd] === ' ' || text[spaceEnd] === '\t')) {
        spaceEnd++
      }
      parts.push({ chord: null, chordPosition: null, word: text.substring(currentIndex, spaceEnd) })
      currentIndex = spaceEnd
    } else {
      // Collect non-space characters
      let wordEnd = currentIndex
      while (wordEnd < text.length && text[wordEnd] !== ' ' && text[wordEnd] !== '\t') {
        wordEnd++
      }
      const word = text.substring(currentIndex, wordEnd).trim()
      if (word) {
        parts.push({ chord: null, chordPosition: null, word })
      }
      currentIndex = wordEnd
    }
  }
  
  return parts
}

/**
 * Parse ChordPro format into renderable data structure
 * Handles standard chord notation patterns like [C], [Em], [F#m], etc.
 * Supports major, minor, diminished, augmented, and suspended chords
 * Gracefully handles malformed ChordPro content
 * All spaces are separated as dedicated parts without chords
 * All words are trimmed of leading/trailing spaces
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
      parsedLines.push({ parts: [{ chord: null, chordPosition: null, word: '' }] })
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

      // Add text before the chord (if any) with proper space handling
      if (chordStart > lastIndex) {
        const textBefore = line.substring(lastIndex, chordStart)
        if (textBefore) {
          parts.push(...splitTextWithSpaces(textBefore))
        }
      }

      // Find the text that follows this chord
      const remainingText = line.substring(chordEnd)
      const textMatch = remainingText.match(/^([^\[]*?)(?=\[|$)/)
      const followingText = textMatch ? textMatch[1] : ''

      if (followingText) {
        // Split the following text into spaces and words
        const textParts = splitTextWithSpaces(followingText)
        if (textParts.length > 0) {
          // The first part (word) goes with the chord
          const firstPart = textParts[0]
          parts.push({ chord, chordPosition, word: firstPart.word })
          
          // Add remaining parts (spaces and words) as separate parts
          for (let i = 1; i < textParts.length; i++) {
            parts.push(textParts[i])
          }
        } else {
          // No text parts, just add the chord with empty word
          parts.push({ chord, chordPosition, word: '' })
        }
      } else {
        // No following text, just add the chord with empty word
        parts.push({ chord, chordPosition, word: '' })
      }

      lastIndex = chordEnd + followingText.length
      chordPosition++
    }

    // Add any remaining text after the last chord with proper space handling
    if (lastIndex < line.length) {
      const remainingText = line.substring(lastIndex)
      if (remainingText) {
        parts.push(...splitTextWithSpaces(remainingText))
      }
    }

    // If no chords were found, treat the entire line as lyrics with proper space handling
    if (parts.length === 0) {
      parts.push(...splitTextWithSpaces(line))
    }

    // Add the line to parsed lines only if it has chords
    if (chordPosition > 0) {
      parsedLines.push({ parts, metadata: { chordCount: chordPosition } })
    }
  }

  return { lines: parsedLines }
}