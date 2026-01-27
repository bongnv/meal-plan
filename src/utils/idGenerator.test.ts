import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { generateId } from './idGenerator'

describe('idGenerator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('generateId', () => {
    it('should generate a non-empty string', () => {
      const id = generateId()
      expect(id).toBeTruthy()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('should contain timestamp and random parts separated by hyphen', () => {
      vi.setSystemTime(new Date('2026-01-28T12:00:00.000Z'))
      const id = generateId()

      expect(id).toContain('-')
      const parts = id.split('-')
      expect(parts).toHaveLength(2)

      // First part should be the timestamp
      expect(parts[0]).toBe('1737979200000')

      // Second part should be alphanumeric
      expect(parts[1]).toMatch(/^[a-z0-9]+$/)
      expect(parts[1].length).toBe(7)
    })

    it('should generate unique IDs', () => {
      const ids = new Set<string>()
      const count = 1000

      for (let i = 0; i < count; i++) {
        const id = generateId()
        ids.add(id)
      }

      // All IDs should be unique
      expect(ids.size).toBe(count)
    })

    it('should include current timestamp', () => {
      const before = Date.now()
      const id = generateId()
      const after = Date.now()

      const timestamp = parseInt(id.split('-')[0], 10)
      expect(timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp).toBeLessThanOrEqual(after)
    })

    it('should generate IDs with consistent format', () => {
      const ids = Array.from({ length: 10 }, () => generateId())

      for (const id of ids) {
        // Should match format: {timestamp}-{random}
        expect(id).toMatch(/^\d+-[a-z0-9]{7}$/)
      }
    })

    it('should generate different random parts even with same timestamp', () => {
      vi.setSystemTime(new Date('2026-01-28T12:00:00.000Z'))

      const id1 = generateId()
      const id2 = generateId()

      const timestamp1 = id1.split('-')[0]
      const timestamp2 = id2.split('-')[0]
      const random1 = id1.split('-')[1]
      const random2 = id2.split('-')[1]

      // Same timestamp
      expect(timestamp1).toBe(timestamp2)

      // Different random parts (extremely high probability)
      expect(random1).not.toBe(random2)
    })

    it('should use base36 encoding for random part', () => {
      const ids = Array.from({ length: 100 }, () => generateId())

      for (const id of ids) {
        const randomPart = id.split('-')[1]
        // Base36 uses 0-9 and a-z (lowercase)
        expect(randomPart).toMatch(/^[0-9a-z]+$/)
        expect(randomPart).not.toMatch(/[A-Z]/)
      }
    })

    it('should generate IDs that are sortable by timestamp', () => {
      vi.setSystemTime(new Date('2026-01-28T12:00:00.000Z'))
      const id1 = generateId()

      vi.setSystemTime(new Date('2026-01-28T12:00:01.000Z'))
      const id2 = generateId()

      vi.setSystemTime(new Date('2026-01-28T12:00:02.000Z'))
      const id3 = generateId()

      const ids = [id3, id1, id2]
      const sorted = [...ids].sort()

      expect(sorted).toEqual([id1, id2, id3])
    })

    it('should handle rapid successive calls', () => {
      const ids: string[] = []

      // Generate many IDs rapidly
      for (let i = 0; i < 100; i++) {
        ids.push(generateId())
      }

      // All should be unique
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(100)

      // All should be valid format
      for (const id of ids) {
        expect(id).toMatch(/^\d+-[a-z0-9]{7}$/)
      }
    })
  })
})
