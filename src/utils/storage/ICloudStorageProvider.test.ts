import { describe, expect, it } from 'vitest'

import { isExistingFile } from './ICloudStorageProvider'

import type { FileInfo } from './ICloudStorageProvider'

describe('ICloudStorageProvider', () => {
  describe('isExistingFile', () => {
    it('should return true for file with valid ID', () => {
      const fileInfo: FileInfo = {
        id: 'file123',
        name: 'data.json.gz',
        path: '/path/to/file',
      }

      expect(isExistingFile(fileInfo)).toBe(true)
    })

    it('should return false for file with empty string ID', () => {
      const fileInfo: FileInfo = {
        id: '',
        name: 'data.json.gz',
        path: '/path/to/file',
      }

      expect(isExistingFile(fileInfo)).toBe(false)
    })

    it('should return false for file with null ID', () => {
      const fileInfo: FileInfo = {
        id: null as any,
        name: 'data.json.gz',
        path: '/path/to/file',
      }

      expect(isExistingFile(fileInfo)).toBe(false)
    })

    it('should return false for file with undefined ID', () => {
      const fileInfo: FileInfo = {
        id: undefined as any,
        name: 'data.json.gz',
        path: '/path/to/file',
      }

      expect(isExistingFile(fileInfo)).toBe(false)
    })

    it('should handle files with optional properties', () => {
      const fileInfo: FileInfo = {
        id: 'file123',
        name: 'data.json.gz',
        path: '/path/to/file',
        isSharedWithMe: true,
        driveId: 'drive123',
      }

      expect(isExistingFile(fileInfo)).toBe(true)
    })
  })
})
