<template>
  <div 
    class="optimized-image-container"
    :style="containerStyle"
  >
    <img
      ref="imageRef"
      :src="currentSrc"
      :alt="alt"
      :loading="loading"
      :fetchpriority="fetchpriority"
      :class="imageClasses"
      @load="handleLoad"
      @error="handleError"
    />
    <div v-if="isLoading" class="image-placeholder">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  width: {
    type: [Number, String],
    default: null
  },
  height: {
    type: [Number, String],
    default: null
  },
  loading: {
    type: String,
    default: 'lazy',
    validator: (value) => ['lazy', 'eager'].includes(value)
  },
  fetchpriority: {
    type: String,
    default: 'auto',
    validator: (value) => ['high', 'low', 'auto'].includes(value)
  },
  enableWebp: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['load', 'error'])

const imageRef = ref(null)
const isLoaded = ref(false)
const isError = ref(false)
const isLoading = ref(true)

// 检测 WebP 支持
const supportsWebp = ref(false)

const checkWebpSupport = () => {
  return new Promise((resolve) => {
    const webp = new Image()
    webp.onload = webp.onerror = () => {
      resolve(webp.height === 2)
    }
    webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

// 计算当前图片源
const currentSrc = computed(() => {
  if (isError.value && props.placeholder) {
    return props.placeholder
  }
  
  if (props.enableWebp && supportsWebp.value) {
    // 尝试将扩展名替换为 .webp
    const webpSrc = props.src.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    return webpSrc
  }
  
  return props.src
})

// 容器样式
const containerStyle = computed(() => {
  const style = {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0'
  }
  
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  
  return style
})

// 图片类名
const imageClasses = computed(() => {
  return {
    'optimized-image': true,
    'image-loaded': isLoaded.value,
    'image-error': isError.value,
    'image-loading': isLoading.value
  }
})

// 处理图片加载完成
const handleLoad = () => {
  isLoaded.value = true
  isLoading.value = false
  isError.value = false
  emit('load')
}

// 处理图片加载错误
const handleError = () => {
  isError.value = true
  isLoading.value = false
  
  // 如果是 WebP 格式失败，尝试原始格式
  if (props.enableWebp && supportsWebp.value && currentSrc.value.includes('.webp')) {
    supportsWebp.value = false
    return
  }
  
  emit('error')
}

// 监听 src 变化
watch(() => props.src, () => {
  isLoaded.value = false
  isError.value = false
  isLoading.value = true
})

onMounted(async () => {
  if (props.enableWebp) {
    supportsWebp.value = await checkWebpSupport()
  }
})
</script>

<style scoped>
.optimized-image-container {
  display: block;
  contain: layout style paint;
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.optimized-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 0.3s ease;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.image-loading {
  opacity: 0;
}

.image-loaded {
  opacity: 1;
}

.image-error {
  opacity: 0.5;
  filter: grayscale(100%);
}

.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  z-index: 1;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e9ecef;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式优化 */
@media (max-width: 768px) {
  .loading-spinner {
    width: 20px;
    height: 20px;
  }
}
</style>
