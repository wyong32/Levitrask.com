/**
 * 资源优化工具
 * 优化图片加载、减少 CLS、提升 LCP
 */

// 图片格式支持检测缓存
const formatSupport = {
  webp: null,
  avif: null
}

/**
 * 检测浏览器对图片格式的支持
 * @param {string} format - 图片格式 (webp, avif)
 * @returns {Promise<boolean>} - 是否支持
 */
export function checkImageFormatSupport(format) {
  if (formatSupport[format] !== null) {
    return Promise.resolve(formatSupport[format])
  }

  return new Promise((resolve) => {
    const img = new Image()
    
    img.onload = img.onerror = () => {
      const supported = img.height === 2
      formatSupport[format] = supported
      resolve(supported)
    }

    // 测试图片数据
    const testImages = {
      webp: 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA',
      avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
    }

    img.src = testImages[format]
  })
}

/**
 * 获取优化后的图片 URL
 * @param {string} originalSrc - 原始图片 URL
 * @param {Object} options - 优化选项
 * @returns {Promise<string>} - 优化后的 URL
 */
export async function getOptimizedImageSrc(originalSrc, options = {}) {
  const {
    enableWebp = true,
    enableAvif = false,
    quality = 85,
    width = null,
    height = null
  } = options

  // 如果是外部 URL，直接返回
  if (originalSrc.startsWith('http') && !originalSrc.includes(window.location.hostname)) {
    return originalSrc
  }

  let optimizedSrc = originalSrc

  // 检查 AVIF 支持（优先级最高）
  if (enableAvif && await checkImageFormatSupport('avif')) {
    optimizedSrc = originalSrc.replace(/\.(jpg|jpeg|png|webp)$/i, '.avif')
  }
  // 检查 WebP 支持
  else if (enableWebp && await checkImageFormatSupport('webp')) {
    optimizedSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp')
  }

  // 添加尺寸参数（如果支持）
  if (width || height) {
    const url = new URL(optimizedSrc, window.location.origin)
    if (width) url.searchParams.set('w', width)
    if (height) url.searchParams.set('h', height)
    if (quality !== 85) url.searchParams.set('q', quality)
    optimizedSrc = url.toString()
  }

  return optimizedSrc
}

/**
 * 预加载关键图片
 * @param {Array} imageSrcs - 图片 URL 数组
 * @param {Object} options - 选项
 */
export function preloadCriticalImages(imageSrcs, options = {}) {
  const { priority = 'high', as = 'image' } = options

  imageSrcs.forEach(async (src) => {
    try {
      const optimizedSrc = await getOptimizedImageSrc(src, options)
      
      // 创建预加载链接
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = optimizedSrc
      link.as = as
      if (priority) link.fetchPriority = priority
      
      // 设置图片类型
      if (optimizedSrc.includes('.webp')) {
        link.type = 'image/webp'
      } else if (optimizedSrc.includes('.avif')) {
        link.type = 'image/avif'
      }
      
      document.head.appendChild(link)
    } catch (error) {
      console.warn('Failed to preload image:', src, error)
    }
  })
}

/**
 * 图片懒加载观察器
 */
class ImageLazyLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.01,
      ...options
    }
    
    this.observer = null
    this.images = new Set()
    this.init()
  }

  init() {
    if (!window.IntersectionObserver) {
      // 不支持 IntersectionObserver，直接加载所有图片
      this.loadAllImages()
      return
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target)
          this.observer.unobserve(entry.target)
        }
      })
    }, this.options)
  }

  observe(img) {
    if (this.observer) {
      this.images.add(img)
      this.observer.observe(img)
    } else {
      this.loadImage(img)
    }
  }

  async loadImage(img) {
    try {
      const originalSrc = img.dataset.src || img.src
      const optimizedSrc = await getOptimizedImageSrc(originalSrc)
      
      // 创建新图片对象进行预加载
      const newImg = new Image()
      
      newImg.onload = () => {
        img.src = optimizedSrc
        img.classList.add('loaded')
        img.classList.remove('loading')
      }
      
      newImg.onerror = () => {
        img.classList.add('error')
        img.classList.remove('loading')
      }
      
      img.classList.add('loading')
      newImg.src = optimizedSrc
      
    } catch (error) {
      console.warn('Failed to load image:', img, error)
      img.classList.add('error')
      img.classList.remove('loading')
    }
  }

  loadAllImages() {
    this.images.forEach((img) => {
      this.loadImage(img)
    })
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
    }
    this.images.clear()
  }
}

// 全局图片懒加载实例
export const globalImageLoader = new ImageLazyLoader()

/**
 * 自动优化页面中的图片
 */
export function optimizePageImages() {
  // 查找所有需要优化的图片
  const images = document.querySelectorAll('img[data-src], img[loading="lazy"]')
  
  images.forEach((img) => {
    globalImageLoader.observe(img)
  })
}

/**
 * 计算图片的最佳尺寸
 * @param {HTMLElement} container - 容器元素
 * @param {number} devicePixelRatio - 设备像素比
 * @returns {Object} - 宽度和高度
 */
export function calculateOptimalImageSize(container, devicePixelRatio = window.devicePixelRatio || 1) {
  const rect = container.getBoundingClientRect()
  
  return {
    width: Math.ceil(rect.width * devicePixelRatio),
    height: Math.ceil(rect.height * devicePixelRatio)
  }
}

/**
 * 创建响应式图片 srcset
 * @param {string} baseSrc - 基础图片 URL
 * @param {Array} sizes - 尺寸数组
 * @returns {string} - srcset 字符串
 */
export function createResponsiveSrcset(baseSrc, sizes = [480, 768, 1024, 1200]) {
  return sizes.map(size => {
    const url = new URL(baseSrc, window.location.origin)
    url.searchParams.set('w', size)
    return `${url.toString()} ${size}w`
  }).join(', ')
}

/**
 * 防止图片导致的布局偏移
 * @param {HTMLImageElement} img - 图片元素
 * @param {number} aspectRatio - 宽高比
 */
export function preventImageCLS(img, aspectRatio = null) {
  if (!aspectRatio && img.dataset.width && img.dataset.height) {
    aspectRatio = parseFloat(img.dataset.width) / parseFloat(img.dataset.height)
  }
  
  if (aspectRatio) {
    img.style.aspectRatio = aspectRatio.toString()
  }
  
  // 设置默认样式防止布局偏移
  img.style.display = 'block'
  img.style.width = '100%'
  img.style.height = 'auto'
  img.style.backgroundColor = '#f0f0f0'
}

// 页面加载完成后自动优化图片
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', optimizePageImages)
  } else {
    optimizePageImages()
  }
}
