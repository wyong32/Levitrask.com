<template>
  <div class="question-page blog-post-page">
    <PageHeader />
    <main class="content-area-3-column" v-if="question">
      <!-- 左侧边栏 (Left Sidebar) -->
      <SideNav
        :sections="question.navSections || []"
        content-selector=".post-body"
        class="sidebar-left side-nav-component"
      />

      <!-- 主内容区域 (Main Content Area) -->
      <article class="main-content-middle">
        <!-- 添加 ref="postBody" -->
        <div class="post-body" ref="postBody" v-html="question.content"></div>
      </article>

      <!-- 右侧边栏 (Right Sidebar) -->
      <DrugSidebar
        :sidebar-data="question.sidebarData || {}"
        class="sidebar-right drug-sidebar-component"
      />
    </main>
    <!-- 处理找不到问题的情况 -->
    <main v-else class="content-area-single-column">
      <div class="main-content-middle">
        <p>找不到指定的问题。</p>
      </div>
    </main>
    <PageFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '../components/PageHeader.vue' // 注意路径
import PageFooter from '../components/PageFooter.vue' // 注意路径
import SideNav from '../components/SideNav.vue' // 注意路径
import DrugSidebar from '../components/DrugSidebar.vue' // 注意路径
import allQuestionData from '../Datas/questionData.js' // 注意路径

const route = useRoute()
const router = useRouter() // 获取 router 实例
const postBody = ref(null) // 创建 ref 用于获取 .post-body 元素

// 计算属性，根据路由 id 获取当前问题
const question = computed(() => {
  const questionId = route.params.id
  return allQuestionData[questionId] || null
})

// 点击处理函数
const handleContentClick = (event) => {
  const target = event.target
  // Check if the clicked element is an <a> tag within the post body
  if (target.tagName === 'A' && target.closest('.post-body')) {
    const href = target.getAttribute('href')
    // Check if it's an internal link and different from the current path
    if (href && href.startsWith('/') && href !== route.path) {
      event.preventDefault() // Prevent default browser navigation
      router.push(href) // Use Vue Router to navigate
    }
    // External links or links to the same page will navigate normally or do nothing
  }
}

// 更新 meta 标签的函数
const updateMetaTags = (questionData) => {
  if (questionData) {
    document.title = questionData.metaTitle || questionData.listTitle || 'Question | Levitrask'
    let descriptionTag = document.querySelector('meta[name="description"]')
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta')
      descriptionTag.setAttribute('name', 'description')
      document.head.appendChild(descriptionTag)
    }
    descriptionTag.setAttribute('content', questionData.metaDescription || '')

    let keywordsTag = document.querySelector('meta[name="keywords"]')
    if (!keywordsTag) {
      keywordsTag = document.createElement('meta')
      keywordsTag.setAttribute('name', 'keywords')
      document.head.appendChild(keywordsTag)
    }
    keywordsTag.setAttribute('content', questionData.metaKeywords || '')
  } else {
    document.title = '找不到问题 | Levitrask'
    const descriptionTag = document.querySelector('meta[name="description"]')
    if (descriptionTag) descriptionTag.setAttribute('content', '')
    const keywordsTag = document.querySelector('meta[name="keywords"]')
    if (keywordsTag) keywordsTag.setAttribute('content', '')
  }
}

// 组件挂载时设置 meta 标签和事件监听
onMounted(() => {
  updateMetaTags(question.value)
  // 确保 postBody 元素存在后再添加监听器
  if (postBody.value) {
    postBody.value.addEventListener('click', handleContentClick)
  }
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  if (postBody.value) {
    postBody.value.removeEventListener('click', handleContentClick)
  }
})

// 监听路由变化或 question 数据变化
watch(
  () => route.params.id, // 监听路由参数变化
  (newId, oldId) => {
    if (newId !== oldId) {
      updateMetaTags(question.value)
      // 当问题内容更新时，可能需要重新确保监听器已附加（如果 v-if 导致元素重新渲染）
      // Vue 3 的 v-if/v-else 切换通常会触发 onMounted/onUnmounted，所以这里可能不需要再次添加
      // 但如果遇到问题，可以考虑在这里重新附加监听器
    }
  }
)

// 也监听 question 本身的变化，以防数据异步加载等情况
watch(question, (newQuestion) => {
  updateMetaTags(newQuestion)
})
</script>

<style scoped>
/* Styles copied from why-is-levitra-no-longer-available.vue and adjusted */
.blog-post-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content-area-3-column {
  display: flex;
  flex-grow: 1;
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
  gap: 2rem;
}

/* Fallback style for 'not found' message */
.content-area-single-column {
  flex-grow: 1;
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.sidebar-left {
  flex: 0 0 200px;
  height: fit-content;
  position: sticky;
  top: 80px; /* Adjust based on header height */
}

.main-content-middle {
  flex: 3;
  min-width: 0;
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.sidebar-right {
  flex: 1.5;
  height: fit-content;
  position: sticky;
  top: 80px; /* Adjust based on header height */
}

/* Styles for content rendered via v-html */
.post-body :deep(h1) {
  font-size: 2rem;
  color: #343a40;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.post-body :deep(hr) {
  border: none;
  border-top: 1px solid #eee;
  margin: 1.5rem 0;
}

.post-body :deep(section) {
  margin-bottom: 2.5rem;
  scroll-margin-top: 100px; /* Ensure SideNav links scroll correctly */
}

.post-body :deep(section:last-of-type) {
  margin-bottom: 0;
}

.post-body :deep(h2) {
  font-size: 1.5rem;
  color: #343a40;
  margin-top: 2rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.post-body :deep(h3) {
  font-size: 1.2rem;
  color: #495057;
  margin-top: 1.5rem;
  margin-bottom: 0.8rem;
}

.post-body :deep(p),
.post-body :deep(ul) {
  line-height: 1.7;
  margin-bottom: 1rem;
  color: #495057;
}

.post-body :deep(ul) {
  padding-left: 25px;
  list-style: disc; /* Ensure list style is applied */
}

.post-body :deep(li) {
  margin-bottom: 0.5rem;
}

/* Table styles from original */
.post-body :deep(.comparison-table-container) {
  overflow-x: auto;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.post-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  min-width: 400px;
}

.post-body :deep(th),
.post-body :deep(td) {
  border: 1px solid #dee2e6;
  padding: 0.75rem;
  text-align: left;
  vertical-align: top;
}

.post-body :deep(th) {
  background-color: #f8f9fa;
  font-weight: 600;
}

.post-body :deep(tbody tr:nth-child(odd)) {
  background-color: #f8f9fa;
}

.post-body :deep(tbody tr:hover) {
  background-color: #e9ecef;
}

/* Responsive adjustments */
@media (max-width: 992px) {
  .content-area-3-column {
    flex-direction: column;
    padding: 1rem;
  }
  .sidebar-left,
  .side-nav-component {
    display: none;
  }
  .main-content-middle {
    order: 1;
    padding: 1rem;
  }
  .sidebar-right,
  .drug-sidebar-component {
    order: 2;
    margin-bottom: 0;
    min-width: unset;
  }
}

@media (max-width: 768px) {
  .content-area-3-column {
    padding: 1rem;
  }
  .main-content-middle {
    padding: 1rem;
  }
  .post-body :deep(h1) {
    font-size: 1.75rem;
  }
  .post-body :deep(h2) {
    font-size: 1.3rem;
  }
}

/* Style for simple tables */
.post-body :deep(.simple-table table) {
  min-width: auto;
}

.post-body :deep(.simple-table th),
.post-body :deep(.simple-table td) {
  vertical-align: middle;
}
</style> 