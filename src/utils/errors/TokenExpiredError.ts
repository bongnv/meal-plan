/**
 * Custom error thrown when OAuth token has expired
 * Used to trigger reconnect dialog in the UI
 */
export class TokenExpiredError extends Error {
  constructor(
    message = 'Token expired. Please reconnect to continue syncing.'
  ) {
    super(message)
    this.name = 'TokenExpiredError'
  }
}
