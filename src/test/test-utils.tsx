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

function render(ui: ReactElement, options?: RenderOptions) {
  return rtlRender(ui, {
    wrapper: ({ children }) => <MantineProvider>{children}</MantineProvider>,
    ...options,
  })
}

// Export commonly used testing utilities
export { render, screen, waitFor, within, fireEvent }
export type { RenderOptions }
