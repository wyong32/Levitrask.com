<template>
  <nav class="side-nav">
    <a
      v-for="section in sections"
      :key="section.id"
      class="tab"
      :class="{ active: activeSectionId === section.id }"
      @click="handleLinkClick(section.id)"
    >
      {{ section.title }}
    </a>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 定义 props
const props = defineProps({
  sections: {
    type: Array,
    required: true,
    validator: (value) => value.every((item) => typeof item === 'object' && item.id && item.title),
  },
  // 新增：接收内容区域的选择器
  contentSelector: {
    type: String,
    required: true,
  },
})

// --- 内部状态管理 ---
// 将 activeSectionId 作为内部状态
const activeSectionId = ref(props.sections.length > 0 ? props.sections[0].id : '')
let observer = null
let isClickScrolling = false // 标记是否为程序化（点击触发）滚动
let scrollTimeout = null // 用于重置标记的定时器

// --- 内部方法 ---
// 函数：滚动到指定 ID 的元素 (现在是内部方法)
function handleLinkClick(sectionId) {
  isClickScrolling = true // 滚动前设置标记
  activeSectionId.value = sectionId // 立即更新高亮

  const element = document.getElementById(sectionId)
  if (element) {
    // 确保目标元素存在于 DOM 中
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    console.warn(`SideNav: Element with ID '${sectionId}' not found for scrolling.`)
    // 即使找不到元素，也重置标志，避免卡住
    isClickScrolling = false
    return
  }

  // 延迟后重置标记
  clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    isClickScrolling = false
  }, 1000)
}

// --- 生命周期钩子 (Intersection Observer) ---
onMounted(() => {
  // 使用 nextTick 或适当延迟确保父组件内容和 v-html 渲染
  setTimeout(() => {
    let sectionsToObserve = []
    const sectionIds = props.sections.map((s) => s.id)

    // 尝试模式 1：直接查找匹配选择器且带有 ID 的元素
    sectionIds.forEach((id) => {
      // 查找同时匹配选择器和 ID 的元素
      const directMatch = document.querySelector(`${props.contentSelector}#${id}`)
      if (directMatch) {
        sectionsToObserve.push(directMatch)
      }
    })

    // 尝试模式 2：如果直接查找未找到任何 section，则查找容器并在其内部查找 section
    if (sectionsToObserve.length === 0) {
      console.log('SideNav: No direct matches found, trying container mode...') // 调试信息
      const contentContainer = document.querySelector(props.contentSelector)
      if (contentContainer) {
        sectionIds.forEach((id) => {
          const sectionEl = contentContainer.querySelector(`section#${id}`)
          if (sectionEl) {
            sectionsToObserve.push(sectionEl)
          } else {
            console.warn(
              `SideNav (Container Mode): Section element with ID '${id}' not found inside container '${props.contentSelector}'.`
            )
          }
        })
      } else {
        console.warn(
          `SideNav: Content container element not found using selector '${props.contentSelector}' for container mode.`
        )
        return // 如果容器也找不到，则无法继续
      }
    }

    if (sectionsToObserve.length === 0) {
      console.warn(
        `SideNav: No section elements found to observe using selector '${props.contentSelector}' (checked direct and container modes).`
      )
      return
    }

    console.log('SideNav: Observing elements:', sectionsToObserve) // 调试信息

    const options = {
      root: null, // 视口
      rootMargin: '-100px 0px -60% 0px', // 调整此值以确定何时触发高亮
      threshold: 0, // 元素一进入/离开边缘就触发
    }

    observer = new IntersectionObserver((entries) => {
      if (isClickScrolling) return // 忽略程序化滚动期间的触发

      // 查找当前与视口交叉比例最大的入口
      let bestEntry = null
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
            bestEntry = entry
          }
        }
      })

      // 如果找到了最佳入口，则更新 activeSectionId
      if (bestEntry) {
        activeSectionId.value = bestEntry.target.id
      }
    }, options)

    // 观察找到的 section 元素
    sectionsToObserve.forEach((sectionEl) => {
      observer.observe(sectionEl)
    })
  }, 200) // 可以稍微增加延迟，确保 v-html 完成
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  clearTimeout(scrollTimeout)
})
</script>

<style scoped>
/* 左侧固定导航栏 */
.side-nav {
  flex: 1;
  position: sticky;
  top: 100px; /* 匹配页眉高度 + 一些外边距 */
  height: fit-content;
  align-self: flex-start;
  padding-right: 1.5rem;
  border-right: 1px solid #dee2e6;
}

.side-nav .tab {
  display: block;
  padding: 0.6rem 0;
  margin-bottom: 0.5rem;
  color: #495057;
  text-decoration: none;
  font-size: 0.95rem;
  border-bottom: none;
  transition: color 0.2s ease, font-weight 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
  border-right: 3px solid transparent;
  padding-right: 1rem;
}

.side-nav .tab:hover {
  color: #0056b3;
}

/* 活动链接的样式 */
.side-nav .tab.active {
  color: #007bff;
  font-weight: 600;
  border-right-color: #007bff;
}
</style> 