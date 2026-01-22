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

// Helper to render with providers - components need to set up their own context mocks
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <MantineProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </MantineProvider>
    ),
    ...options,
  })
}

// Export commonly used testing utilities
export { render, screen, waitFor, within, fireEvent }
export type { RenderOptions }
