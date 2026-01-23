import { describe, expect, it } from 'vitest'

import {
  consolidateUnit,
  convertQuantity,
  normalizeUnitForConsolidation,
} from './unitConversion'

describe('unitConversion', () => {
  describe('consolidateUnit', () => {
    describe('Weight conversion (gram to kilogram)', () => {
      it('should convert 1000g to 1kg', () => {
        const [quantity, unit] = consolidateUnit(1000, 'gram')
        expect(quantity).toBe(1)
        expect(unit).toBe('kilogram')
      })

      it('should convert 1500g to 1.5kg', () => {
        const [quantity, unit] = consolidateUnit(1500, 'gram')
        expect(quantity).toBe(1.5)
        expect(unit).toBe('kilogram')
      })

      it('should convert 2500g to 2.5kg', () => {
        const [quantity, unit] = consolidateUnit(2500, 'gram')
        expect(quantity).toBe(2.5)
        expect(unit).toBe('kilogram')
      })

      it('should keep 500g as grams (< 1kg)', () => {
        const [quantity, unit] = consolidateUnit(500, 'gram')
        expect(quantity).toBe(500)
        expect(unit).toBe('gram')
      })

      it('should keep 999g as grams (< 1kg)', () => {
        const [quantity, unit] = consolidateUnit(999, 'gram')
        expect(quantity).toBe(999)
        expect(unit).toBe('gram')
      })

      it('should keep kilogram as-is', () => {
        const [quantity, unit] = consolidateUnit(2, 'kilogram')
        expect(quantity).toBe(2)
        expect(unit).toBe('kilogram')
      })
    })

    describe('Volume conversion (milliliter to liter)', () => {
      it('should convert 1000ml to 1L', () => {
        const [quantity, unit] = consolidateUnit(1000, 'milliliter')
        expect(quantity).toBe(1)
        expect(unit).toBe('liter')
      })

      it('should convert 1500ml to 1.5L', () => {
        const [quantity, unit] = consolidateUnit(1500, 'milliliter')
        expect(quantity).toBe(1.5)
        expect(unit).toBe('liter')
      })

      it('should convert 2000ml to 2L', () => {
        const [quantity, unit] = consolidateUnit(2000, 'milliliter')
        expect(quantity).toBe(2)
        expect(unit).toBe('liter')
      })

      it('should keep 500ml as milliliters (< 1L)', () => {
        const [quantity, unit] = consolidateUnit(500, 'milliliter')
        expect(quantity).toBe(500)
        expect(unit).toBe('milliliter')
      })

      it('should keep 999ml as milliliters (< 1L)', () => {
        const [quantity, unit] = consolidateUnit(999, 'milliliter')
        expect(quantity).toBe(999)
        expect(unit).toBe('milliliter')
      })

      it('should keep liter as-is', () => {
        const [quantity, unit] = consolidateUnit(1.5, 'liter')
        expect(quantity).toBe(1.5)
        expect(unit).toBe('liter')
      })
    })

    describe('Other units (no conversion)', () => {
      it('should keep cup as-is', () => {
        const [quantity, unit] = consolidateUnit(3, 'cup')
        expect(quantity).toBe(3)
        expect(unit).toBe('cup')
      })

      it('should keep tablespoon as-is', () => {
        const [quantity, unit] = consolidateUnit(5, 'tablespoon')
        expect(quantity).toBe(5)
        expect(unit).toBe('tablespoon')
      })

      it('should keep piece as-is', () => {
        const [quantity, unit] = consolidateUnit(2, 'piece')
        expect(quantity).toBe(2)
        expect(unit).toBe('piece')
      })
    })
  })

  describe('normalizeUnitForConsolidation', () => {
    it('should normalize kilogram to gram', () => {
      expect(normalizeUnitForConsolidation('kilogram')).toBe('gram')
    })

    it('should normalize liter to milliliter', () => {
      expect(normalizeUnitForConsolidation('liter')).toBe('milliliter')
    })

    it('should keep gram as-is', () => {
      expect(normalizeUnitForConsolidation('gram')).toBe('gram')
    })

    it('should keep milliliter as-is', () => {
      expect(normalizeUnitForConsolidation('milliliter')).toBe('milliliter')
    })

    it('should keep cup as-is', () => {
      expect(normalizeUnitForConsolidation('cup')).toBe('cup')
    })

    it('should keep piece as-is', () => {
      expect(normalizeUnitForConsolidation('piece')).toBe('piece')
    })
  })

  describe('convertQuantity', () => {
    describe('Weight conversions', () => {
      it('should convert gram to kilogram', () => {
        expect(convertQuantity(1000, 'gram', 'kilogram')).toBe(1)
        expect(convertQuantity(500, 'gram', 'kilogram')).toBe(0.5)
        expect(convertQuantity(2500, 'gram', 'kilogram')).toBe(2.5)
      })

      it('should convert kilogram to gram', () => {
        expect(convertQuantity(1, 'kilogram', 'gram')).toBe(1000)
        expect(convertQuantity(0.5, 'kilogram', 'gram')).toBe(500)
        expect(convertQuantity(2.5, 'kilogram', 'gram')).toBe(2500)
      })
    })

    describe('Volume conversions', () => {
      it('should convert milliliter to liter', () => {
        expect(convertQuantity(1000, 'milliliter', 'liter')).toBe(1)
        expect(convertQuantity(500, 'milliliter', 'liter')).toBe(0.5)
        expect(convertQuantity(2500, 'milliliter', 'liter')).toBe(2.5)
      })

      it('should convert liter to milliliter', () => {
        expect(convertQuantity(1, 'liter', 'milliliter')).toBe(1000)
        expect(convertQuantity(0.5, 'liter', 'milliliter')).toBe(500)
        expect(convertQuantity(1.5, 'liter', 'milliliter')).toBe(1500)
      })
    })

    describe('Same unit (no conversion)', () => {
      it('should return same quantity for same unit', () => {
        expect(convertQuantity(100, 'gram', 'gram')).toBe(100)
        expect(convertQuantity(2, 'kilogram', 'kilogram')).toBe(2)
        expect(convertQuantity(500, 'milliliter', 'milliliter')).toBe(500)
        expect(convertQuantity(1.5, 'liter', 'liter')).toBe(1.5)
        expect(convertQuantity(3, 'cup', 'cup')).toBe(3)
      })
    })

    describe('Incompatible units', () => {
      it('should return original quantity for incompatible units', () => {
        expect(convertQuantity(100, 'gram', 'cup')).toBe(100)
        expect(convertQuantity(500, 'milliliter', 'tablespoon')).toBe(500)
        expect(convertQuantity(2, 'piece', 'gram')).toBe(2)
      })
    })
  })
})
