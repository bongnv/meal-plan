import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'

import App from './App'
import { CloudStorageProvider } from './contexts/CloudStorageContext'
import { SyncProvider } from './contexts/SyncContext'

import type { ReactNode } from 'react'

// Mock MSAL React
vi.mock('@azure/msal-react', () => ({
  MsalProvider: async ({ children }: { children: ReactNode }) => children,
  useMsal: () => ({
    instance: {
      getAllAccounts: vi.fn(() => []),
      loginPopup: vi.fn(),
      logoutPopup: vi.fn(),
      acquireTokenSilent: vi.fn(),
    },
    inProgress: 'none',
  }),
  useMsalAuthentication: () => ({
    login: vi.fn(),
    result: null,
    error: null,
  }),
}))

// Mock the recipe pages
vi.mock('./pages/recipes/CreateRecipePage', () => ({
  CreateRecipePage: () => <div>Create Recipe Page</div>,
}))

vi.mock('./pages/recipes/EditRecipePage', () => ({
  EditRecipePage: () => <div>Edit Recipe Page</div>,
}))

// Mock dexie-react-hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => []),
}))

const renderApp = (initialRoute: string = '/') => {
  return render(
    <CloudStorageProvider>
      <SyncProvider>
        <MantineProvider>
          <MemoryRouter initialEntries={[initialRoute]}>
            <App />
          </MemoryRouter>
        </MantineProvider>
      </SyncProvider>
    </CloudStorageProvider>
  )
}

describe('App', () => {
  it('should render home page at root route', () => {
    renderApp('/')

    // Check for navigation header
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    // Check for home page content (Next Meal section)
    expect(screen.getByText(/Next Meal/i)).toBeInTheDocument()
  })

  it('should render create recipe page at /recipes/new', () => {
    renderApp('/recipes/new')

    expect(screen.getByText(/create recipe page/i)).toBeInTheDocument()
  })

  it('should render edit recipe page at /recipes/:id/edit', () => {
    renderApp('/recipes/123/edit')

    expect(screen.getByText(/edit recipe page/i)).toBeInTheDocument()
  })
})
