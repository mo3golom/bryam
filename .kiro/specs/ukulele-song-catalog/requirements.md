# Requirements Document

## Introduction

This feature implements a minimal web application for displaying a catalog of ukulele songs. The application will show a list of songs with titles and artists, provide individual song pages with adaptive text and chord display, and store songs in ChordPro format in a Supabase database. This MVP version excludes admin functionality and authentication - data will be added manually through the Supabase interface.

## Requirements

### Requirement 1

**User Story:** As a ukulele player, I want to view a list of available songs, so that I can browse and select songs to play.

#### Acceptance Criteria

1. WHEN a user visits the songs page THEN the system SHALL display a list of all songs with title and artist information
2. WHEN a song entry is displayed THEN the system SHALL show the song title and artist name in a card format
3. WHEN a user clicks on a song card THEN the system SHALL navigate to the individual song page
4. IF no songs are available THEN the system SHALL display an appropriate empty state message

### Requirement 2

**User Story:** As a ukulele player, I want to view individual songs with chords and lyrics, so that I can play the song.

#### Acceptance Criteria

1. WHEN a user accesses a song page THEN the system SHALL display the song title, artist, and formatted content
2. WHEN displaying song content THEN the system SHALL parse ChordPro format and render chords above corresponding lyrics
3. WHEN rendering chords THEN the system SHALL position chords directly above their corresponding words
4. WHEN displaying on different screen sizes THEN the system SHALL maintain readable chord-to-lyric alignment
5. IF a song contains no chords THEN the system SHALL display lyrics without chord placeholders

### Requirement 3

**User Story:** As a system administrator, I want songs to be stored in a structured database, so that the application can retrieve and display them efficiently.

#### Acceptance Criteria

1. WHEN the system starts THEN it SHALL connect to a Supabase PostgreSQL database
2. WHEN storing songs THEN the system SHALL use a songs table with id, title, artist, body, and created_at fields
3. WHEN retrieving song lists THEN the system SHALL fetch id, title, and artist fields only
4. WHEN retrieving individual songs THEN the system SHALL fetch title, artist, and body fields
5. WHEN storing song content THEN the system SHALL preserve ChordPro formatting in the body field

### Requirement 4

**User Story:** As a ukulele player, I want the application to work well on mobile devices, so that I can use it while playing.

#### Acceptance Criteria

1. WHEN accessing the application on mobile THEN the system SHALL display content in a mobile-optimized layout
2. WHEN viewing songs on small screens THEN the system SHALL maintain chord alignment and readability
3. WHEN navigating between pages THEN the system SHALL provide responsive touch-friendly interface elements
4. WHEN loading content THEN the system SHALL optimize for mobile network conditions

### Requirement 5

**User Story:** As a developer, I want the ChordPro parsing to handle standard chord notation, so that songs display correctly.

#### Acceptance Criteria

1. WHEN parsing ChordPro content THEN the system SHALL recognize chord patterns in square brackets [C], [Em], [F#m], etc.
2. WHEN encountering chord variations THEN the system SHALL support major, minor, diminished, augmented, and suspended chords
3. WHEN parsing lyrics THEN the system SHALL associate chords with the immediately following text
4. WHEN a line contains no chords THEN the system SHALL display the text as plain lyrics
5. IF ChordPro content is malformed THEN the system SHALL gracefully display the content without breaking the interface