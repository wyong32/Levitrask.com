import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  isValidLocale, 
  getValidLocale, 
  getUserLocaleFromStorage, 
  setUserLocaleToStorage,
  buildLocalizedPath 
} from '../routerUtils'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('routerUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isValidLocale', () => {
    it('should return true for valid locales', () => {
      expect(isValidLocale('en')).toBe(true)
      expect(isValidLocale('zh-CN')).toBe(true)
      expect(isValidLocale('ru')).toBe(true)
    })

    it('should return false for invalid locales', () => {
      expect(isValidLocale('invalid')).toBe(false)
      expect(isValidLocale('')).toBe(false)
      expect(isValidLocale(null)).toBe(false)
      expect(isValidLocale(undefined)).toBe(false)
      expect(isValidLocale(123)).toBe(false)
    })
  })

  describe('getValidLocale', () => {
    it('should return the locale if valid', () => {
      expect(getValidLocale('en')).toBe('en')
      expect(getValidLocale('zh-CN')).toBe('zh-CN')
      expect(getValidLocale('ru')).toBe('ru')
    })

    it('should return default locale for invalid input', () => {
      expect(getValidLocale('invalid')).toBe('en')
      expect(getValidLocale('')).toBe('en')
      expect(getValidLocale(null)).toBe('en')
    })

    it('should use custom default locale', () => {
      expect(getValidLocale('invalid', 'zh-CN')).toBe('zh-CN')
    })
  })

  describe('getUserLocaleFromStorage', () => {
    it('should return valid locale from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('zh-CN')
      expect(getUserLocaleFromStorage()).toBe('zh-CN')
    })

    it('should return null for invalid locale in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid')
      expect(getUserLocaleFromStorage()).toBe(null)
    })

    it('should return null when localStorage throws error', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })
      expect(getUserLocaleFromStorage()).toBe(null)
    })
  })

  describe('setUserLocaleToStorage', () => {
    it('should set valid locale to localStorage', () => {
      setUserLocaleToStorage('zh-CN')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user-locale', 'zh-CN')
    })

    it('should not set invalid locale to localStorage', () => {
      setUserLocaleToStorage('invalid')
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  describe('buildLocalizedPath', () => {
    it('should build correct localized paths', () => {
      expect(buildLocalizedPath('en', '/home')).toBe('/en/home')
      expect(buildLocalizedPath('zh-CN', 'blog')).toBe('/zh-CN/blog')
      expect(buildLocalizedPath('ru', '')).toBe('/ru/')
    })

    it('should handle invalid locales', () => {
      expect(buildLocalizedPath('invalid', '/home')).toBe('/en/home')
    })
  })
})
