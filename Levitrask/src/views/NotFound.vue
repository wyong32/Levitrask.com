<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h1 class="error-title">{{ $t('notFound.title', 'Page Not Found') }}</h1>
      <p class="error-message">{{ $t('notFound.message', 'Sorry, the page you are looking for does not exist.') }}</p>
      
      <div class="error-actions">
        <router-link :to="homeLink" class="btn btn-primary">
          {{ $t('notFound.goHome', 'Go back to Home') }}
        </router-link>
        <button @click="goBack" class="btn btn-secondary">
          {{ $t('notFound.goBack', 'Go Back') }}
        </button>
      </div>
      
      <div class="helpful-links">
        <h3>{{ $t('notFound.helpfulLinks', 'Helpful Links') }}</h3>
        <ul>
          <li><router-link :to="blogLink">{{ $t('notFound.blog', 'Blog') }}</router-link></li>
          <li><router-link :to="newsLink">{{ $t('notFound.news', 'News') }}</router-link></li>
          <li><router-link :to="termsLink">{{ $t('notFound.terms', 'Terms') }}</router-link></li>
          <li><router-link :to="privacyLink">{{ $t('notFound.privacy', 'Privacy') }}</router-link></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const { locale } = useI18n()

// 获取当前语言或默认语言
const currentLang = computed(() => {
  return route.params.lang || locale.value || 'en'
})

// 构建带语言前缀的链接
const homeLink = computed(() => `/${currentLang.value}/`)
const blogLink = computed(() => `/${currentLang.value}/blog`)
const newsLink = computed(() => `/${currentLang.value}/news`)
const termsLink = computed(() => `/${currentLang.value}/terms`)
const privacyLink = computed(() => `/${currentLang.value}/privacy`)

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push(homeLink.value)
  }
}

// 设置页面标题
document.title = '404 - Page Not Found | Levitrask'
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 600px;
  background: white;
  padding: 60px 40px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #e74c3c;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.error-title {
  font-size: 32px;
  color: #2c3e50;
  margin-bottom: 20px;
  font-weight: 600;
}

.error-message {
  font-size: 18px;
  color: #7f8c8d;
  margin-bottom: 40px;
  line-height: 1.6;
}

.error-actions {
  margin-bottom: 40px;
}

.btn {
  display: inline-block;
  padding: 12px 30px;
  margin: 0 10px;
  border-radius: 25px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(149, 165, 166, 0.3);
}

.helpful-links {
  border-top: 1px solid #ecf0f1;
  padding-top: 30px;
}

.helpful-links h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 20px;
}

.helpful-links ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.helpful-links li {
  display: inline-block;
  margin: 0 15px;
}

.helpful-links a {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.helpful-links a:hover {
  color: #2980b9;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .not-found-content {
    padding: 40px 20px;
  }
  
  .error-code {
    font-size: 80px;
  }
  
  .error-title {
    font-size: 24px;
  }
  
  .error-message {
    font-size: 16px;
  }
  
  .btn {
    display: block;
    margin: 10px 0;
    width: 100%;
  }
  
  .helpful-links li {
    display: block;
    margin: 10px 0;
  }
}
</style>
