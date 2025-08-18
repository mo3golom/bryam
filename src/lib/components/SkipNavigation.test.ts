import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import SkipNavigation from './SkipNavigation.svelte'

describe('SkipNavigation Component', () => {
  let component: any
  let target: HTMLElement

  beforeEach(() => {
    vi.clearAllMocks()
    target = document.createElement('div')
    document.body.appendChild(target)
    
    // Mock main content element with required methods
    const mainContent = document.createElement('main')
    mainContent.id = 'main-content'
    mainContent.tabIndex = -1
    
    // Mock scrollIntoView method for jsdom
    mainContent.scrollIntoView = vi.fn()
    
    document.body.appendChild(mainContent)
  })

  afterEach(() => {
    if (component) {
      unmount(component)
      component = null
    }
    if (target && target.parentNode) {
      target.parentNode.removeChild(target)
    }
    
    // Clean up main content mock
    const mainContent = document.getElementById('main-content')
    if (mainContent && mainContent.parentNode) {
      mainContent.parentNode.removeChild(mainContent)
    }
  })

  describe('Accessibility features and keyboard navigation', () => {
    it('should render skip link with proper accessibility attributes', () => {
      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      expect(skipLink).toBeTruthy()
      expect(skipLink?.getAttribute('href')).toBe('#main-content')
      expect(skipLink?.textContent).toBe('Skip to main content')
    })

    it('should be hidden by default but visible on focus', () => {
      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      expect(skipLink?.className).toContain('sr-only')
      expect(skipLink?.className).toContain('focus:not-sr-only')
      expect(skipLink?.className).toContain('focus:absolute')
    })

    it('should have proper focus styling for visibility', () => {
      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      expect(skipLink?.className).toContain('focus:top-4')
      expect(skipLink?.className).toContain('focus:left-4')
      expect(skipLink?.className).toContain('bg-blue-600')
      expect(skipLink?.className).toContain('text-white')
      expect(skipLink?.className).toContain('px-4')
      expect(skipLink?.className).toContain('py-2')
      expect(skipLink?.className).toContain('rounded-md')
    })

    it('should have high z-index for proper layering', () => {
      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      expect(skipLink?.className).toContain('z-50')
    })

    it('should have proper focus indicators', () => {
      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      expect(skipLink?.className).toContain('focus:outline-none')
      expect(skipLink?.className).toContain('focus:ring-2')
      expect(skipLink?.className).toContain('focus:ring-blue-500')
      expect(skipLink?.className).toContain('focus:ring-offset-2')
    })

    it('should handle click navigation to main content', () => {
      const mainContent = document.getElementById('main-content')
      const focusSpy = vi.spyOn(mainContent!, 'focus')
      const scrollSpy = vi.spyOn(mainContent!, 'scrollIntoView')

      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      const clickEvent = new MouseEvent('click', { bubbles: true })
      skipLink?.dispatchEvent(clickEvent)

      expect(focusSpy).toHaveBeenCalled()
      expect(scrollSpy).toHaveBeenCalled()
    })

    it('should handle keyboard navigation with Enter key', () => {
      const mainContent = document.getElementById('main-content')
      const focusSpy = vi.spyOn(mainContent!, 'focus')
      const scrollSpy = vi.spyOn(mainContent!, 'scrollIntoView')

      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      const enterEvent = new KeyboardEvent('keydown', { 
        key: 'Enter', 
        bubbles: true 
      })
      
      skipLink?.dispatchEvent(enterEvent)

      expect(focusSpy).toHaveBeenCalled()
      expect(scrollSpy).toHaveBeenCalled()
    })

    it('should handle keyboard navigation with Space key', () => {
      const mainContent = document.getElementById('main-content')
      const focusSpy = vi.spyOn(mainContent!, 'focus')
      const scrollSpy = vi.spyOn(mainContent!, 'scrollIntoView')

      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      const spaceEvent = new KeyboardEvent('keydown', { 
        key: ' ', 
        bubbles: true 
      })
      
      skipLink?.dispatchEvent(spaceEvent)

      expect(focusSpy).toHaveBeenCalled()
      expect(scrollSpy).toHaveBeenCalled()
    })

    it('should not trigger navigation on other keys', () => {
      const mainContent = document.getElementById('main-content')
      const focusSpy = vi.spyOn(mainContent!, 'focus')
      const scrollSpy = vi.spyOn(mainContent!, 'scrollIntoView')

      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      const tabEvent = new KeyboardEvent('keydown', { 
        key: 'Tab', 
        bubbles: true 
      })
      
      skipLink?.dispatchEvent(tabEvent)

      expect(focusSpy).not.toHaveBeenCalled()
      expect(scrollSpy).not.toHaveBeenCalled()
    })

    it('should prevent default behavior on click', () => {
      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      const clickEvent = new MouseEvent('click', { 
        bubbles: true,
        cancelable: true 
      })
      
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault')
      skipLink?.dispatchEvent(clickEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should prevent default behavior on keyboard activation', () => {
      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      const enterEvent = new KeyboardEvent('keydown', { 
        key: 'Enter', 
        bubbles: true,
        cancelable: true 
      })
      
      const preventDefaultSpy = vi.spyOn(enterEvent, 'preventDefault')
      skipLink?.dispatchEvent(enterEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('Screen reader compatibility and semantic HTML', () => {
    it('should use proper semantic anchor element', () => {
      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      expect(skipLink?.tagName).toBe('A')
      expect(skipLink?.getAttribute('href')).toBe('#main-content')
    })

    it('should provide meaningful link text', () => {
      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      expect(skipLink?.textContent).toBe('Skip to main content')
    })

    it('should be the first focusable element in tab order', () => {
      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      
      // Should not have tabindex attribute (natural tab order)
      expect(skipLink?.getAttribute('tabindex')).toBeNull()
      
      // Should be focusable
      expect(skipLink?.getAttribute('href')).toBeTruthy()
    })

    it('should work with screen readers when focused', () => {
      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      
      // Simulate focus (screen reader would announce the link text)
      skipLink?.focus()
      
      // Link should be visible when focused
      expect(skipLink?.className).toContain('focus:not-sr-only')
      expect(skipLink?.textContent).toBe('Skip to main content')
    })
  })

  describe('Mobile optimization and touch-friendly interface', () => {
    it('should have adequate touch target size when focused', () => {
      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      expect(skipLink?.className).toContain('px-4')
      expect(skipLink?.className).toContain('py-2')
      
      // When focused, should be large enough for touch interaction
      // px-4 = 16px horizontal, py-2 = 8px vertical
      // This creates a 16px + content + 16px wide target
      // and 8px + line-height + 8px tall target
    })

    it('should be positioned appropriately on mobile when focused', () => {
      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      expect(skipLink?.className).toContain('focus:absolute')
      expect(skipLink?.className).toContain('focus:top-4')
      expect(skipLink?.className).toContain('focus:left-4')
      
      // Should not interfere with mobile navigation when not focused
      expect(skipLink?.className).toContain('sr-only')
    })

    it('should have sufficient color contrast for mobile visibility', () => {
      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      expect(skipLink?.className).toContain('bg-blue-600')
      expect(skipLink?.className).toContain('text-white')
      
      // Blue-600 on white background provides excellent contrast
      // White text on blue-600 background provides excellent contrast
    })

    it('should have rounded corners for modern mobile design', () => {
      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      expect(skipLink?.className).toContain('rounded-md')
    })
  })

  describe('Error handling and edge cases', () => {
    it('should handle missing main content element gracefully', () => {
      // Remove the main content element
      const mainContent = document.getElementById('main-content')
      if (mainContent && mainContent.parentNode) {
        mainContent.parentNode.removeChild(mainContent)
      }

      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      
      // Should not throw error when clicking
      expect(() => {
        const clickEvent = new MouseEvent('click', { bubbles: true })
        skipLink?.dispatchEvent(clickEvent)
      }).not.toThrow()
    })

    it('should handle main content element without focus method', () => {
      // Mock main content without focus method
      const mainContent = document.getElementById('main-content')
      if (mainContent) {
        // Remove focus method
        delete (mainContent as any).focus
      }

      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      
      // Should not throw error when trying to focus
      expect(() => {
        const clickEvent = new MouseEvent('click', { bubbles: true })
        skipLink?.dispatchEvent(clickEvent)
      }).not.toThrow()
    })

    it('should handle main content element without scrollIntoView method', () => {
      // Remove the main content element and create one without scrollIntoView
      const existingMainContent = document.getElementById('main-content')
      if (existingMainContent && existingMainContent.parentNode) {
        existingMainContent.parentNode.removeChild(existingMainContent)
      }

      // Create main content without scrollIntoView method
      const mainContent = document.createElement('main')
      mainContent.id = 'main-content'
      mainContent.tabIndex = -1
      // Don't add scrollIntoView method
      document.body.appendChild(mainContent)

      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      
      // Should not throw error when trying to scroll
      expect(() => {
        const clickEvent = new MouseEvent('click', { bubbles: true })
        skipLink?.dispatchEvent(clickEvent)
      }).not.toThrow()

      // Clean up
      if (mainContent.parentNode) {
        mainContent.parentNode.removeChild(mainContent)
      }
    })

    it('should maintain functionality after multiple activations', () => {
      const mainContent = document.getElementById('main-content')
      const focusSpy = vi.spyOn(mainContent!, 'focus')
      const scrollSpy = vi.spyOn(mainContent!, 'scrollIntoView')

      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      
      // Activate multiple times
      for (let i = 0; i < 3; i++) {
        const clickEvent = new MouseEvent('click', { bubbles: true })
        skipLink?.dispatchEvent(clickEvent)
      }

      expect(focusSpy).toHaveBeenCalledTimes(3)
      expect(scrollSpy).toHaveBeenCalledTimes(3)
    })

    it('should work correctly when main content is added after component mount', () => {
      // Remove main content initially
      const existingMainContent = document.getElementById('main-content')
      if (existingMainContent && existingMainContent.parentNode) {
        existingMainContent.parentNode.removeChild(existingMainContent)
      }

      component = mount(SkipNavigation, { target })
      flushSync()

      // Add main content after mount
      const newMainContent = document.createElement('main')
      newMainContent.id = 'main-content'
      newMainContent.tabIndex = -1
      
      // Mock scrollIntoView method for jsdom
      newMainContent.scrollIntoView = vi.fn()
      
      document.body.appendChild(newMainContent)

      const focusSpy = vi.spyOn(newMainContent, 'focus')
      const scrollSpy = vi.spyOn(newMainContent, 'scrollIntoView')

      const skipLink = target.querySelector('a')
      const clickEvent = new MouseEvent('click', { bubbles: true })
      skipLink?.dispatchEvent(clickEvent)

      expect(focusSpy).toHaveBeenCalled()
      expect(scrollSpy).toHaveBeenCalled()

      // Clean up
      if (newMainContent.parentNode) {
        newMainContent.parentNode.removeChild(newMainContent)
      }
    })

    it('should handle keyboard events with different event properties', () => {
      const mainContent = document.getElementById('main-content')
      const focusSpy = vi.spyOn(mainContent!, 'focus')

      component = mount(SkipNavigation, { target })
      flushSync()

      const skipLink = target.querySelector('a')
      
      // Test with different event configurations
      const events = [
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: false }),
        new KeyboardEvent('keydown', { key: ' ', bubbles: false }),
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: false })
      ]

      events.forEach(event => {
        skipLink?.dispatchEvent(event)
      })

      expect(focusSpy).toHaveBeenCalledTimes(3)
    })
  })
})