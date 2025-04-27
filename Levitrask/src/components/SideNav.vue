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
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

// 定义 props (恢复原始状态)
const props = defineProps({
  sections: {
    type: Array,
    required: true,
    // 基础验证，确保是对象数组且有 id 和 title
    validator: (value) => value.every((item) => typeof item === 'object' && item.id && item.title),
  },
  contentSelector: {
    type: String,
    required: true,
  },
})

// --- 内部状态管理 ---
const activeSectionId = ref('')
let observer = null
let isClickScrolling = false // 标记是否为程序化（点击触发）滚动
let scrollTimeout = null // 用于重置标记的定时器
let currentObservedElements = []; // 存储当前观察的元素

// --- 滚动处理 ---
function handleLinkClick(sectionId) {
  isClickScrolling = true
  activeSectionId.value = sectionId // 立即更新高亮

  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    console.warn(`SideNav: Element with ID '${sectionId}' not found for scrolling.`)
    isClickScrolling = false
    return
  }

  clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    isClickScrolling = false
  }, 1000) // 1秒后重置标记
}

// --- Intersection Observer 设置 --- 
function setupIntersectionObserver() {
  disconnectObserver(); // 先断开旧的

  if (!props.sections || props.sections.length === 0) {
    console.log('[SideNav] No sections provided to observe.');
    return;
  }

  const sectionIds = props.sections.map((s) => s.id);
  let sectionsToObserve = [];

  // 查找 contentSelector 内匹配 ID 的元素
  const contentContainer = document.querySelector(props.contentSelector);
  if (contentContainer) {
    sectionIds.forEach((id) => {
      // 查找 ID 完全匹配的元素，不限定必须是 <section>
      const sectionEl = contentContainer.querySelector(`#${CSS.escape(id)}`);
      if (sectionEl) {
        sectionsToObserve.push(sectionEl);
      } else {
        console.warn(`[SideNav] Section element with ID '${id}' not found inside container '${props.contentSelector}'.`);
      }
    });
  } else {
    console.warn(`[SideNav] Content container element not found using selector '${props.contentSelector}'.`);
    return; 
  }

  if (sectionsToObserve.length === 0) {
    console.warn(`[SideNav] No section elements found to observe within '${props.contentSelector}'.`);
    return;
  }

  currentObservedElements = sectionsToObserve;
  console.log('[SideNav] Setting up IntersectionObserver for elements:', currentObservedElements);

  const options = {
    root: null, // 视口
    // rootMargin 决定了元素距离视口边缘多远时触发，可以调整
    // 负顶部边距: 元素顶部进入视口下方 100px 时触发
    // 负底部边距: 元素底部离开视口上方 60% 时触发 (即元素在视口上方 40% 可见时仍高亮)
    rootMargin: '-100px 0px -60% 0px',
    threshold: 0, // 元素开始进入或离开时触发
  };

  observer = new IntersectionObserver((entries) => {
    if (isClickScrolling) return; // 忽略点击滚动触发的事件

    let bestEntry = null;
    // 查找所有在视口内且交叉比例最大的元素
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
          bestEntry = entry;
        }
      }
    });

    if (bestEntry) {
      activeSectionId.value = bestEntry.target.id;
    } else {
        // 如果没有元素在视口内，可以选择取消高亮或保持上一个高亮
        // activeSectionId.value = ''; // 取消高亮
    }
  }, options);

  currentObservedElements.forEach((sectionEl) => {
    observer.observe(sectionEl);
  });
}

// --- 断开观察者 --- 
function disconnectObserver() {
    if (observer) {
        // console.log('[SideNav] Disconnecting existing IntersectionObserver.');
        currentObservedElements.forEach(el => observer.unobserve(el));
        observer.disconnect();
        observer = null;
        currentObservedElements = [];
    }
}

// --- 监听 Props 变化并重新设置观察者 ---
// 当 sections 或 contentSelector 变化时，重新设置观察者
watch(() => [props.sections, props.contentSelector], () => {
    // 使用 nextTick 确保 DOM 更新完毕
    nextTick(() => {
        // 设置初始 activeSectionId 为第一个 section (如果存在)
        activeSectionId.value = props.sections.length > 0 ? props.sections[0].id : '';
        // 重新设置观察者
        setupIntersectionObserver();
    });
}, { immediate: true, deep: true }); // immediate 确保初始加载时执行, deep 监听 sections 数组内部变化


// --- 生命周期钩子 ---
onMounted(() => {
  // 初始化逻辑已移至 watch 中
})

onUnmounted(() => {
  disconnectObserver();
  clearTimeout(scrollTimeout);
})
</script>

<style scoped>
/* 样式恢复到原始状态 */
.side-nav {
  flex: 1;
  position: sticky;
  top: 0;
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