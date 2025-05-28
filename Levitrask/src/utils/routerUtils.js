// 路由工具函数
import { supportedLocales } from '../i18n'

/**
 * 验证语言参数是否有效
 * @param {string} lang - 语言代码
 * @returns {boolean} - 是否有效
 */
export function isValidLocale(lang) {
  return lang && typeof lang === 'string' && supportedLocales.includes(lang)
}

/**
 * 获取有效的语言代码，如果无效则返回默认语言
 * @param {string} lang - 语言代码
 * @param {string} defaultLang - 默认语言代码
 * @returns {string} - 有效的语言代码
 */
export function getValidLocale(lang, defaultLang = 'en') {
  return isValidLocale(lang) ? lang : defaultLang
}

/**
 * 从localStorage获取用户语言偏好
 * @returns {string|null} - 用户语言偏好或null
 */
export function getUserLocaleFromStorage() {
  try {
    const savedLocale = localStorage.getItem('user-locale')
    return isValidLocale(savedLocale) ? savedLocale : null
  } catch (e) {
    console.warn('[RouterUtils] localStorage not available:', e)
    return null
  }
}

/**
 * 设置用户语言偏好到localStorage
 * @param {string} locale - 语言代码
 */
export function setUserLocaleToStorage(locale) {
  try {
    if (isValidLocale(locale)) {
      localStorage.setItem('user-locale', locale)
    }
  } catch (e) {
    console.warn('[RouterUtils] Failed to save locale to localStorage:', e)
  }
}

/**
 * 构建语言前缀的路径
 * @param {string} locale - 语言代码
 * @param {string} path - 路径
 * @returns {string} - 带语言前缀的路径
 */
export function buildLocalizedPath(locale, path = '') {
  const validLocale = getValidLocale(locale)
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `/${validLocale}${cleanPath}`
}
