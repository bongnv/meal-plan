import type { Unit } from '@/types/ingredient'

/**
 * Conversion ratios for unit consolidation
 * Maps from smaller unit to larger unit with conversion factor
 */
interface UnitConversionRule {
  smallerUnit: Unit
  largerUnit: Unit
  factor: number // multiply by this to convert from smaller to larger
}

const CONVERSION_RULES: UnitConversionRule[] = [
  { smallerUnit: 'gram', largerUnit: 'kilogram', factor: 0.001 },
  { smallerUnit: 'milliliter', largerUnit: 'liter', factor: 0.001 },
]

/**
 * Consolidates quantity and unit to use the larger unit when beneficial.
 * For example: 1000g becomes 1kg, 1500ml becomes 1.5L
 *
 * @param quantity The quantity value
 * @param unit The current unit
 * @returns Tuple of [consolidated quantity, consolidated unit]
 */
export function consolidateUnit(quantity: number, unit: Unit): [number, Unit] {
  // Find applicable conversion rule
  const rule = CONVERSION_RULES.find(r => r.smallerUnit === unit)

  if (!rule) {
    // No conversion available for this unit
    return [quantity, unit]
  }

  // Convert to larger unit
  const convertedQuantity = quantity * rule.factor

  // Use larger unit if conversion results in a value >= 1
  // This makes the quantity more readable (e.g., 1kg instead of 1000g)
  if (convertedQuantity >= 1) {
    return [convertedQuantity, rule.largerUnit]
  }

  // Keep original unit and quantity if conversion would result in < 1
  return [quantity, unit]
}

/**
 * Normalizes a unit to a standard form for ingredient consolidation.
 * Groups equivalent units together so they can be combined.
 * For example: gram and kilogram both normalize to 'gram'
 *
 * @param unit The unit to normalize
 * @returns The normalized unit
 */
export function normalizeUnitForConsolidation(unit: Unit): Unit {
  // Weight units normalize to gram
  if (unit === 'kilogram') return 'gram'

  // Volume units normalize to milliliter
  if (unit === 'liter') return 'milliliter'

  // Other units stay as-is
  return unit
}

/**
 * Converts a quantity from one unit to another (within the same category).
 * For example: converts 1kg to 1000g, 1L to 1000ml
 *
 * @param quantity The quantity to convert
 * @param fromUnit The source unit
 * @param toUnit The target unit
 * @returns The converted quantity, or original quantity if units are incompatible
 */
export function convertQuantity(
  quantity: number,
  fromUnit: Unit,
  toUnit: Unit
): number {
  // If units are the same, no conversion needed
  if (fromUnit === toUnit) return quantity

  // Weight conversion
  if (
    (fromUnit === 'gram' && toUnit === 'kilogram') ||
    (fromUnit === 'kilogram' && toUnit === 'gram')
  ) {
    return fromUnit === 'gram' ? quantity * 0.001 : quantity * 1000
  }

  // Volume conversion
  if (
    (fromUnit === 'milliliter' && toUnit === 'liter') ||
    (fromUnit === 'liter' && toUnit === 'milliliter')
  ) {
    return fromUnit === 'milliliter' ? quantity * 0.001 : quantity * 1000
  }

  // Incompatible units - return original
  return quantity
}
