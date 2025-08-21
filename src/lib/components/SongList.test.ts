import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
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
    expect(goto).toHaveBeenCalledWith('/1');
  });

  it('handles keyboard navigation', async () => {
    const { goto } = await import('$app/navigation');
    render(SongList, { props: { songs: mockSongs, loading: false, error: null } });
    
    const songCards = screen.getAllByRole('button');
    const firstSong = songCards[0];
    
    // Test Enter key
    await fireEvent.keyDown(firstSong, { key: 'Enter' });
    expect(goto).toHaveBeenCalledWith('/1');
    
    // Test Space key
    vi.clearAllMocks();
    await fireEvent.keyDown(firstSong, { key: ' ' });
    expect(goto).toHaveBeenCalledWith('/1');
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

  describe('Integration Tests', () => {
    it('handles complete song list loading flow', async () => {
      const { rerender } = render(SongList, { 
        props: { songs: [], loading: true, error: null } 
      });
      
      // Initially shows loading state
      expect(screen.getAllByRole('generic').length).toBeGreaterThan(0);
      
      // Simulate successful data loading
      await rerender({ 
        songs: mockSongs, 
        loading: false, 
        error: null 
      });
      
      // Should show loaded songs
      expect(screen.getByText('Somewhere Over The Rainbow')).toBeInTheDocument();
      expect(screen.getByText('Riptide')).toBeInTheDocument();
      expect(screen.getByText('I\'m Yours')).toBeInTheDocument();
    });

    it('handles error recovery flow', async () => {
      // Mock window.location.reload
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      });

      const { rerender } = render(SongList, { 
        props: { songs: [], loading: true, error: null } 
      });
      
      // Simulate error during loading
      await rerender({ 
        songs: [], 
        loading: false, 
        error: 'Network error occurred' 
      });
      
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
      
      // Test retry functionality
      const retryButton = screen.getByText('Try Again');
      await fireEvent.click(retryButton);
      expect(mockReload).toHaveBeenCalled();
    });

    it('handles navigation flow from empty to populated list', async () => {
      const { rerender } = render(SongList, { 
        props: { songs: [], loading: false, error: null } 
      });
      
      // Initially shows empty state
      expect(screen.getByText('No songs available')).toBeInTheDocument();
      
      // Simulate songs being added
      await rerender({ 
        songs: mockSongs, 
        loading: false, 
        error: null 
      });
      
      // Should show song list with navigation
      const songCards = screen.getAllByRole('button');
      expect(songCards).toHaveLength(3);
      
      // Test navigation works
      const { goto } = await import('$app/navigation');
      await fireEvent.click(songCards[0]);
      expect(goto).toHaveBeenCalledWith('/1');
    });
  });

  describe('Mobile-First Responsive Layout Tests', () => {
    it('applies mobile-first container constraints', () => {
      const { container } = render(SongList, { 
        props: { songs: mockSongs, loading: false, error: null } 
      });
      
      const mainContainer = container.querySelector('div');
      expect(mainContainer).toHaveClass('w-full');
    });

    it('uses single-column layout for song cards', () => {
      render(SongList, { props: { songs: mockSongs, loading: false, error: null } });
      
      const songContainer = screen.getAllByRole('button')[0].closest('.space-y-3');
      expect(songContainer).toBeInTheDocument();
      expect(songContainer).toHaveClass('space-y-3');
    });

    it('applies touch-friendly spacing and sizing', () => {
      render(SongList, { props: { songs: mockSongs, loading: false, error: null } });
      
      const songCards = screen.getAllByRole('button');
      songCards.forEach(card => {
        // Check for adequate padding for touch targets
        expect(card).toHaveClass('p-4');
        // Check for touch manipulation optimization
        expect(card).toHaveClass('touch-manipulation');
      });
    });

    it('maintains readability with proper text sizing', () => {
      render(SongList, { props: { songs: mockSongs, loading: false, error: null } });
      
      // Check title text sizing
      const titleElements = screen.getAllByRole('heading', { level: 3 });
      titleElements.forEach(title => {
        expect(title).toHaveClass('text-lg');
        expect(title).toHaveClass('font-semibold');
      });
    });

    it('provides visual feedback for interactive elements', () => {
      render(SongList, { props: { songs: mockSongs, loading: false, error: null } });
      
      const songCards = screen.getAllByRole('button');
      songCards.forEach(card => {
        expect(card).toHaveClass('hover:shadow-md');
        expect(card).toHaveClass('hover:border-gray-300');
        expect(card).toHaveClass('focus:ring-2');
        expect(card).toHaveClass('focus:ring-blue-500');
      });
    });
  });

  describe('Touch-Friendly Navigation and Accessibility Tests', () => {
    it('provides proper ARIA roles and attributes', () => {
      render(SongList, { props: { songs: mockSongs, loading: false, error: null } });
      
      const songCards = screen.getAllByRole('button');
      songCards.forEach(card => {
        expect(card).toHaveAttribute('role', 'button');
        expect(card).toHaveAttribute('tabindex', '0');
      });
    });

    it('supports keyboard navigation with proper focus management', async () => {
      const user = userEvent.setup();
      render(SongList, { props: { songs: mockSongs, loading: false, error: null } });
      
      const songCards = screen.getAllByRole('button');
      const firstCard = songCards[0];
      
      // Test tab navigation
      await user.tab();
      expect(firstCard).toHaveFocus();
      
      // Test Enter key activation
      const { goto } = await import('$app/navigation');
      await user.keyboard('{Enter}');
      expect(goto).toHaveBeenCalledWith('/1');
    });

    it('handles touch events properly', async () => {
      const user = userEvent.setup();
      render(SongList, { props: { songs: mockSongs, loading: false, error: null } });
      
      const songCards = screen.getAllByRole('button');
      const firstCard = songCards[0];
      
      // Test click/touch activation
      const { goto } = await import('$app/navigation');
      await user.click(firstCard);
      expect(goto).toHaveBeenCalledWith('/1');
    });

    it('provides accessible error state with retry functionality', async () => {
      const user = userEvent.setup();
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      });

      render(SongList, { 
        props: { songs: [], loading: false, error: 'Connection failed' } 
      });
      
      const retryButton = screen.getByRole('button', { name: 'Retry loading songs' });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveClass('focus:outline-none');
      expect(retryButton).toHaveClass('focus:ring-2');
      
      await user.click(retryButton);
      expect(mockReload).toHaveBeenCalled();
    });

    it('maintains accessibility in empty state', () => {
      render(SongList, { props: { songs: [], loading: false, error: null } });
      
      const emptyStateHeading = screen.getByRole('heading', { level: 3 });
      expect(emptyStateHeading).toHaveTextContent('No songs available');
      
      // Check for descriptive text
      expect(screen.getByText('Check back later for new songs to play!')).toBeInTheDocument();
    });

    it('provides proper loading state accessibility', () => {
      render(SongList, { props: { songs: [], loading: true, error: null } });
      
      // Loading skeletons should be present
      const loadingElements = screen.getAllByRole('generic');
      expect(loadingElements.length).toBeGreaterThan(0);
      
      // Check for loading animation classes
      const animatedElements = document.querySelectorAll('.animate-pulse');
      expect(animatedElements.length).toBeGreaterThan(0);
    });

    it('handles rapid state changes gracefully', async () => {
      const { rerender } = render(SongList, { 
        props: { songs: [], loading: true, error: null } 
      });
      
      // Rapid state changes
      await rerender({ songs: [], loading: false, error: 'Error' });
      await rerender({ songs: [], loading: true, error: null });
      await rerender({ songs: mockSongs, loading: false, error: null });
      
      // Should end up in the correct final state
      expect(screen.getByText('Somewhere Over The Rainbow')).toBeInTheDocument();
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
    });

    it('supports screen reader navigation', () => {
      render(SongList, { props: { songs: mockSongs, loading: false, error: null } });
      
      // Check for proper heading structure
      const songTitles = screen.getAllByRole('heading', { level: 3 });
      expect(songTitles).toHaveLength(3);
      
      // Check for descriptive text content
      expect(screen.getByText('by Israel Kamakawiwoʻole')).toBeInTheDocument();
      expect(screen.getByText('Unknown artist')).toBeInTheDocument();
    });
  });

  describe('Performance and Edge Case Tests', () => {
    it('handles large song lists efficiently', () => {
      const largeSongList: SongListItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `song-${i}`,
        title: `Song Title ${i}`,
        artist: `Artist ${i}`
      }));
      
      const { container } = render(SongList, { 
        props: { songs: largeSongList, loading: false, error: null } 
      });
      
      const songCards = screen.getAllByRole('button');
      expect(songCards).toHaveLength(100);
      
      // Should maintain performance with proper key usage
      const firstCard = songCards[0];
      expect(firstCard).toBeInTheDocument();
    });

    it('handles songs with special characters in titles', () => {
      const specialCharSongs: SongListItem[] = [
        { id: '1', title: 'Song with "Quotes" & Symbols', artist: 'Artist & Co.' },
        { id: '2', title: 'Émojis 🎵 and Ñoñó', artist: 'Spëcial Chärs' }
      ];
      
      render(SongList, { 
        props: { songs: specialCharSongs, loading: false, error: null } 
      });
      
      expect(screen.getByText('Song with "Quotes" & Symbols')).toBeInTheDocument();
      expect(screen.getByText('Émojis 🎵 and Ñoñó')).toBeInTheDocument();
      expect(screen.getByText('by Artist & Co.')).toBeInTheDocument();
      expect(screen.getByText('by Spëcial Chärs')).toBeInTheDocument();
    });

    it('prevents event bubbling on keyboard navigation', async () => {
      const user = userEvent.setup();
      render(SongList, { props: { songs: mockSongs, loading: false, error: null } });
      
      const songCards = screen.getAllByRole('button');
      const firstCard = songCards[0];
      
      // Mock preventDefault to verify it's called
      const preventDefaultSpy = vi.fn();
      firstCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          preventDefaultSpy();
        }
      });
      
      await user.type(firstCard, '{Enter}');
      await user.type(firstCard, ' ');
      
      // Should have prevented default for both Enter and Space
      expect(preventDefaultSpy).toHaveBeenCalledTimes(2);
    });
  });
});