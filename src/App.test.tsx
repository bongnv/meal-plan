import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import App from './App'

describe('App', () => {
  it('renders the app title', () => {
    render(<App />)
    expect(screen.getByText('Meal Plan')).toBeInTheDocument()
  })

  it('renders the app description', () => {
    render(<App />)
    expect(
      screen.getByText('Your recipe and meal planning companion')
    ).toBeInTheDocument()
  })
})
