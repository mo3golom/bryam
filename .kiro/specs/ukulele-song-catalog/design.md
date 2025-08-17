# Design Document: Ukulele Song Catalog

## Overview

The Ukulele Song Catalog is a minimal web application built with SvelteKit that displays a catalog of ukulele songs with chord notation. The application provides a clean, mobile-first interface for browsing songs and viewing them with properly formatted chords and lyrics. Songs are stored in ChordPro format in a Supabase PostgreSQL database.

## CRITICAL IMPLEMENTATION RULE

**THE MAIN RULE**: Before implementing any tasks, agents MUST read the AGENTS.md file. This is a fundamental rule of agent development in this project and must be followed without exception.

## Architecture

### Technology Stack
- **Frontend Framework**: SvelteKit (latest version)
- **Database**: Supabase PostgreSQL with @supabase/supabase-js client
- **UI Library**: TailwindCSS for styling + Bits UI for headless components
- **Deployment**: Static site generation (SvelteKit adapter-static)

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SvelteKit     │    │   Supabase      │    │   PostgreSQL    │
│   Frontend      │◄──►│   API Layer     │◄──►│   Database      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. User navigates to `/songs` → SvelteKit loads song list page
2. Page component calls Supabase client → Fetches song metadata
3. User clicks song → Navigate to `/songs/[id]`
4. Song page loads → Fetch full song data including ChordPro body
5. ChordPro parser processes body → Generate structured chord/lyric data
6. SongViewer component renders → Display formatted song with chords

## Components and Interfaces

### Core Components

#### 1. SongList.svelte
**Purpose**: Display list of available songs in mobile-first design
**Props**: None (fetches data internally)
**Features**:
- Mobile-first single-column card layout (max-width: md)
- Song title and artist display optimized for touch
- Click navigation to individual song pages
- Loading states and error handling
- Empty state when no songs available
- Container never exceeds TailwindCSS 'md' breakpoint (768px)

#### 2. SongViewer.svelte
**Purpose**: Render ChordPro formatted songs with mobile-first chord alignment
**Props**: 
- `songData: { title: string, artist: string, body: string }`
**Features**:
- ChordPro parsing and rendering optimized for mobile screens
- Mobile-first chord-to-lyric alignment within max-width md
- Touch-friendly interface elements
- Graceful handling of malformed ChordPro
- Container constrained to TailwindCSS 'md' breakpoint maximum

#### 3. ChordPro Parser (utils/chordpro.js)
**Purpose**: Parse ChordPro format into renderable data structure
**Interface**:
```javascript
export function parseChordPro(text: string): ParsedLine[]

interface ParsedLine {
  parts: ChordLyricPair[]
}

interface ChordLyricPair {
  chord: string | null
  word: string
}
```

### Page Components

#### /songs/+page.svelte
- Fetches song list from Supabase
- Renders SongList component
- Handles loading and error states

#### /songs/[id]/+page.svelte
- Fetches individual song data by ID
- Renders SongViewer component
- Handles 404 for non-existent songs

### Supabase Client Configuration
```javascript
// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

## Data Models

### Database Schema (Supabase)

#### songs table
```sql
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (disabled for MVP)
-- ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Public read access for MVP
CREATE POLICY "Public read access" ON songs
  FOR SELECT USING (true);
```

#### Sample Data
```sql
INSERT INTO songs (title, artist, body) VALUES
('Somewhere Over The Rainbow', 'Israel Kamakawiwoʻole', 
 '[C]Somewhere [Em]over the rainbow
[F]Way up [C]high
[F]And the [C]dreams that you [Am]dream of
[G]Once in a lulla[Am]by [F]

[C]Oh some[Em]where over the rainbow
[F]Blue birds [C]fly
[F]And the [C]dreams that you [Am]dream of
[G]Dreams really do come [C]true');
```

### Frontend Data Models

#### Song List Item
```typescript
interface SongListItem {
  id: string
  title: string
  artist: string | null
}
```

#### Full Song Data
```typescript
interface Song {
  id: string
  title: string
  artist: string | null
  body: string
}
```

#### Parsed ChordPro Data
```typescript
interface ParsedSong {
  lines: ParsedLine[]
}

interface ParsedLine {
  parts: ChordLyricPair[]
}

interface ChordLyricPair {
  chord: string | null
  word: string
}
```

## Error Handling

### Database Errors
- Connection failures: Display user-friendly error message
- Query timeouts: Implement retry logic with exponential backoff
- Invalid song IDs: Return 404 page with navigation back to song list

### ChordPro Parsing Errors
- Malformed chord notation: Display content as plain text
- Empty song body: Show message indicating no content available
- Invalid characters: Sanitize and display safely

### Network Errors
- Offline detection: Show offline indicator
- Slow connections: Display loading states with progress indicators
- Failed requests: Provide retry buttons

## Testing Strategy

### Unit Tests
- ChordPro parser functionality with various input formats
- Component rendering with different prop combinations
- Supabase client configuration and query building

### Integration Tests
- End-to-end song list loading and navigation
- Song page rendering with real ChordPro data
- Error handling scenarios (network failures, invalid IDs)

### Manual Testing
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Mobile responsiveness on various screen sizes
- Chord alignment accuracy on different devices
- Performance with large song catalogs

## UI/UX Design Specifications

### Visual Design
- **Color Scheme**: Clean, high-contrast design suitable for stage lighting
- **Typography**: Clear, readable fonts optimized for chord display
- **Layout**: Card-based design for song lists, centered content for song display

### Mobile-First Design Philosophy
This application follows a **mobile-first approach** with the following constraints:
- **Maximum container width**: `md` (768px) - no content should exceed this width
- **Primary target**: Mobile devices with touch-friendly interfaces
- **Layout priority**: Single-column layouts optimized for mobile viewing
- **Responsive scaling**: Content adapts up from mobile, not down from desktop

### Responsive Breakpoints
- **Mobile**: < 640px - Single column layout, larger touch targets (primary focus)
- **Tablet**: 640px - 768px - Optimized single/two-column hybrid within max-width md
- **Desktop**: > 768px - Content remains within max-width md container, centered

### Accessibility
- Semantic HTML structure for screen readers
- Keyboard navigation support
- High contrast mode compatibility
- Focus indicators for interactive elements

### Performance Targets
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Bundle Size**: < 100KB gzipped
- **Database Query Time**: < 200ms average

## Security Considerations

### Data Validation
- Input sanitization for ChordPro content
- SQL injection prevention through Supabase client
- XSS protection through Svelte's built-in escaping

### Database Security
- Row Level Security policies (disabled for MVP, enabled for production)
- API key management through environment variables
- Read-only access for public users

## Deployment and Infrastructure

### Build Configuration
```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: null
    })
  }
};
```

### Environment Variables
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Hosting Options
- **Vercel**: Optimal for SvelteKit with automatic deployments
- **Netlify**: Good alternative with form handling capabilities
- **GitHub Pages**: Free option for static hosting

This design provides a solid foundation for implementing the ukulele song catalog while maintaining simplicity, performance, and user experience as core priorities.