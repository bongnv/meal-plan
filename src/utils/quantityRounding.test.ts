import { describe, expect, it } from 'vitest'

import { roundQuantity } from './quantityRounding'

describe('roundQuantity', () => {
  describe('Whole number units (pieces, counts)', () => {
    it('should round up to whole number for piece', () => {
      expect(roundQuantity(2.3, 'piece')).toBe(3)
      expect(roundQuantity(2.1, 'piece')).toBe(3)
      expect(roundQuantity(2.9, 'piece')).toBe(3)
    })

    it('should round up to whole number for clove', () => {
      expect(roundQuantity(3.2, 'clove')).toBe(4)
      expect(roundQuantity(3.8, 'clove')).toBe(4)
    })

    it('should round up to whole number for slice', () => {
      expect(roundQuantity(5.4, 'slice')).toBe(6)
    })

    it('should round up to whole number for can', () => {
      expect(roundQuantity(1.1, 'can')).toBe(2)
    })

    it('should round up to whole number for package', () => {
      expect(roundQuantity(2.5, 'package')).toBe(3)
    })
  })

  describe('Volume units (cups, spoons)', () => {
    it('should round to nearest 0.25 for cup', () => {
      expect(roundQuantity(1.1, 'cup')).toBe(1)
      expect(roundQuantity(1.15, 'cup')).toBe(1.25)
      expect(roundQuantity(1.3, 'cup')).toBe(1.25)
      expect(roundQuantity(1.4, 'cup')).toBe(1.5)
      expect(roundQuantity(1.6, 'cup')).toBe(1.5)
      expect(roundQuantity(1.7, 'cup')).toBe(1.75)
      expect(roundQuantity(1.9, 'cup')).toBe(2)
    })

    it('should round to nearest 0.25 for tablespoon', () => {
      expect(roundQuantity(2.1, 'tablespoon')).toBe(2)
      expect(roundQuantity(2.2, 'tablespoon')).toBe(2.25)
      expect(roundQuantity(2.4, 'tablespoon')).toBe(2.5)
    })

    it('should round to nearest 0.25 for teaspoon', () => {
      expect(roundQuantity(3.3, 'teaspoon')).toBe(3.25)
      expect(roundQuantity(3.6, 'teaspoon')).toBe(3.5)
    })
  })

  describe('Weight units (grams, kilograms)', () => {
    it('should round to nearest 50g for gram', () => {
      expect(roundQuantity(120, 'gram')).toBe(100)
      expect(roundQuantity(130, 'gram')).toBe(150)
      expect(roundQuantity(175, 'gram')).toBe(200)
      expect(roundQuantity(224, 'gram')).toBe(200)
      expect(roundQuantity(225, 'gram')).toBe(250)
    })

    it('should round to nearest 50g for kilogram', () => {
      expect(roundQuantity(1.2, 'kilogram')).toBe(1.2)
      expect(roundQuantity(1.23, 'kilogram')).toBe(1.25)
      expect(roundQuantity(1.27, 'kilogram')).toBe(1.25)
    })
  })

  describe('Volume liquid units (ml, liters)', () => {
    it('should round to nearest 50ml for milliliter', () => {
      expect(roundQuantity(120, 'milliliter')).toBe(100)
      expect(roundQuantity(130, 'milliliter')).toBe(150)
      expect(roundQuantity(175, 'milliliter')).toBe(200)
    })

    it('should round to nearest 50ml for liter', () => {
      expect(roundQuantity(1.23, 'liter')).toBe(1.25)
      expect(roundQuantity(1.27, 'liter')).toBe(1.25)
    })
  })

  describe('Other units (default rounding)', () => {
    it('should round to 1 decimal place for pinch', () => {
      expect(roundQuantity(1.23, 'pinch')).toBe(1.2)
      expect(roundQuantity(1.27, 'pinch')).toBe(1.3)
    })

    it('should round to 1 decimal place for dash', () => {
      expect(roundQuantity(2.45, 'dash')).toBe(2.5)
    })
  })

  describe('Edge cases', () => {
    it('should handle zero quantity', () => {
      expect(roundQuantity(0, 'gram')).toBe(0)
      expect(roundQuantity(0, 'cup')).toBe(0)
      expect(roundQuantity(0, 'piece')).toBe(0)
    })

    it('should handle very small quantities', () => {
      expect(roundQuantity(0.1, 'teaspoon')).toBe(0.25)
      expect(roundQuantity(0.01, 'gram')).toBe(50)
    })

    it('should handle negative quantities (treat as zero)', () => {
      expect(roundQuantity(-5, 'gram')).toBe(0)
      expect(roundQuantity(-1, 'cup')).toBe(0)
    })
  })
})
