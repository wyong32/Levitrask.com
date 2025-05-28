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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
</style>
