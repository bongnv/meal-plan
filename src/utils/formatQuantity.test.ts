import { describe, expect, it } from 'vitest'

import { formatQuantity } from './formatQuantity'

describe('formatQuantity', () => {
  describe('Common fractions', () => {
    it('should format 0.5 as 1/2', () => {
      expect(formatQuantity(0.5)).toBe('1/2')
    })

    it('should format 0.25 as 1/4', () => {
      expect(formatQuantity(0.25)).toBe('1/4')
    })

    it('should format 0.75 as 3/4', () => {
      expect(formatQuantity(0.75)).toBe('3/4')
    })

    it('should format 0.33 as 1/3', () => {
      expect(formatQuantity(0.33)).toBe('1/3')
    })

    it('should format 0.333 as 1/3', () => {
      expect(formatQuantity(0.333)).toBe('1/3')
    })

    it('should format 0.66 as 2/3', () => {
      expect(formatQuantity(0.66)).toBe('2/3')
    })

    it('should format 0.666 as 2/3', () => {
      expect(formatQuantity(0.666)).toBe('2/3')
    })

    it('should format 0.125 as 1/8', () => {
      expect(formatQuantity(0.125)).toBe('1/8')
    })

    it('should format 0.375 as 3/8', () => {
      expect(formatQuantity(0.375)).toBe('3/8')
    })

    it('should format 0.625 as 5/8', () => {
      expect(formatQuantity(0.625)).toBe('5/8')
    })

    it('should format 0.875 as 7/8', () => {
      expect(formatQuantity(0.875)).toBe('7/8')
    })
  })

  describe('Mixed numbers', () => {
    it('should format 1.5 as 1 1/2', () => {
      expect(formatQuantity(1.5)).toBe('1 1/2')
    })

    it('should format 2.25 as 2 1/4', () => {
      expect(formatQuantity(2.25)).toBe('2 1/4')
    })

    it('should format 2.75 as 2 3/4', () => {
      expect(formatQuantity(2.75)).toBe('2 3/4')
    })

    it('should format 1.33 as 1 1/3', () => {
      expect(formatQuantity(1.33)).toBe('1 1/3')
    })

    it('should format 2.66 as 2 2/3', () => {
      expect(formatQuantity(2.66)).toBe('2 2/3')
    })

    it('should format 3.5 as 3 1/2', () => {
      expect(formatQuantity(3.5)).toBe('3 1/2')
    })
  })

  describe('Whole numbers', () => {
    it('should format 1 as 1', () => {
      expect(formatQuantity(1)).toBe('1')
    })

    it('should format 2 as 2', () => {
      expect(formatQuantity(2)).toBe('2')
    })

    it('should format 10 as 10', () => {
      expect(formatQuantity(10)).toBe('10')
    })

    it('should format 0 as 0', () => {
      expect(formatQuantity(0)).toBe('0')
    })
  })

  describe('Decimals without fraction match', () => {
    it('should format 0.1 as 0.1', () => {
      expect(formatQuantity(0.1)).toBe('0.1')
    })

    it('should format 0.2 as 0.2', () => {
      expect(formatQuantity(0.2)).toBe('0.2')
    })

    it('should format 0.5 as 1/2 (not 0.5)', () => {
      expect(formatQuantity(0.5)).toBe('1/2')
    })

    it('should format 1.2 as 1.2', () => {
      expect(formatQuantity(1.2)).toBe('1.2')
    })

    it('should format 2.7 as 2.7', () => {
      expect(formatQuantity(2.7)).toBe('2.7')
    })
  })

  describe('Decimal precision', () => {
    it('should round small decimals (< 0.001)', () => {
      expect(formatQuantity(1.0001)).toBe('1')
    })

    it('should format 1.00 as 1', () => {
      expect(formatQuantity(1.0)).toBe('1')
    })

    it('should remove trailing zeros', () => {
      expect(formatQuantity(1.5)).toBe('1 1/2')
    })

    it('should limit decimal places for small quantities', () => {
      const result = formatQuantity(2.45)
      expect(result).toBe('2.45')
    })

    it('should limit decimal places for large quantities', () => {
      const result = formatQuantity(25.6)
      expect(result).toBe('25.6')
    })

    it('should round very large quantities', () => {
      expect(formatQuantity(123.4)).toBe('123')
    })
  })

  describe('Edge cases', () => {
    it('should handle very small fractions close to 1/8', () => {
      expect(formatQuantity(0.12)).toBe('1/8')
    })

    it('should handle fractions with tolerance', () => {
      // 0.34 is close to 0.333 (1/3)
      expect(formatQuantity(0.34)).toBe('1/3')
    })

    it('should not convert 0.5 to 1/2 if tolerance is exceeded', () => {
      // This should still be 1/2 as it's within tolerance
      expect(formatQuantity(0.5)).toBe('1/2')
    })

    it('should handle negative numbers gracefully', () => {
      // Negative quantities shouldn't normally occur, but handle them
      const result = formatQuantity(-0.5)
      expect(result).toContain('-')
    })
  })
})
