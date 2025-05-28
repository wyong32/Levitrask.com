/**
 * 动态导入工具 - 减少未使用的 JavaScript
 * 按需加载组件和库，提升 PageSpeed Insights 分数
 */

// 缓存已加载的模块
const moduleCache = new Map()

/**
 * 动态导入 Element Plus 组件
 * @param {string} componentName - 组件名称
 * @returns {Promise} - 组件构造函数
 */
export async function loadElementComponent(componentName) {
  const cacheKey = `element-${componentName}`
  
  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey)
  }
  
  try {
    const module = await import(`element-plus/es/components/${componentName.toLowerCase()}/index.js`)
    const component = module.default || module[componentName]
    moduleCache.set(cacheKey, component)
    return component
  } catch (error) {
    console.warn(`Failed to load Element Plus component: ${componentName}`, error)
    return null
  }
}

/**
 * 动态导入 Swiper
 * @param {Array} modules - 需要的 Swiper 模块
 * @returns {Promise} - Swiper 类和模块
 */
export async function loadSwiper(modules = []) {
  const cacheKey = `swiper-${modules.join('-')}`
  
  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey)
  }
  
  try {
    const [swiperModule, ...moduleImports] = await Promise.all([
      import('swiper'),
      ...modules.map(module => import(`swiper/modules`))
    ])
    
    const Swiper = swiperModule.Swiper
    const loadedModules = moduleImports.map(m => m[modules[moduleImports.indexOf(m)]])
    
    const result = { Swiper, modules: loadedModules }
    moduleCache.set(cacheKey, result)
    return result
  } catch (error) {
    console.warn('Failed to load Swiper', error)
    return null
  }
}

/**
 * 动态导入图表库（如果需要）
 * @param {string} chartType - 图表类型
 * @returns {Promise} - 图表库
 */
export async function loadChart(chartType = 'chart') {
  const cacheKey = `chart-${chartType}`
  
  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey)
  }
  
  try {
    let chartModule
    switch (chartType) {
      case 'echarts':
        chartModule = await import('echarts')
        break
      case 'chartjs':
        chartModule = await import('chart.js')
        break
      default:
        throw new Error(`Unknown chart type: ${chartType}`)
    }
    
    moduleCache.set(cacheKey, chartModule)
    return chartModule
  } catch (error) {
    console.warn(`Failed to load chart library: ${chartType}`, error)
    return null
  }
}

/**
 * 动态导入工具库
 * @param {string} utilName - 工具库名称
 * @returns {Promise} - 工具库
 */
export async function loadUtil(utilName) {
  const cacheKey = `util-${utilName}`
  
  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey)
  }
  
  try {
    let utilModule
    switch (utilName) {
      case 'dayjs':
        utilModule = await import('dayjs')
        break
      case 'lodash':
        utilModule = await import('lodash-es')
        break
      case 'axios':
        utilModule = await import('axios')
        break
      default:
        throw new Error(`Unknown utility: ${utilName}`)
    }
    
    moduleCache.set(cacheKey, utilModule)
    return utilModule
  } catch (error) {
    console.warn(`Failed to load utility: ${utilName}`, error)
    return null
  }
}

/**
 * 预加载关键模块
 * 在空闲时间预加载可能需要的模块
 */
export function preloadCriticalModules() {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // 预加载 Vue Router（如果还没加载）
      import('vue-router').catch(() => {})
      
      // 预加载 Pinia（如果还没加载）
      import('pinia').catch(() => {})
      
      // 预加载 Vue I18n（如果还没加载）
      import('vue-i18n').catch(() => {})
    })
  }
}

/**
 * 清理模块缓存
 * 在内存压力大时可以调用
 */
export function clearModuleCache() {
  moduleCache.clear()
}

/**
 * 获取缓存状态
 * @returns {Object} - 缓存信息
 */
export function getCacheInfo() {
  return {
    size: moduleCache.size,
    keys: Array.from(moduleCache.keys())
  }
}

/**
 * 条件加载模块
 * 根据条件决定是否加载模块
 * @param {Function} condition - 条件函数
 * @param {Function} loader - 加载函数
 * @returns {Promise} - 模块或 null
 */
export async function conditionalLoad(condition, loader) {
  if (typeof condition === 'function' && condition()) {
    return await loader()
  }
  return null
}

/**
 * 延迟加载模块
 * 在指定延迟后加载模块
 * @param {Function} loader - 加载函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Promise} - 模块
 */
export function delayedLoad(loader, delay = 0) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const module = await loader()
        resolve(module)
      } catch (error) {
        reject(error)
      }
    }, delay)
  })
}

// 在模块加载时自动预加载关键模块
if (typeof window !== 'undefined') {
  preloadCriticalModules()
}
