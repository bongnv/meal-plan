/**
 * Converts decimal quantities to fraction strings for better readability
 * Examples: 0.5 -> "1/2", 0.33 -> "1/3", 1.5 -> "1 1/2"
 */

interface Fraction {
  decimal: number
  fraction: string
  tolerance: number // How close the decimal needs to be
}

// Common fractions used in cooking
const COMMON_FRACTIONS: Fraction[] = [
  { decimal: 0.125, fraction: '1/8', tolerance: 0.01 },
  { decimal: 0.25, fraction: '1/4', tolerance: 0.01 },
  { decimal: 0.333, fraction: '1/3', tolerance: 0.01 },
  { decimal: 0.375, fraction: '3/8', tolerance: 0.01 },
  { decimal: 0.5, fraction: '1/2', tolerance: 0.01 },
  { decimal: 0.625, fraction: '5/8', tolerance: 0.01 },
  { decimal: 0.666, fraction: '2/3', tolerance: 0.01 },
  { decimal: 0.75, fraction: '3/4', tolerance: 0.01 },
  { decimal: 0.875, fraction: '7/8', tolerance: 0.01 },
]

/**
 * Formats a quantity as a fraction string if it matches a common fraction,
 * otherwise returns the decimal with appropriate precision
 *
 * @param quantity The numeric quantity to format
 * @returns Formatted string (e.g., "1/2", "1 1/4", "2.5")
 */
export function formatQuantity(quantity: number): string {
  if (quantity === 0) return '0'

  // Extract whole number part and decimal part
  const wholePart = Math.floor(quantity)
  const decimalPart = quantity - wholePart

  // If no decimal part, just return the whole number
  if (decimalPart < 0.001) {
    return wholePart.toString()
  }

  // Try to match the decimal part to a common fraction
  for (const frac of COMMON_FRACTIONS) {
    if (Math.abs(decimalPart - frac.decimal) < frac.tolerance) {
      if (wholePart === 0) {
        return frac.fraction
      } else {
        return `${wholePart} ${frac.fraction}`
      }
    }
  }

  // No fraction match found, use decimal
  // Use appropriate decimal places based on magnitude
  if (quantity < 10) {
    return quantity.toFixed(2).replace(/\.?0+$/, '')
  } else if (quantity < 100) {
    return quantity.toFixed(1).replace(/\.?0+$/, '')
  } else {
    return Math.round(quantity).toString()
  }
}
