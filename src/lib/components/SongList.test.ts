import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import SongList from './SongList.svelte';
import type { SongListItem } from '$lib/types';

// Mock the navigation module
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

describe('SongList Component', () => {
  const mockSongs: SongListItem[] = [
    { id: '1', title: 'Somewhere Over The Rainbow', artist: 'Israel Kamakawiwoʻole' },
    { id: '2', title: 'Riptide', artist: 'Vance Joy' },
    { id: '3', title: 'I\'m Yours', artist: null }
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading state correctly', () => {
    render(SongList, { props: { songs: [], loading: true, error: null } });
    
    // Should show loading skeletons
    const loadingElements = screen.getAllByRole('generic');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('renders error state correctly', () => {
    const errorMessage = 'Failed to load songs';
    render(SongList, { props: { songs: [], loading: false, error: errorMessage } });
    
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    render(SongList, { props: { songs: [], loading: false, error: null } });
    
    expect(screen.getByText('No songs available')).toBeInTheDocument();
    expect(screen.getByText('Check back later for new songs to play!')).toBeInTheDocument();
  });

  it('renders song list correctly', () => {
    render(SongList, { props: { songs: mockSongs, loading: false, error: null } });
    
    // Check that all songs are rendered
    expect(screen.getByText('Somewhere Over The Rainbow')).toBeInTheDocument();
    expect(screen.getByText('by Israel Kamakawiwoʻole')).toBeInTheDocument();
    
    expect(screen.getByText('Riptide')).toBeInTheDocument();
    expect(screen.getByText('by Vance Joy')).toBeInTheDocument();
    
    expect(screen.getByText('I\'m Yours')).toBeInTheDocument();
    expect(screen.getByText('Unknown artist')).toBeInTheDocument();
  });

  it('handles song click navigation', async () => {
    const { goto } = await import('$app/navigation');
    render(SongList, { props: { songs: mockSongs, loading: false, error: null } });
    
    const songCards = screen.getAllByRole('button');
    expect(songCards).toHaveLength(3);
    
    await fireEvent.click(songCards[0]);
    expect(goto).toHaveBeenCalledWith('/songs/1');
  });

  it('handles keyboard navigation', async () => {
    const { goto } = await import('$app/navigation');
    render(SongList, { props: { songs: mockSongs, loading: false, error: null } });
    
    const songCards = screen.getAllByRole('button');
    const firstSong = songCards[0];
    
    // Test Enter key
    await fireEvent.keyDown(firstSong, { key: 'Enter' });
    expect(goto).toHaveBeenCalledWith('/songs/1');
    
    // Test Space key
    vi.clearAllMocks();
    await fireEvent.keyDown(firstSong, { key: ' ' });
    expect(goto).toHaveBeenCalledWith('/songs/1');
  });

  it('ignores other keyboard keys', async () => {
    const { goto } = await import('$app/navigation');
    render(SongList, { props: { songs: mockSongs, loading: false, error: null } });
    
    const songCards = screen.getAllByRole('button');
    const firstSong = songCards[0];
    
    await fireEvent.keyDown(firstSong, { key: 'Tab' });
    expect(goto).not.toHaveBeenCalled();
  });

  it('applies correct CSS classes for mobile-first design', () => {
    render(SongList, { props: { songs: mockSongs, loading: false, error: null } });
    
    const songCards = screen.getAllByRole('button');
    // Filter out any buttons that might be from error states
    const actualSongCards = songCards.filter(card => 
      card.querySelector('h3') && card.classList.contains('touch-manipulation')
    );
    
    expect(actualSongCards.length).toBeGreaterThan(0);
    actualSongCards.forEach(card => {
      expect(card).toHaveClass('touch-manipulation');
      expect(card).toHaveClass('cursor-pointer');
      expect(card).toHaveClass('hover:shadow-md');
    });
  });

  it('truncates long song titles and artist names', () => {
    const longTitleSongs: SongListItem[] = [
      { 
        id: '1', 
        title: 'This is a very long song title that should be truncated on mobile devices', 
        artist: 'This is also a very long artist name that should be truncated' 
      }
    ];
    
    render(SongList, { props: { songs: longTitleSongs, loading: false, error: null } });
    
    const titleElement = screen.getByText(longTitleSongs[0].title);
    const artistElement = screen.getByText(`by ${longTitleSongs[0].artist}`);
    
    expect(titleElement).toHaveClass('truncate');
    expect(artistElement).toHaveClass('truncate');
  });
});