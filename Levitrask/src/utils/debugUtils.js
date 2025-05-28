// 调试工具函数
export class AppDebugger {
  constructor() {
    this.logs = []
    this.isEnabled = import.meta.env.DEV || localStorage.getItem('debug-mode') === 'true'
  }

  log(component, message, data = null) {
    if (!this.isEnabled) return

    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      component,
      message,
      data
    }

    this.logs.push(logEntry)
    console.log(`[${component}] ${message}`, data || '')

    // 保持最近100条日志
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100)
    }
  }

  error(component, message, error = null) {
    if (!this.isEnabled) return

    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      component,
      message,
      error: error?.message || error,
      stack: error?.stack
    }

    this.logs.push(logEntry)
    console.error(`[${component}] ${message}`, error || '')
  }

  getState() {
    return {
      route: window.location.href,
      localStorage: {
        userLocale: localStorage.getItem('user-locale'),
        debugMode: localStorage.getItem('debug-mode')
      },
      i18n: window.__VUE_I18N__?.global?.locale?.value || 'unknown',
      logs: this.logs.slice(-10) // 最近10条日志
    }
  }

  exportLogs() {
    const state = this.getState()
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `levitrask-debug-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  clear() {
    this.logs = []
    console.clear()
  }
}

// 全局调试器实例
export const appDebugger = new AppDebugger()

// 在开发环境下暴露到全局
if (import.meta.env.DEV) {
  window.__LEVITRASK_DEBUGGER__ = appDebugger
}

// 检查应用状态的工具函数
export function checkAppHealth() {
  const health = {
    router: !!window.__VUE_ROUTER__,
    i18n: !!window.__VUE_I18N__,
    locale: window.__VUE_I18N__?.global?.locale?.value,
    route: window.location.href,
    localStorage: {
      userLocale: localStorage.getItem('user-locale')
    },
    timestamp: new Date().toISOString()
  }

  appDebugger.log('HealthCheck', 'App health status', health)
  return health
}

// 性能监控
export function measurePerformance(name, fn) {
  if (!appDebugger.isEnabled) return fn()

  const start = performance.now()
  const result = fn()
  const end = performance.now()

  appDebugger.log('Performance', `${name} took ${(end - start).toFixed(2)}ms`)

  return result
}

// 异步性能监控
export async function measureAsyncPerformance(name, fn) {
  if (!appDebugger.isEnabled) return await fn()

  const start = performance.now()
  const result = await fn()
  const end = performance.now()

  appDebugger.log('Performance', `${name} took ${(end - start).toFixed(2)}ms`)

  return result
}
