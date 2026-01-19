import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import App from './App'

describe('App', () => {
  it('renders the recipe list page by default', () => {
    render(<App />)
    // Should render the recipes page header
    expect(screen.getByText('My Recipes')).toBeInTheDocument()
  })

  it('renders the new recipe button', () => {
    render(<App />)
    expect(screen.getByText('+ New Recipe')).toBeInTheDocument()
  })
})
