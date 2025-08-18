import { expect, vi } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import '@testing-library/jest-dom/vitest'

expect.extend(matchers)

// Mock browser APIs
Object.defineProperty(globalThis, 'navigator', {
  value: {
    onLine: true
  },
  writable: true
})

// Mock SvelteKit runtime environment
Object.defineProperty(globalThis, '__SVELTEKIT_PAYLOAD__', {
  value: { data: {} },
  writable: true
})

// Mock SvelteKit stores
vi.mock('$app/stores', () => {
  const mockPage = {
    url: new URL('http://localhost:3000/'),
    params: {},
    route: { id: null },
    status: 200,
    error: null,
    data: {},
    form: null
  }
  
  return {
    page: {
      subscribe: vi.fn((callback) => {
        callback(mockPage)
        return vi.fn()
      })
    },
    navigating: {
      subscribe: vi.fn((callback) => {
        callback(null)
        return vi.fn()
      })
    },
    updated: {
      subscribe: vi.fn((callback) => {
        callback(false)
        return vi.fn()
      })
    }
  }
})

// Mock SvelteKit environment
vi.mock('$app/environment', () => ({
  browser: true, // Set to true for testing browser-specific functionality
  dev: true,
  building: false,
  version: '1.0.0'
}))