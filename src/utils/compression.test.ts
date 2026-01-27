import { describe, it, expect } from 'vitest'

import { compressData, decompressData } from './compression'

describe('compression utilities', () => {
  describe('compressData', () => {
    it('should compress a simple string', async () => {
      const data = 'Hello, World!'
      const compressed = await compressData(data)

      expect(compressed).toBeInstanceOf(Blob)
      expect(compressed.size).toBeGreaterThan(0)
      // Compressed size might be larger for very small strings due to gzip overhead
      expect(compressed.type).toBe('application/octet-stream')
    })

    it('should compress JSON data', async () => {
      const data = JSON.stringify({
        name: 'Test Recipe',
        ingredients: ['flour', 'sugar', 'eggs'],
        servings: 4,
      })
      const compressed = await compressData(data)

      expect(compressed).toBeInstanceOf(Blob)
      expect(compressed.size).toBeGreaterThan(0)
    })

    it('should compress large data more efficiently', async () => {
      // Create a large string with repetitive data (compresses well)
      const largeData = JSON.stringify({
        items: Array(1000)
          .fill(null)
          .map((_, i) => ({
            id: i,
            name: `Item ${i}`,
            description: 'This is a test item with some repetitive content',
          })),
      })

      const compressed = await compressData(largeData)

      expect(compressed).toBeInstanceOf(Blob)
      expect(compressed.size).toBeGreaterThan(0)
      // For repetitive data, compressed should be much smaller
      expect(compressed.size).toBeLessThan(largeData.length)
    })

    it('should compress empty string', async () => {
      const data = ''
      const compressed = await compressData(data)

      expect(compressed).toBeInstanceOf(Blob)
      expect(compressed.size).toBeGreaterThan(0) // gzip header is still present
    })

    it('should handle special characters', async () => {
      const data = '{"emoji":"🍕","unicode":"日本語","special":"<>&\\"\'"}'
      const compressed = await compressData(data)

      expect(compressed).toBeInstanceOf(Blob)
      expect(compressed.size).toBeGreaterThan(0)
    })
  })

  describe('decompressData', () => {
    it('should decompress data compressed by compressData', async () => {
      const original = 'Hello, World!'
      const compressed = await compressData(original)
      const decompressed = await decompressData(compressed.stream())

      expect(decompressed).toBe(original)
    })

    it('should decompress JSON data', async () => {
      const original = JSON.stringify({
        name: 'Test Recipe',
        ingredients: ['flour', 'sugar', 'eggs'],
        servings: 4,
      })
      const compressed = await compressData(original)
      const decompressed = await decompressData(compressed.stream())

      expect(decompressed).toBe(original)
      expect(JSON.parse(decompressed)).toEqual(JSON.parse(original))
    })

    it('should decompress large data', async () => {
      const original = JSON.stringify({
        items: Array(1000)
          .fill(null)
          .map((_, i) => ({
            id: i,
            name: `Item ${i}`,
            description: 'This is a test item',
          })),
      })
      const compressed = await compressData(original)
      const decompressed = await decompressData(compressed.stream())

      expect(decompressed).toBe(original)
      expect(decompressed.length).toBe(original.length)
    })

    it('should decompress empty string', async () => {
      const original = ''
      const compressed = await compressData(original)
      const decompressed = await decompressData(compressed.stream())

      expect(decompressed).toBe(original)
    })

    it('should handle special characters', async () => {
      const original = '{"emoji":"🍕","unicode":"日本語","special":"<>&\\"\'"}'
      const compressed = await compressData(original)
      const decompressed = await decompressData(compressed.stream())

      expect(decompressed).toBe(original)
    })
  })

  describe('compression round-trip', () => {
    it('should preserve data integrity through compression cycle', async () => {
      const testData = [
        'Simple string',
        JSON.stringify({ key: 'value' }),
        'Multi\nLine\nString',
        '{"nested":{"deeply":{"structured":{"data":"value"}}}}',
        Array(100).fill('repeated ').join(''),
      ]

      for (const data of testData) {
        const compressed = await compressData(data)
        const decompressed = await decompressData(compressed.stream())
        expect(decompressed).toBe(data)
      }
    })
  })
})
