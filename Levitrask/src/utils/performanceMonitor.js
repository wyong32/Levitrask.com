/**
 * 性能监控工具
 * 监控 Core Web Vitals 和其他性能指标
 */

// 性能数据收集器
class PerformanceMonitor {
  constructor() {
    this.metrics = {}
    this.observers = []
    this.isSupported = this.checkSupport()

    if (this.isSupported) {
      this.init()
    }
  }

  // 检查浏览器支持
  checkSupport() {
    return (
      'PerformanceObserver' in window &&
      'performance' in window &&
      'getEntriesByType' in performance
    )
  }

  // 初始化监控
  init() {
    this.observeLCP()
    this.observeFID()
    this.observeCLS()
    this.observeFCP()
    this.observeTTFB()
    this.observeNavigation()
    this.observeResource()
  }

  // 监控 Largest Contentful Paint (LCP)
  observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]

        this.metrics.lcp = {
          value: lastEntry.startTime,
          element: lastEntry.element,
          url: lastEntry.url,
          timestamp: Date.now()
        }

        this.reportMetric('LCP', lastEntry.startTime)
      })

      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('LCP observation failed:', error)
    }
  }

  // 监控 First Input Delay (FID)
  observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          this.metrics.fid = {
            value: entry.processingStart - entry.startTime,
            timestamp: Date.now()
          }

          this.reportMetric('FID', entry.processingStart - entry.startTime)
        })
      })

      observer.observe({ entryTypes: ['first-input'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('FID observation failed:', error)
    }
  }

  // 监控 Cumulative Layout Shift (CLS)
  observeCLS() {
    try {
      let clsValue = 0
      let sessionValue = 0
      let sessionEntries = []

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()

        entries.forEach((entry) => {
          // 只计算非用户输入导致的布局偏移
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0]
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1]

            // 如果条目与上一个条目的时间间隔小于1秒且与第一个条目的时间间隔小于5秒，则包含在当前会话中
            if (sessionValue &&
                entry.startTime - lastSessionEntry.startTime < 1000 &&
                entry.startTime - firstSessionEntry.startTime < 5000) {
              sessionValue += entry.value
              sessionEntries.push(entry)
            } else {
              sessionValue = entry.value
              sessionEntries = [entry]
            }

            // 如果当前会话值大于当前CLS值，则更新CLS
            if (sessionValue > clsValue) {
              clsValue = sessionValue

              this.metrics.cls = {
                value: clsValue,
                entries: [...sessionEntries],
                timestamp: Date.now()
              }

              this.reportMetric('CLS', clsValue)
            }
          }
        })
      })

      observer.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('CLS observation failed:', error)
    }
  }

  // 监控 First Contentful Paint (FCP)
  observeFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = {
              value: entry.startTime,
              timestamp: Date.now()
            }

            this.reportMetric('FCP', entry.startTime)
          }
        })
      })

      observer.observe({ entryTypes: ['paint'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('FCP observation failed:', error)
    }
  }

  // 监控 Time to First Byte (TTFB)
  observeTTFB() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const ttfb = entry.responseStart - entry.requestStart

            this.metrics.ttfb = {
              value: ttfb,
              timestamp: Date.now()
            }

            this.reportMetric('TTFB', ttfb)
          }
        })
      })

      observer.observe({ entryTypes: ['navigation'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('TTFB observation failed:', error)
    }
  }

  // 监控导航性能
  observeNavigation() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          this.metrics.navigation = {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            domInteractive: entry.domInteractive - entry.navigationStart,
            timestamp: Date.now()
          }
        })
      })

      observer.observe({ entryTypes: ['navigation'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('Navigation observation failed:', error)
    }
  }

  // 监控资源加载
  observeResource() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()

        entries.forEach((entry) => {
          // 记录大型资源
          if (entry.transferSize > 100000) { // 大于100KB
            if (!this.metrics.largeResources) {
              this.metrics.largeResources = []
            }

            this.metrics.largeResources.push({
              name: entry.name,
              size: entry.transferSize,
              duration: entry.duration,
              type: entry.initiatorType,
              timestamp: Date.now()
            })
          }
        })
      })

      observer.observe({ entryTypes: ['resource'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('Resource observation failed:', error)
    }
  }

  // 报告指标
  reportMetric(name, value) {
    // 评估指标
    const rating = this.rateMetric(name, value)

    // 可以在这里发送到分析服务
    // this.sendToAnalytics(name, value, rating)
  }

  // 评估指标等级
  rateMetric(name, value) {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 }
    }

    const threshold = thresholds[name]
    if (!threshold) return 'unknown'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  // 获取所有指标
  getMetrics() {
    return { ...this.metrics }
  }

  // 生成性能报告
  generateReport() {
    const report = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.getMetrics(),
      recommendations: this.getRecommendations()
    }

    return report
  }

  // 获取优化建议
  getRecommendations() {
    const recommendations = []

    if (this.metrics.lcp && this.metrics.lcp.value > 2500) {
      recommendations.push('优化 LCP: 考虑优化图片、减少服务器响应时间、使用 CDN')
    }

    if (this.metrics.fid && this.metrics.fid.value > 100) {
      recommendations.push('优化 FID: 减少 JavaScript 执行时间、使用 Web Workers')
    }

    if (this.metrics.cls && this.metrics.cls.value > 0.1) {
      recommendations.push('优化 CLS: 为图片设置尺寸、避免动态插入内容')
    }

    if (this.metrics.largeResources && this.metrics.largeResources.length > 0) {
      recommendations.push('优化资源: 压缩大型资源、启用懒加载')
    }

    return recommendations
  }

  // 清理观察器
  disconnect() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// 创建全局实例
export const performanceMonitor = new PerformanceMonitor()

// 页面卸载时生成报告
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const report = performanceMonitor.generateReport()

    // 可以发送到服务器
    // navigator.sendBeacon('/api/performance', JSON.stringify(report))
  })
}
