import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ServicesProvider } from '@/contexts/ServicesContext'

import { CreateRecipePage } from './CreateRecipePage'

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ServicesProvider>
      <MantineProvider>
        <MemoryRouter>{component}</MemoryRouter>
      </MantineProvider>
    </ServicesProvider>
  )
}

describe('CreateRecipePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render create recipe page with form', () => {
    renderWithProviders(<CreateRecipePage />)

    expect(
      screen.getByRole('heading', { name: /create new recipe/i })
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/enter recipe name/i)
    ).toBeInTheDocument()
  })

  it('should render cancel button', () => {
    renderWithProviders(<CreateRecipePage />)

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('should render create button', () => {
    renderWithProviders(<CreateRecipePage />)

    expect(
      screen.getByRole('button', { name: /^create$/i })
    ).toBeInTheDocument()
  })
})
