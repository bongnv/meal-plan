import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Mock window.matchMedia for Mantine components
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  })

  // Mock ResizeObserver for Mantine Select component
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // Mock scrollIntoView for Mantine Combobox component
  Element.prototype.scrollIntoView = () => {}
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})
