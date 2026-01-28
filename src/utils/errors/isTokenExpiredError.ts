import { TokenExpiredError } from './TokenExpiredError'

/**
 * Check if an error indicates an expired authentication token
 * Handles both direct TokenExpiredError instances and wrapped errors
 * from external APIs (e.g., Graph API) that include "Session expired" in message
 *
 * @param error - Error to check
 * @returns true if token is expired, false otherwise
 */
export function isTokenExpiredError(error: unknown): boolean {
  return (
    error instanceof TokenExpiredError ||
    (error instanceof Error && error.message.includes('Session expired'))
  )
}
