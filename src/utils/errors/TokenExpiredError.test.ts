import { describe, it, expect } from 'vitest'

import { TokenExpiredError } from './TokenExpiredError'

describe('TokenExpiredError', () => {
  it('should create error with default message', () => {
    const error = new TokenExpiredError()

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(TokenExpiredError)
    expect(error.name).toBe('TokenExpiredError')
    expect(error.message).toBe(
      'Token expired. Please reconnect to continue syncing.'
    )
  })

  it('should create error with custom message', () => {
    const customMessage = 'Custom token expiration message'
    const error = new TokenExpiredError(customMessage)

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(TokenExpiredError)
    expect(error.name).toBe('TokenExpiredError')
    expect(error.message).toBe(customMessage)
  })

  it('should be catchable as Error', () => {
    try {
      throw new TokenExpiredError()
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(TokenExpiredError)
    }
  })

  it('should be catchable as TokenExpiredError specifically', () => {
    try {
      throw new TokenExpiredError('Session expired')
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        expect(error.message).toBe('Session expired')
      } else {
        throw new Error('Should have caught TokenExpiredError')
      }
    }
  })
})
