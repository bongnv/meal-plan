import { MantineProvider } from '@mantine/core'
import {
  render as rtlRender,
  RenderOptions,
  screen,
  waitFor,
  within,
  fireEvent,
} from '@testing-library/react'
import { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { ServicesProvider } from '@/contexts/ServicesContext'

// Default render - just Mantine (for tests that mock services themselves)
function render(ui: ReactElement, options?: RenderOptions) {
  return rtlRender(ui, {
    wrapper: ({ children }) => <MantineProvider>{children}</MantineProvider>,
    ...options,
  })
}

// Helper to render components that need Mantine but not routing or contexts
export function renderWithMantine(ui: ReactElement, options?: RenderOptions) {
  return rtlRender(ui, {
    wrapper: ({ children }) => <MantineProvider>{children}</MantineProvider>,
    ...options,
  })
}

// Helper to render with all providers - includes ServicesProvider, MantineProvider, and MemoryRouter
// Use this for integration tests that need real services
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <ServicesProvider>
        <MantineProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </MantineProvider>
      </ServicesProvider>
    ),
    ...options,
  })
}

// Export commonly used testing utilities
export { render, screen, waitFor, within, fireEvent }
export type { RenderOptions }
