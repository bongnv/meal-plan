import type { Unit } from '@/types/ingredient'

/**
 * Apply smart rounding to ingredient quantities based on unit type.
 * Makes grocery list quantities more user-friendly and practical.
 */
export function roundQuantity(quantity: number, unit: Unit): number {
  // Handle negative quantities
  if (quantity < 0) return 0

  // Handle zero
  if (quantity === 0) return 0

  // Whole number units (piece, clove, slice, can, package) - round up
  const wholeNumberUnits: Unit[] = ['piece', 'clove', 'slice', 'can', 'package']
  if (wholeNumberUnits.includes(unit)) {
    return Math.ceil(quantity)
  }

  // Volume units (cup, tablespoon, teaspoon) - round to nearest 0.25
  const volumeUnits: Unit[] = ['cup', 'tablespoon', 'teaspoon']
  if (volumeUnits.includes(unit)) {
    const rounded = Math.round(quantity * 4) / 4
    // For very small quantities, round up to minimum 0.25
    return rounded < 0.25 && quantity > 0 ? 0.25 : rounded
  }

  // Weight units (gram, kilogram) - round to nearest 50g equivalent
  if (unit === 'gram') {
    // Round to nearest 50g
    const rounded = Math.round(quantity / 50) * 50
    // For very small quantities, round up to minimum 50g
    return rounded === 0 && quantity > 0 ? 50 : rounded
  }

  if (unit === 'kilogram') {
    // Round to nearest 0.05 (equivalent to 50g for kg)
    return Math.round(quantity * 20) / 20
  }

  // Volume liquid units (milliliter, liter) - round to nearest 50ml equivalent
  if (unit === 'milliliter') {
    // Round to nearest 50ml
    return Math.round(quantity / 50) * 50
  }

  if (unit === 'liter') {
    // Round to nearest 0.05L (50ml)
    return Math.round(quantity * 20) / 20
  }

  // Other units (pinch, dash, to-taste, etc.) - round to 1 decimal place
  return Math.round(quantity * 10) / 10
}
