<template>
  <div 
    ref="containerRef"
    class="lazy-load-container"
    :class="containerClasses"
  >
    <div v-if="isVisible || !lazy" class="lazy-content">
      <slot />
    </div>
    <div v-else class="lazy-placeholder" :style="placeholderStyle">
      <div v-if="showSpinner" class="loading-spinner"></div>
      <slot name="placeholder">
        <div class="default-placeholder">Loading...</div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

const props = defineProps({
  // 是否启用懒加载
  lazy: {
    type: Boolean,
    default: true
  },
  // 根边距，用于提前触发加载
  rootMargin: {
    type: String,
    default: '100px'
  },
  // 交叉阈值
  threshold: {
    type: [Number, Array],
    default: 0.01
  },
  // 占位符高度
  minHeight: {
    type: [Number, String],
    default: 200
  },
  // 是否显示加载动画
  showSpinner: {
    type: Boolean,
    default: true
  },
  // 一次性加载（加载后不再监听）
  once: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['visible', 'hidden'])

const containerRef = ref(null)
const isVisible = ref(false)
const observer = ref(null)

// 容器类名
const containerClasses = computed(() => {
  return {
    'lazy-load-visible': isVisible.value,
    'lazy-load-hidden': !isVisible.value && props.lazy
  }
})

// 占位符样式
const placeholderStyle = computed(() => {
  const style = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '4px'
  }
  
  if (props.minHeight) {
    style.minHeight = typeof props.minHeight === 'number' 
      ? `${props.minHeight}px` 
      : props.minHeight
  }
  
  return style
})

// 设置 Intersection Observer
const setupObserver = () => {
  if (!props.lazy || !containerRef.value) return
  
  // 检查浏览器支持
  if (!window.IntersectionObserver) {
    // 不支持 IntersectionObserver，直接显示内容
    isVisible.value = true
    return
  }
  
  const options = {
    root: null,
    rootMargin: props.rootMargin,
    threshold: props.threshold
  }
  
  observer.value = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        isVisible.value = true
        emit('visible')
        
        // 如果是一次性加载，停止观察
        if (props.once) {
          observer.value?.unobserve(entry.target)
        }
      } else if (!props.once) {
        isVisible.value = false
        emit('hidden')
      }
    })
  }, options)
  
  observer.value.observe(containerRef.value)
}

// 清理 observer
const cleanupObserver = () => {
  if (observer.value) {
    observer.value.disconnect()
    observer.value = null
  }
}

// 监听 lazy 属性变化
watch(() => props.lazy, (newLazy) => {
  if (!newLazy) {
    isVisible.value = true
    cleanupObserver()
  } else {
    isVisible.value = false
    setupObserver()
  }
})

onMounted(() => {
  if (!props.lazy) {
    isVisible.value = true
  } else {
    setupObserver()
  }
})

onUnmounted(() => {
  cleanupObserver()
})

// 暴露方法给父组件
defineExpose({
  isVisible,
  forceLoad: () => {
    isVisible.value = true
    cleanupObserver()
  }
})
</script>

<style scoped>
.lazy-load-container {
  contain: layout style;
  will-change: transform;
  transform: translateZ(0);
}

.lazy-content {
  opacity: 1;
  transition: opacity 0.3s ease;
}

.lazy-placeholder {
  transition: all 0.3s ease;
  color: #6c757d;
  font-size: 14px;
}

.default-placeholder {
  padding: 20px;
  text-align: center;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e9ecef;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 动画效果 */
.lazy-load-visible .lazy-content {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式优化 */
@media (max-width: 768px) {
  .loading-spinner {
    width: 20px;
    height: 20px;
  }
  
  .default-placeholder {
    padding: 15px;
    font-size: 13px;
  }
}
</style>
