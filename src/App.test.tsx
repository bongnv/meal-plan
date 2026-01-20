import { describe, it, expect } from 'vitest'

import App from './App'
import { render, screen } from './test/test-utils'

describe('App', () => {
  it('renders the app with heading', () => {
    render(<App />)
    expect(screen.getByText('Meal Plan')).toBeInTheDocument()
  })

  it('renders the heading as h1', () => {
    render(<App />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Meal Plan')
  })
})
