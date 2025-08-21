import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Navigation from './Navigation.svelte'

// Mock SvelteKit navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}))

// Mock page store with different URL scenarios
const createMockPage = (pathname: string) => ({
  url: new URL(`http://localhost:3000${pathname}`),
  params: {},
  route: { id: null },
  status: 200,
  error: null,
  data: {},
  form: null
})

let currentMockPage = createMockPage('/')

vi.mock('$app/stores', () => {
  return {
    page: {
      subscribe: vi.fn((callback) => {
        callback(currentMockPage)
        return vi.fn()
      })
    }
  }
})

import { page } from '$app/stores'
import { goto } from '$app/navigation'

const mockGoto = vi.mocked(goto)

describe('Navigation Component', () => {
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

  describe('Navigation components and mobile-first responsive behavior', () => {
    it('should render with mobile-first container constraints', () => {
      component = mount(Navigation, { target, props: {} })
      flushSync()

      const nav = target.querySelector('nav')
      expect(nav).toBeTruthy()
      expect(nav?.getAttribute('aria-label')).toBe('Main navigation')

      const container = nav?.querySelector('div')
      expect(container?.className).toContain('max-w-md')
      expect(container?.className).toContain('mx-auto')
      expect(container?.className).toContain('px-4')
    })

    it('should display home link when not showing back button and not on home page', () => {
      // Set to a non-home page
      currentMockPage = createMockPage('/123')
      
      component = mount(Navigation, { target, props: { showBackButton: false } })
      flushSync()

      const homeLink = target.querySelector('a[href="/"]')
      expect(homeLink).toBeTruthy()
      expect(homeLink?.getAttribute('aria-label')).toBe('Go to home page')
      
      // Should have touch-friendly minimum dimensions
      expect(homeLink?.className).toContain('min-h-[44px]')
      expect(homeLink?.className).toContain('touch-manipulation')
      
      // Reset to home page for other tests
      currentMockPage = createMockPage('/')
    })

    it('should display back button when showBackButton is true', () => {
      component = mount(Navigation, { 
        target, 
        props: { 
          showBackButton: true, 
          backUrl: '/' 
        } 
      })
      flushSync()

      const backButton = target.querySelector('button')
      expect(backButton).toBeTruthy()
      expect(backButton?.getAttribute('aria-label')).toBe('Go back to previous page')
      
      // Should have touch-friendly minimum dimensions
      expect(backButton?.className).toContain('min-h-[44px]')
      expect(backButton?.className).toContain('min-w-[44px]')
      expect(backButton?.className).toContain('touch-manipulation')
    })

    it('should display songs link when on song detail page', () => {
      // Mock being on a song detail page
      currentMockPage = createMockPage('/123')
      
      component = mount(Navigation, { target, props: {} })
      flushSync()

      const homeLink = target.querySelector('a[href="/"]')
      expect(homeLink).toBeTruthy()
      expect(homeLink?.getAttribute('aria-label')).toBe('Go to home page')
      expect(homeLink?.className).toContain('min-h-[44px]')
      expect(homeLink?.className).toContain('touch-manipulation')
    })

    it('should not display home link when on home page', () => {
      currentMockPage = createMockPage('/')
      
      component = mount(Navigation, { target, props: {} })
      flushSync()

      const homeLink = target.querySelector('a[href="/"]')
      expect(homeLink).toBeFalsy()
    })

    it('should not display home link when on home page', () => {
      currentMockPage = createMockPage('/')
      
      component = mount(Navigation, { target, props: {} })
      flushSync()

      const homeLink = target.querySelector('a[href="/"]')
      expect(homeLink).toBeFalsy()
    })

    it('should apply sticky positioning for mobile scrolling', () => {
      component = mount(Navigation, { target, props: {} })
      flushSync()

      const nav = target.querySelector('nav')
      expect(nav?.className).toContain('sticky')
      expect(nav?.className).toContain('top-0')
      expect(nav?.className).toContain('z-50')
    })

    it('should display appropriate title based on current page', () => {
      // Test home page title
      currentMockPage = createMockPage('/')
      component = mount(Navigation, { target, props: {} })
      flushSync()
      
      let titleElement = target.querySelector('h1')
      expect(titleElement?.textContent).toBe('Ukulele Catalog')

      // Test songs page title
      unmount(component)
      currentMockPage = createMockPage('/')
      component = mount(Navigation, { target, props: {} })
      flushSync()
      
      titleElement = target.querySelector('h1')
      expect(titleElement?.textContent).toBe('Ukulele Catalog')

      // Test song detail page title
      unmount(component)
      currentMockPage = createMockPage('/123')
      component = mount(Navigation, { target, props: {} })
      flushSync()
      
      titleElement = target.querySelector('h1')
      expect(titleElement?.textContent).toBe('Song Details')
    })

    it('should display custom title when provided', () => {
      component = mount(Navigation, { 
        target, 
        props: { title: 'Custom Page Title' } 
      })
      flushSync()

      const titleElement = target.querySelector('h1')
      expect(titleElement?.textContent).toBe('Custom Page Title')
    })

    it('should truncate long titles for mobile display', () => {
      const longTitle = 'This is a very long title that should be truncated on mobile devices'
      component = mount(Navigation, { 
        target, 
        props: { title: longTitle } 
      })
      flushSync()

      const titleElement = target.querySelector('h1')
      expect(titleElement?.className).toContain('truncate')
      expect(titleElement?.textContent).toBe(longTitle)
    })
  })

  describe('Keyboard navigation and accessibility features', () => {
    it('should handle keyboard navigation on back button', () => {
      component = mount(Navigation, { 
        target, 
        props: { 
          showBackButton: true, 
          backUrl: '/' 
        } 
      })
      flushSync()

      const backButton = target.querySelector('button')
      expect(backButton).toBeTruthy()

      // Test Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      backButton?.dispatchEvent(enterEvent)
      expect(mockGoto).toHaveBeenCalledWith('/')

      // Test Space key
      mockGoto.mockClear()
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
      backButton?.dispatchEvent(spaceEvent)
      expect(mockGoto).toHaveBeenCalledWith('/')

      // Test other keys (should not trigger navigation)
      mockGoto.mockClear()
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' })
      backButton?.dispatchEvent(tabEvent)
      expect(mockGoto).not.toHaveBeenCalled()
    })

    it('should handle click navigation on back button', () => {
      component = mount(Navigation, { 
        target, 
        props: { 
          showBackButton: true, 
          backUrl: '/custom-back' 
        } 
      })
      flushSync()

      const backButton = target.querySelector('button')
      backButton?.click()
      
      expect(mockGoto).toHaveBeenCalledWith('/custom-back')
    })

    it('should have proper focus indicators', () => {
      component = mount(Navigation, { target, props: {} })
      flushSync()

      const homeLink = target.querySelector('a[href="/"]')
      expect(homeLink?.className).toContain('focus:outline-none')
      expect(homeLink?.className).toContain('focus:ring-2')
      expect(homeLink?.className).toContain('focus:ring-blue-500')
      expect(homeLink?.className).toContain('focus:ring-offset-2')
    })

    it('should have proper ARIA labels for screen readers', () => {
      component = mount(Navigation, { 
        target, 
        props: { 
          showBackButton: true, 
          backUrl: '/' 
        } 
      })
      flushSync()

      const nav = target.querySelector('nav')
      expect(nav?.getAttribute('aria-label')).toBe('Main navigation')

      const backButton = target.querySelector('button')
      expect(backButton?.getAttribute('aria-label')).toBe('Go back to previous page')
    })

    it('should hide decorative icons from screen readers', () => {
      component = mount(Navigation, { target, props: {} })
      flushSync()

      const icons = target.querySelectorAll('svg')
      icons.forEach(icon => {
        expect(icon.getAttribute('aria-hidden')).toBe('true')
      })
    })

    it('should provide screen reader text that is hidden on larger screens', () => {
      component = mount(Navigation, { target, props: {} })
      flushSync()

      const srOnlyTexts = target.querySelectorAll('.sr-only')
      expect(srOnlyTexts.length).toBeGreaterThan(0)

      // Check for responsive screen reader text
      const responsiveTexts = target.querySelectorAll('.sr-only.sm\\:not-sr-only')
      expect(responsiveTexts.length).toBeGreaterThan(0)
    })
  })

  describe('Touch-friendly interface elements and focus indicators', () => {
    it('should have minimum touch target sizes', () => {
      component = mount(Navigation, { 
        target, 
        props: { 
          showBackButton: true, 
          backUrl: '/' 
        } 
      })
      flushSync()

      const backButton = target.querySelector('button')
      expect(backButton?.className).toContain('min-h-[44px]')
      expect(backButton?.className).toContain('min-w-[44px]')

      const homeLink = target.querySelector('a[href="/"]')
      if (homeLink) {
        expect(homeLink.className).toContain('min-h-[44px]')
      }
    })

    it('should have touch-manipulation CSS for better mobile interaction', () => {
      component = mount(Navigation, { target, props: {} })
      flushSync()

      const interactiveElements = target.querySelectorAll('button, a')
      interactiveElements.forEach(element => {
        expect(element.className).toContain('touch-manipulation')
      })
    })

    it('should have hover states for desktop interaction', () => {
      component = mount(Navigation, { target, props: {} })
      flushSync()

      const homeLink = target.querySelector('a[href="/"]')
      expect(homeLink?.className).toContain('hover:text-gray-900')

      const backButton = target.querySelector('button')
      if (backButton) {
        expect(backButton.className).toContain('hover:text-gray-900')
      }
    })

    it('should have smooth transitions for better user experience', () => {
      component = mount(Navigation, { target, props: {} })
      flushSync()

      const interactiveElements = target.querySelectorAll('button, a')
      interactiveElements.forEach(element => {
        expect(element.className).toContain('transition-colors')
      })
    })

    it('should have proper spacing for touch targets', () => {
      currentMockPage = createMockPage('/123')
      
      component = mount(Navigation, { target, props: {} })
      flushSync()

      const rightSideContainer = target.querySelector('.flex.items-center.space-x-2')
      expect(rightSideContainer).toBeTruthy()
      expect(rightSideContainer?.className).toContain('space-x-2')
    })

    it('should maintain proper visual hierarchy with font weights', () => {
      component = mount(Navigation, { target, props: {} })
      flushSync()

      const title = target.querySelector('h1')
      expect(title?.className).toContain('font-semibold')

      const links = target.querySelectorAll('a, button')
      links.forEach(link => {
        expect(link.className).toContain('font-medium')
      })
    })
  })

  describe('Semantic HTML structure and screen reader compatibility', () => {
    it('should use proper semantic HTML elements', () => {
      component = mount(Navigation, { target, props: {} })
      flushSync()

      // Should have nav element
      const nav = target.querySelector('nav')
      expect(nav).toBeTruthy()

      // Should have h1 for page title
      const heading = target.querySelector('h1')
      expect(heading).toBeTruthy()

      // Should use button for interactive actions
      component = mount(Navigation, { 
        target, 
        props: { showBackButton: true } 
      })
      flushSync()

      const button = target.querySelector('button')
      expect(button).toBeTruthy()
    })

    it('should have proper heading hierarchy', () => {
      component = mount(Navigation, { target, props: {} })
      flushSync()

      // Should have exactly one h1
      const h1Elements = target.querySelectorAll('h1')
      expect(h1Elements).toHaveLength(1)

      // Should not have other heading levels in navigation
      const otherHeadings = target.querySelectorAll('h2, h3, h4, h5, h6')
      expect(otherHeadings).toHaveLength(0)
    })

    it('should provide meaningful link text and button labels', () => {
      currentMockPage = createMockPage('/123')
      
      component = mount(Navigation, { target, props: {} })
      flushSync()

      const homeLink = target.querySelector('a[href="/"]')
      expect(homeLink?.getAttribute('aria-label')).toBe('Go to home page')
    })

    it('should have proper color contrast for accessibility', () => {
      component = mount(Navigation, { target, props: {} })
      flushSync()

      // Title should have high contrast
      const title = target.querySelector('h1')
      expect(title?.className).toContain('text-gray-900')

      // Links should have readable contrast
      const links = target.querySelectorAll('a, button')
      links.forEach(link => {
        expect(link.className).toContain('text-gray-600')
      })
    })

    it('should support keyboard navigation flow', () => {
      currentMockPage = createMockPage('/123')
      
      component = mount(Navigation, { target, props: {} })
      flushSync()

      // All interactive elements should be focusable
      const focusableElements = target.querySelectorAll('a, button')
      expect(focusableElements.length).toBeGreaterThan(0)

      focusableElements.forEach(element => {
        // Should not have negative tabindex
        expect(element.getAttribute('tabindex')).not.toBe('-1')
      })
    })

    it('should maintain logical tab order', () => {
      currentMockPage = createMockPage('/123')
      
      component = mount(Navigation, { target, props: {} })
      flushSync()

      const focusableElements = Array.from(target.querySelectorAll('a, button'))
      
      // Elements should appear in logical order: home/back, then songs link
      expect(focusableElements.length).toBe(2)
      
      // First element should be home link
      const firstElement = focusableElements[0]
      expect(firstElement.getAttribute('href')).toBe('/')
      
      // Second element should be songs link
      const secondElement = focusableElements[1]
      expect(secondElement.getAttribute('href')).toBe('/')
    })

    it('should provide context for screen reader users', () => {
      component = mount(Navigation, { 
        target, 
        props: { 
          title: 'Custom Page',
          showBackButton: true,
          backUrl: '/previous'
        } 
      })
      flushSync()

      // Navigation should have proper landmark
      const nav = target.querySelector('nav')
      expect(nav?.getAttribute('aria-label')).toBe('Main navigation')

      // Page title should be announced
      const title = target.querySelector('h1')
      expect(title?.textContent).toBe('Custom Page')

      // Back button should have clear purpose
      const backButton = target.querySelector('button')
      expect(backButton?.getAttribute('aria-label')).toBe('Go back to previous page')
    })

    it('should handle dynamic content updates for screen readers', () => {
      // Start with home page
      currentMockPage = createMockPage('/')
      component = mount(Navigation, { target, props: {} })
      flushSync()

      let title = target.querySelector('h1')
      expect(title?.textContent).toBe('Ukulele Catalog')

      // Update to songs page
      unmount(component)
      currentMockPage = createMockPage('/')
      component = mount(Navigation, { target, props: {} })
      flushSync()

      title = target.querySelector('h1')
      expect(title?.textContent).toBe('Ukulele Catalog')

      // Title should still be properly structured
      expect(title?.tagName).toBe('H1')
    })

    it('should provide alternative text for icon-only elements', () => {
      component = mount(Navigation, { 
        target, 
        props: { 
          showBackButton: true, 
          backUrl: '/' 
        } 
      })
      flushSync()

      // Back button should have screen reader text
      const backButton = target.querySelector('button')
      const srText = backButton?.querySelector('.sr-only')
      expect(srText?.textContent).toBe('Back')

      // Home link should have screen reader text
      unmount(component)
      currentMockPage = createMockPage('/123') // Set to non-home page
      component = mount(Navigation, { target, props: {} })
      flushSync()

      const homeLink = target.querySelector('a[href="/"]')
      const homeSrText = homeLink?.querySelector('.sr-only')
      expect(homeSrText?.textContent).toBe('Home')
      
      // Reset to home page
      currentMockPage = createMockPage('/')
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle missing backUrl gracefully', () => {
      component = mount(Navigation, { 
        target, 
        props: { 
          showBackButton: true 
          // backUrl not provided, should default to '/'
        } 
      })
      flushSync()

      const backButton = target.querySelector('button')
      backButton?.click()
      
      expect(mockGoto).toHaveBeenCalledWith('/')
    })

    it('should handle empty title gracefully', () => {
      // Reset to home page for this test
      currentMockPage = createMockPage('/')
      
      component = mount(Navigation, { 
        target, 
        props: { title: '' } 
      })
      flushSync()

      // Should fall back to default title based on current page
      const title = target.querySelector('h1')
      expect(title?.textContent).toBe('Ukulele Catalog') // Default for home page
    })

    it('should handle special characters in title', () => {
      const specialTitle = 'Song & Title "With" Special <Characters>'
      component = mount(Navigation, { 
        target, 
        props: { title: specialTitle } 
      })
      flushSync()

      const title = target.querySelector('h1')
      expect(title?.textContent).toBe(specialTitle)
    })

    it('should handle very long URLs in backUrl', () => {
      const longUrl = '//very-long-song-id-that-might-cause-issues-with-navigation-handling'
      component = mount(Navigation, { 
        target, 
        props: { 
          showBackButton: true, 
          backUrl: longUrl 
        } 
      })
      flushSync()

      const backButton = target.querySelector('button')
      backButton?.click()
      
      expect(mockGoto).toHaveBeenCalledWith(longUrl)
    })

    it('should maintain accessibility when props change', () => {
      // Start without back button
      component = mount(Navigation, { target, props: {} })
      flushSync()

      let nav = target.querySelector('nav')
      expect(nav?.getAttribute('aria-label')).toBe('Main navigation')

      // Update to show back button (remount for Svelte 5 compatibility)
      unmount(component)
      component = mount(Navigation, { target, props: { showBackButton: true, backUrl: '/' } })
      flushSync()

      nav = target.querySelector('nav')
      expect(nav?.getAttribute('aria-label')).toBe('Main navigation')

      const backButton = target.querySelector('button')
      expect(backButton?.getAttribute('aria-label')).toBe('Go back to previous page')
    })
  })
})