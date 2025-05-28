<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const isAppReady = ref(false)
const router = useRouter()
const route = useRoute()
const { locale } = useI18n()

onMounted(async () => {
  // console.log('[App] App component mounted, initializing...')

  try {
    // 短暂延迟确保所有初始化完成
    await nextTick()

    // 检查路由和i18n是否同步
    const routeLang = route.params.lang
    if (routeLang && ['en', 'zh-CN', 'ru'].includes(routeLang)) {
      if (locale.value !== routeLang) {
        // console.log('[App] Syncing locale:', routeLang)
        locale.value = routeLang
      }
    }

    // console.log('[App] App initialization complete')
    isAppReady.value = true
  } catch (error) {
    console.error('[App] App initialization failed:', error)
    // 即使失败也显示应用，避免永久白屏
    isAppReady.value = true
  }
})
</script>

<template>
  <div class="app-wrapper">
    <!-- 加载状态 -->
    <div v-if="!isAppReady" class="app-loading">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>

    <!-- 应用内容 -->
    <router-view v-else />
  </div>
</template>

<style scoped>
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  contain: layout style; /* 防止布局偏移 */
}

.app-loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.app-loading p {
  color: #6c757d;
  font-size: 16px;
  margin: 0;
}

/* 全局样式，确保所有图片都有占位符和固定尺寸 */
:deep(img) {
  background-color: #f0f0f0; /* 图片加载前的背景色 */
  transition: opacity 0.3s ease; /* 平滑过渡效果 */
  transform: translateZ(0); /* 启用GPU加速 */
  backface-visibility: hidden; /* 防止闪烁 */
  will-change: transform; /* 提示浏览器这个元素会变化 */
  image-rendering: -webkit-optimize-contrast; /* 提高图片渲染质量 */
}

/* 防止布局偏移的全局样式 */
:deep(.homepage-layout),
:deep(.content-block),
:deep(.sidebar-block) {
  contain: layout style; /* 防止布局偏移 */
}

:deep(.main-content-area) {
  flex: 1; /* Allow main content to grow and push footer down */
  min-height: 800px; /* 设置最小高度，防止内容加载时的布局偏移 */
  width: 100%; /* 确保宽度固定 */
  box-sizing: border-box; /* 确保padding不影响总宽度 */
  contain: layout style; /* 防止布局偏移 */
  transform: translateZ(0); /* 启用硬件加速 */
}

@media (max-width: 767px) {
  :deep(.main-content-area) {
    min-height: 600px; /* 移动端减少最小高度 */
  }
}
</style>
