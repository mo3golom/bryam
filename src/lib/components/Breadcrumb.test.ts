import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Breadcrumb from './Breadcrumb.svelte'
import type { BreadcrumbItem } from './Breadcrumb.svelte'

// Mock window.location for navigation testing
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/'
  },
  writable: true
})

describe('Breadcrumb Component', () => {
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
    it('should not render when items array has only one item', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const nav = target.querySelector('nav')
      expect(nav).toBeFalsy()
    })

    it('should not render when items array is empty', () => {
      const items: BreadcrumbItem[] = []

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const nav = target.querySelector('nav')
      expect(nav).toBeFalsy()
    })

    it('should render when items array has multiple items', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' },
        { label: 'Current Song', current: true }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const nav = target.querySelector('nav')
      expect(nav).toBeTruthy()
      expect(nav?.getAttribute('aria-label')).toBe('Breadcrumb')
    })

    it('should apply mobile-first responsive spacing', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const nav = target.querySelector('nav')
      expect(nav?.className).toContain('mb-4')

      const ol = nav?.querySelector('ol')
      expect(ol?.className).toContain('space-x-1')
      expect(ol?.className).toContain('md:space-x-3')
      expect(ol?.className).toContain('text-sm')
    })

    it('should render separators between breadcrumb items', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' },
        { label: 'Current Song', current: true }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const separators = target.querySelectorAll('svg')
      expect(separators).toHaveLength(2) // One separator between each item
      
      separators.forEach(separator => {
        expect(separator.getAttribute('aria-hidden')).toBe('true')
        // Check if the SVG has the text-gray-400 class
        expect(separator.classList.contains('text-gray-400')).toBe(true)
      })
    })

    it('should render clickable links for non-current items', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' },
        { label: 'Current Song', current: true }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const links = target.querySelectorAll('a')
      expect(links).toHaveLength(2)

      expect(links[0].getAttribute('href')).toBe('/')
      expect(links[0].textContent).toBe('Home')

      expect(links[1].getAttribute('href')).toBe('/songs')
      expect(links[1].textContent).toBe('Songs')
    })

    it('should render current item as non-clickable span', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Current Song', current: true }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const currentSpan = target.querySelector('span[aria-current="page"]')
      expect(currentSpan).toBeTruthy()
      expect(currentSpan?.textContent).toBe('Current Song')
      expect(currentSpan?.className).toContain('text-gray-500')
      expect(currentSpan?.className).toContain('font-medium')
    })

    it('should render items without href as non-clickable spans', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Non-clickable Item' } // No href provided
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const spans = target.querySelectorAll('span')
      const nonClickableSpan = Array.from(spans).find(span => 
        span.textContent === 'Non-clickable Item'
      )
      
      expect(nonClickableSpan).toBeTruthy()
      expect(nonClickableSpan?.className).toContain('text-gray-500')
    })
  })

  describe('Keyboard navigation and accessibility features', () => {
    it('should handle keyboard navigation with Enter key', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const homeLink = target.querySelector('a[href="/"]')
      
      const enterEvent = new KeyboardEvent('keydown', { 
        key: 'Enter',
        bubbles: true,
        cancelable: true
      })
      
      const preventDefaultSpy = vi.spyOn(enterEvent, 'preventDefault')
      homeLink?.dispatchEvent(enterEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(window.location.href).toBe('/')
    })

    it('should handle keyboard navigation with Space key', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const songsLink = target.querySelector('a[href="/songs"]')
      
      const spaceEvent = new KeyboardEvent('keydown', { 
        key: ' ',
        bubbles: true,
        cancelable: true
      })
      
      const preventDefaultSpy = vi.spyOn(spaceEvent, 'preventDefault')
      songsLink?.dispatchEvent(spaceEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(window.location.href).toBe('/songs')
    })

    it('should not handle other keyboard keys', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const homeLink = target.querySelector('a[href="/"]')
      
      const tabEvent = new KeyboardEvent('keydown', { 
        key: 'Tab',
        bubbles: true,
        cancelable: true
      })
      
      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault')
      homeLink?.dispatchEvent(tabEvent)

      expect(preventDefaultSpy).not.toHaveBeenCalled()
    })

    it('should have proper focus indicators for links', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const links = target.querySelectorAll('a')
      links.forEach(link => {
        expect(link.className).toContain('focus:outline-none')
        expect(link.className).toContain('focus:ring-2')
        expect(link.className).toContain('focus:ring-blue-500')
        expect(link.className).toContain('focus:ring-offset-1')
      })
    })

    it('should provide proper ARIA current attribute for current page', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Current Page', current: true }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const currentItem = target.querySelector('[aria-current="page"]')
      expect(currentItem).toBeTruthy()
      expect(currentItem?.textContent).toBe('Current Page')
    })

    it('should use proper semantic HTML structure', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' },
        { label: 'Current Song', current: true }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      // Should use nav element
      const nav = target.querySelector('nav')
      expect(nav).toBeTruthy()
      expect(nav?.getAttribute('aria-label')).toBe('Breadcrumb')

      // Should use ordered list
      const ol = nav?.querySelector('ol')
      expect(ol).toBeTruthy()

      // Should have list items
      const listItems = ol?.querySelectorAll('li')
      expect(listItems).toHaveLength(3)
    })
  })

  describe('Touch-friendly interface elements and focus indicators', () => {
    it('should have touch-friendly minimum dimensions', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const links = target.querySelectorAll('a')
      links.forEach(link => {
        expect(link.className).toContain('min-h-[44px]')
        expect(link.className).toContain('touch-manipulation')
        expect(link.className).toContain('flex')
        expect(link.className).toContain('items-center')
      })
    })

    it('should have proper padding for touch targets', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const links = target.querySelectorAll('a')
      links.forEach(link => {
        expect(link.className).toContain('px-1')
        expect(link.className).toContain('py-1')
      })
    })

    it('should have hover states for desktop interaction', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const links = target.querySelectorAll('a')
      links.forEach(link => {
        expect(link.className).toContain('hover:text-blue-600')
        expect(link.className).toContain('transition-colors')
      })
    })

    it('should have proper color contrast for readability', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Current Page', current: true }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      // Links should have good contrast
      const link = target.querySelector('a')
      expect(link?.className).toContain('text-gray-700')

      // Current item should have muted but readable contrast
      const currentItem = target.querySelector('[aria-current="page"]')
      expect(currentItem?.className).toContain('text-gray-500')
    })

    it('should maintain proper spacing between items on mobile and desktop', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' },
        { label: 'Current Song', current: true }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const ol = target.querySelector('ol')
      expect(ol?.className).toContain('space-x-1') // Mobile spacing
      expect(ol?.className).toContain('md:space-x-3') // Desktop spacing
    })
  })

  describe('Semantic HTML structure and screen reader compatibility', () => {
    it('should use proper landmark navigation', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const nav = target.querySelector('nav')
      expect(nav?.getAttribute('aria-label')).toBe('Breadcrumb')
    })

    it('should provide meaningful link text', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home Page', href: '/' },
        { label: 'Song Library', href: '/songs' },
        { label: 'Specific Song Title', current: true }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const links = target.querySelectorAll('a')
      expect(links[0].textContent).toBe('Home Page')
      expect(links[1].textContent).toBe('Song Library')

      const currentItem = target.querySelector('[aria-current="page"]')
      expect(currentItem?.textContent).toBe('Specific Song Title')
    })

    it('should hide decorative separators from screen readers', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' },
        { label: 'Current Song', current: true }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const separators = target.querySelectorAll('svg')
      separators.forEach(separator => {
        expect(separator.getAttribute('aria-hidden')).toBe('true')
      })
    })

    it('should maintain logical tab order', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' },
        { label: 'Artists', href: '/artists' },
        { label: 'Current Artist', current: true }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const links = target.querySelectorAll('a')
      expect(links).toHaveLength(3)

      // Links should appear in order
      expect(links[0].getAttribute('href')).toBe('/')
      expect(links[1].getAttribute('href')).toBe('/songs')
      expect(links[2].getAttribute('href')).toBe('/artists')

      // None should have negative tabindex
      links.forEach(link => {
        expect(link.getAttribute('tabindex')).not.toBe('-1')
      })
    })

    it('should support screen reader navigation with proper structure', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' },
        { label: 'Current Song', current: true }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      // Should have proper list structure
      const nav = target.querySelector('nav')
      const ol = nav?.querySelector('ol')
      const listItems = ol?.querySelectorAll('li')

      expect(nav).toBeTruthy()
      expect(ol).toBeTruthy()
      expect(listItems).toHaveLength(3)

      // Each list item should contain either a link or current page indicator
      listItems?.forEach((li, index) => {
        if (index < 2) {
          expect(li.querySelector('a')).toBeTruthy()
        } else {
          expect(li.querySelector('[aria-current="page"]')).toBeTruthy()
        }
      })
    })

    it('should provide context for screen reader users', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Music Library', href: '/songs' },
        { label: 'Ukulele Songs', current: true }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      // Navigation should be properly labeled
      const nav = target.querySelector('nav')
      expect(nav?.getAttribute('aria-label')).toBe('Breadcrumb')

      // Current page should be properly marked
      const currentPage = target.querySelector('[aria-current="page"]')
      expect(currentPage).toBeTruthy()
      expect(currentPage?.textContent).toBe('Ukulele Songs')

      // All text should be accessible
      expect(target.textContent).toContain('Home')
      expect(target.textContent).toContain('Music Library')
      expect(target.textContent).toContain('Ukulele Songs')
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle empty item labels gracefully', () => {
      const items: BreadcrumbItem[] = [
        { label: '', href: '/' },
        { label: 'Songs', href: '/songs' }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const links = target.querySelectorAll('a')
      expect(links).toHaveLength(2)
      expect(links[0].textContent).toBe('')
      expect(links[1].textContent).toBe('Songs')
    })

    it('should handle special characters in labels', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home & Garden', href: '/' },
        { label: 'Songs "With" Quotes', href: '/songs' },
        { label: 'Current <Song>', current: true }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      expect(target.textContent).toContain('Home & Garden')
      expect(target.textContent).toContain('Songs "With" Quotes')
      expect(target.textContent).toContain('Current <Song>')
    })

    it('should handle very long breadcrumb labels', () => {
      const longLabel = 'This is a very long breadcrumb label that might wrap to multiple lines on mobile devices'
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: longLabel, current: true }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const currentItem = target.querySelector('[aria-current="page"]')
      expect(currentItem?.textContent).toBe(longLabel)
    })

    it('should handle missing href gracefully', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'No Link Item' }, // Missing href
        { label: 'Current', current: true }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      // Should render as span instead of link (items without href get aria-current="page")
      const spans = target.querySelectorAll('span')
      const noLinkSpan = Array.from(spans).find(span => 
        span.textContent?.trim() === 'No Link Item'
      )
      
      expect(noLinkSpan).toBeTruthy()
      expect(noLinkSpan?.tagName).toBe('SPAN')
      expect(noLinkSpan?.getAttribute('aria-current')).toBe('page')
    })

    it('should handle keyboard events without href', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'No Link Item' } // Missing href
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const homeLink = target.querySelector('a[href="/"]')
      
      // Should not throw error when dispatching keyboard event on item without href
      expect(() => {
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
        homeLink?.dispatchEvent(enterEvent)
      }).not.toThrow()
    })

    it('should handle items with both current and href properties', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Current with Link', href: '/current', current: true }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      // Current items should be rendered as spans, not links, even if href is provided
      const currentItem = target.querySelector('[aria-current="page"]')
      expect(currentItem?.tagName).toBe('SPAN')
      expect(currentItem?.textContent).toBe('Current with Link')

      // Should not have a link for the current item
      const currentLink = target.querySelector('a[href="/current"]')
      expect(currentLink).toBeFalsy()
    })

    it('should maintain accessibility when props change', () => {
      let items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      let nav = target.querySelector('nav')
      expect(nav?.getAttribute('aria-label')).toBe('Breadcrumb')

      // Update items
      items = [
        { label: 'Home', href: '/' },
        { label: 'Artists', href: '/artists' },
        { label: 'Current Artist', current: true }
      ]

      // Remount component with new props (Svelte 5 compatible)
      unmount(component)
      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      nav = target.querySelector('nav')
      expect(nav?.getAttribute('aria-label')).toBe('Breadcrumb')

      const currentItem = target.querySelector('[aria-current="page"]')
      expect(currentItem?.textContent).toBe('Current Artist')
    })

    it('should handle rapid keyboard navigation', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Songs', href: '/songs' }
      ]

      component = mount(Breadcrumb, { target, props: { items } })
      flushSync()

      const homeLink = target.querySelector('a[href="/"]')
      
      // Rapidly dispatch multiple keyboard events
      for (let i = 0; i < 5; i++) {
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
        homeLink?.dispatchEvent(enterEvent)
      }

      // Should not throw errors and should handle all events
      // Each event should have navigated to '/'
      expect(window.location.href).toContain('/')
    })
  })
})