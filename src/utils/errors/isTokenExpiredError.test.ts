import { describe, it, expect } from 'vitest'

import { isTokenExpiredError } from './isTokenExpiredError'
import { TokenExpiredError } from './TokenExpiredError'

describe('isTokenExpiredError', () => {
  it('should return true for TokenExpiredError instance', () => {
    const error = new TokenExpiredError('Token has expired')
    expect(isTokenExpiredError(error)).toBe(true)
  })

  it('should return true for Error with "Session expired" message', () => {
    const error = new Error('Session expired')
    expect(isTokenExpiredError(error)).toBe(true)
  })

  it('should return true for Error containing "Session expired" in message', () => {
    const error = new Error('Error: Session expired - please log in again')
    expect(isTokenExpiredError(error)).toBe(true)
  })

  it('should return false for regular Error without session expired message', () => {
    const error = new Error('Something went wrong')
    expect(isTokenExpiredError(error)).toBe(false)
  })

  it('should return false for non-Error objects', () => {
    expect(isTokenExpiredError('string error')).toBe(false)
    expect(isTokenExpiredError({ message: 'Session expired' })).toBe(false)
    expect(isTokenExpiredError(null)).toBe(false)
    expect(isTokenExpiredError(undefined)).toBe(false)
    expect(isTokenExpiredError(123)).toBe(false)
  })
})
