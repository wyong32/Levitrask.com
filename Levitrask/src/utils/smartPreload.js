/**
 * 智能资源预加载工具
 * 只在确实需要时才预加载资源，避免浪费带宽和产生警告
 */

/**
 * 预加载关键CSS
 * @param {string} href - CSS文件路径
 * @param {number} delay - 延迟时间（毫秒）
 */
export function preloadCSS(href, delay = 0) {
  if (typeof document === 'undefined') return

  const preload = () => {
    // 检查是否已经存在
    const existing = document.querySelector(`link[href="${href}"]`)
    if (existing) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'style'
    link.href = href
    link.onload = function() {
      this.onload = null
      this.rel = 'stylesheet'
    }
    document.head.appendChild(link)
  }

  if (delay > 0) {
    setTimeout(preload, delay)
  } else {
    preload()
  }
}

/**
 * 智能图片预加载
 * 只预加载即将进入视口的图片
 * @param {string} src - 图片路径
 * @param {Object} options - 选项
 */
export function smartPreloadImage(src, options = {}) {
  if (typeof document === 'undefined') return

  const {
    priority = 'low',
    delay = 0,
    condition = () => true
  } = options

  const preload = () => {
    if (!condition()) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    
    if (priority === 'high') {
      link.fetchPriority = 'high'
    }
    
    document.head.appendChild(link)
  }

  if (delay > 0) {
    setTimeout(preload, delay)
  } else {
    preload()
  }
}

/**
 * 预加载下一页面的资源
 * @param {string} route - 路由路径
 */
export function preloadNextPage(route) {
  if (typeof document === 'undefined') return

  // 预测用户可能访问的页面
  const routePreloadMap = {
    '/': ['/en/blog', '/en/news'],
    '/en/': ['/en/blog', '/en/news'],
    '/zh-CN/': ['/zh-CN/blog', '/zh-CN/news'],
    '/ru/': ['/ru/blog', '/ru/news']
  }

  const nextRoutes = routePreloadMap[route] || []
  
  nextRoutes.forEach(nextRoute => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = nextRoute
    document.head.appendChild(link)
  })
}

/**
 * 基于用户交互预加载
 * @param {string} selector - 元素选择器
 * @param {string} resource - 要预加载的资源
 */
export function preloadOnHover(selector, resource) {
  if (typeof document === 'undefined') return

  let preloaded = false

  const handleMouseEnter = () => {
    if (preloaded) return
    
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = resource
    document.head.appendChild(link)
    
    preloaded = true
  }

  // 使用事件委托
  document.addEventListener('mouseenter', (e) => {
    if (e.target.matches(selector)) {
      handleMouseEnter()
    }
  }, true)
}

/**
 * 检测网络状况并决定是否预加载
 */
export function shouldPreload() {
  // 检查网络连接
  if (typeof navigator !== 'undefined' && navigator.connection) {
    const connection = navigator.connection
    
    // 如果是慢速网络，不预加载
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return false
    }
    
    // 如果用户设置了数据节省模式
    if (connection.saveData) {
      return false
    }
  }
  
  // 检查设备内存（如果支持）
  if (typeof navigator !== 'undefined' && navigator.deviceMemory) {
    // 如果设备内存小于2GB，减少预加载
    if (navigator.deviceMemory < 2) {
      return false
    }
  }
  
  return true
}

/**
 * 智能预加载管理器
 */
export class SmartPreloadManager {
  constructor() {
    this.preloadedResources = new Set()
    this.observer = null
    this.enabled = shouldPreload()
  }

  /**
   * 初始化
   */
  init() {
    if (!this.enabled) {
      console.log('[SmartPreload] Preloading disabled due to network/device constraints')
      return
    }

    this.setupIntersectionObserver()
    this.setupHoverPreload()
  }

  /**
   * 设置交叉观察器
   */
  setupIntersectionObserver() {
    if (!window.IntersectionObserver) return

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target
            const preloadSrc = element.dataset.preload
            
            if (preloadSrc && !this.preloadedResources.has(preloadSrc)) {
              this.preloadResource(preloadSrc)
              this.preloadedResources.add(preloadSrc)
            }
          }
        })
      },
      {
        rootMargin: '200px 0px', // 提前200px开始预加载
        threshold: 0.01
      }
    )
  }

  /**
   * 设置悬停预加载
   */
  setupHoverPreload() {
    document.addEventListener('mouseenter', (e) => {
      const link = e.target.closest('a[href]')
      if (link && this.enabled) {
        const href = link.getAttribute('href')
        if (href && !this.preloadedResources.has(href)) {
          this.preloadPage(href)
          this.preloadedResources.add(href)
        }
      }
    }, true)
  }

  /**
   * 预加载资源
   */
  preloadResource(src) {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = src
    document.head.appendChild(link)
  }

  /**
   * 预加载页面
   */
  preloadPage(href) {
    // 只预加载内部链接
    if (href.startsWith('/') || href.includes(window.location.hostname)) {
      this.preloadResource(href)
    }
  }

  /**
   * 观察元素
   */
  observe(element) {
    if (this.observer && element) {
      this.observer.observe(element)
    }
  }

  /**
   * 停止观察
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

// 创建全局实例
export const smartPreloadManager = new SmartPreloadManager()

// 自动初始化
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    smartPreloadManager.init()
  })
}
