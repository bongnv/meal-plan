/**
 * Helper to add timestamps to test objects
 * Usage: Add this at top of test files that need it
 */

export const withTimestamps = <T extends object>(
  obj: T
): T & { createdAt: number; updatedAt: number } => ({
  ...obj,
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

export const NOW = Date.now()
