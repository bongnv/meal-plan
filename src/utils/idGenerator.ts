/**
 * Generate a unique ID
 * Format: timestamp-random
 * Used across all storage services for consistent ID generation
 */
export function generateId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `${timestamp}-${random}`
}
