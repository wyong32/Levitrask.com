<template>
  <header class="page-header">
    <div class="container">
      <router-link to="/" class="logo">
        <img src="/images/logo.png" alt="Levitrask Logo" class="logo-image" />
        <span class="logo-text">Levitrask.com</span>
      </router-link>

      <!-- 汉堡包菜单按钮 (仅移动端显示) -->
      <button @click="toggleMobileMenu" class="mobile-menu-button">
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
      </button>

      <!-- 常规导航 (桌面端显示) -->
      <nav class="main-nav desktop-nav">
        <!-- Levitra 链接 -->
        <router-link to="/">Levitra</router-link>

        <!-- 第一个下拉菜单：Drugs in this Class -->
        <div
          class="nav-item dropdown-container"
          @mouseenter="isBlogDropdownOpen = true"
          @mouseleave="isBlogDropdownOpen = false"
        >
          <a class="dropdown-trigger" :class="{ 'active-dropdown': isBlogActive }"
            >Such drugs <span class="arrow" :class="{ rotated: isBlogDropdownOpen }">▼</span></a
          >
          <transition name="fade">
            <div class="dropdown-menu" v-show="isBlogDropdownOpen">
              <router-link to="/Viagra" class="dropdown-item">Viagra (sildenafil) </router-link>
              <router-link to="/Cialis" class="dropdown-item">Cialis (tadalafil)</router-link>
              <router-link to="/Stendra" class="dropdown-item">Stendra (avanafil)</router-link>
            </div>
          </transition>
        </div>

        <!-- 第二个下拉菜单：药物比较 -->
        <div
          class="nav-item dropdown-container"
          @mouseenter="isComparisonDropdownOpen = true"
          @mouseleave="isComparisonDropdownOpen = false"
        >
          <a class="dropdown-trigger" :class="{ 'active-dropdown': isComparisonActive }"
            >Drug Comparison
            <span class="arrow" :class="{ rotated: isComparisonDropdownOpen }">▼</span></a
          >
          <transition name="fade">
            <div class="dropdown-menu" v-show="isComparisonDropdownOpen">
              <router-link to="/Levitra-vs-Viagra" class="dropdown-item"
                >Levitra vs Viagra</router-link
              >
              <router-link to="/Levitra-vs-Cialis" class="dropdown-item"
                >Levitra vs Cialis</router-link
              >
              <router-link to="/Levitra-vs-Stendra" class="dropdown-item"
                >Levitra vs Stendra</router-link
              >
              <router-link to="/Cialis-vs-Viagra" class="dropdown-item"
                >Cialis vs Viagra</router-link
              >
              <router-link to="/Cialis-vs-Stendra" class="dropdown-item"
                >Cialis vs Stendra</router-link
              >
              <router-link to="/Stendra-vs-Viagra" class="dropdown-item"
                >Stendra vs Viagra</router-link
              >
            </div>
          </transition>
        </div>

        <!-- 其他常规链接 -->
        <router-link to="/news">News</router-link>
        <router-link to="/blog">Blog</router-link>

        <!-- NEW Online Dropdown -->
        <div
          class="nav-item dropdown-container"
          @mouseenter="isOnlineDropdownOpen = true"
          @mouseleave="isOnlineDropdownOpen = false"
        >
          <a class="dropdown-trigger" :class="{ 'active-dropdown': isOnlineActive }"
            >Buy Online <span class="arrow" :class="{ rotated: isOnlineDropdownOpen }">▼</span></a
          >
          <transition name="fade">
            <div class="dropdown-menu" v-show="isOnlineDropdownOpen">
              <router-link to="/Buy-Levitra-Online" class="dropdown-item"
                >Levitra (vardenafil)</router-link
              >
              <router-link to="/Buy-Viagra-Online" class="dropdown-item"
                >Viagra (sildenafil)</router-link
              >
              <router-link to="/Buy-Cialis-Online" class="dropdown-item"
                >Cialis (tadalafil)</router-link
              >
              <router-link to="/Buy-Stendra-Online" class="dropdown-item"
                >Stendra (avanafil)</router-link
              >
            </div>
          </transition>
        </div>
      </nav>

      <!-- 移动端导航菜单 (点击汉堡按钮展开) -->
      <transition name="slide-fade">
        <nav v-if="isMobileMenuOpen" class="mobile-nav">
          <router-link to="/" @click="closeMobileMenu">Levitra</router-link>

          <!-- 移动端下拉菜单：Drugs in this Class (简化版) -->
          <div class="mobile-nav-section">
            <button @click="toggleMobileSubmenu('drugs')" class="mobile-submenu-trigger">
              Drugs in this Class
              <span class="arrow" :class="{ rotated: mobileSubmenuOpen === 'drugs' }">▼</span>
            </button>
            <div v-if="mobileSubmenuOpen === 'drugs'" class="mobile-submenu">
              <router-link to="/Cialis" @click="closeMobileMenu">Cialis Details</router-link>
              <router-link to="/Stendra" @click="closeMobileMenu">Stendra Details</router-link>
              <router-link to="/Viagra" @click="closeMobileMenu">Viagra Details</router-link>
            </div>
          </div>

          <!-- 移动端下拉菜单：Drug Comparison (简化版) -->
          <div class="mobile-nav-section">
            <button @click="toggleMobileSubmenu('compare')" class="mobile-submenu-trigger">
              Drug Comparison
              <span class="arrow" :class="{ rotated: mobileSubmenuOpen === 'compare' }">▼</span>
            </button>
            <div v-if="mobileSubmenuOpen === 'compare'" class="mobile-submenu">
              <router-link to="/Levitra-vs-Viagra" @click="closeMobileMenu"
                >Levitra vs Viagra</router-link
              >
              <router-link to="/Levitra-vs-Cialis" @click="closeMobileMenu"
                >Levitra vs Cialis</router-link
              >
              <router-link to="/Levitra-vs-Stendra" @click="closeMobileMenu"
                >Levitra vs Stendra</router-link
              >
              <router-link to="/Cialis-vs-Viagra" @click="closeMobileMenu"
                >Cialis vs Viagra</router-link
              >
              <router-link to="/Cialis-vs-Stendra" @click="closeMobileMenu"
                >Cialis vs Stendra</router-link
              >
              <router-link to="/Stendra-vs-Viagra" @click="closeMobileMenu"
                >Stendra vs Viagra</router-link
              >
            </div>
          </div>

          <router-link to="/news" @click="closeMobileMenu">News</router-link>
          <router-link to="/blog" @click="closeMobileMenu">Blog</router-link>

          <!-- NEW Mobile Online Submenu -->
          <div class="mobile-nav-section">
            <button @click="toggleMobileSubmenu('online')" class="mobile-submenu-trigger">
              Buy Online
              <span class="arrow" :class="{ rotated: mobileSubmenuOpen === 'online' }">▼</span>
            </button>
            <div v-if="mobileSubmenuOpen === 'online'" class="mobile-submenu">
              <router-link to="/Buy-Levitra-Online" @click="closeMobileMenu"
                >Levitra (vardenafil)</router-link
              >
              <router-link to="/Buy-Viagra-Online" @click="closeMobileMenu"
                >Viagra (sildenafil)</router-link
              >
              <router-link to="/Buy-Cialis-Online" @click="closeMobileMenu"
                >Cialis (tadalafil)</router-link
              >
              <router-link to="/Buy-Stendra-Online" @click="closeMobileMenu"
                >Stendra (avanafil)</router-link
              >
            </div>
          </div>
        </nav>
      </transition>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

// 控制桌面下拉菜单显示状态
const isComparisonDropdownOpen = ref(false)
const isBlogDropdownOpen = ref(false)
const isOnlineDropdownOpen = ref(false)

// 控制移动菜单显示状态
const isMobileMenuOpen = ref(false)
const mobileSubmenuOpen = ref(null) // 'drugs', 'compare', 'online' or null

// 获取当前路由信息
const route = useRoute()

// 计算属性：判断药物比较下拉菜单是否应处于活动状态
const isComparisonActive = computed(() => {
  // Updated to include new comparison route names
  return [
    'compare-levitra-cialis',
    'compare-levitra-stendra',
    'compare-levitra-viagra',
    'compare-cialis-stendra',
    'compare-cialis-viagra',
    'compare-stendra-viagra',
  ].includes(route.name)
})

// 计算属性：判断博客下拉菜单是否应处于活动状态
const isBlogActive = computed(() => {
  return route.name?.endsWith('-blog') || route.path.startsWith('/drugs/')
})

// 计算属性：判断在线下拉菜单是否应处于活动状态
const isOnlineActive = computed(() => {
  return route.path.startsWith('/online/') || route.path === '/Buy-Levitra-Online'
})

// 切换移动菜单显示/隐藏
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  if (!isMobileMenuOpen.value) {
    mobileSubmenuOpen.value = null // 关闭菜单时重置子菜单
  }
}

// 关闭移动菜单（例如，点击链接后）
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  mobileSubmenuOpen.value = null
}

// 切换移动端子菜单
const toggleMobileSubmenu = (menuName) => {
  if (mobileSubmenuOpen.value === menuName) {
    mobileSubmenuOpen.value = null // 点击已打开的，则关闭
  } else {
    mobileSubmenuOpen.value = menuName // 打开点击的那个
  }
}
</script>

<style scoped>
/* 页眉样式 */
.page-header {
  display: flex;
  justify-content: center; /* 让 container 居中 */
  align-items: center;
  padding: 0 1rem; /* 减少移动端左右 padding */
  background-color: #fff;
  border-bottom: 1px solid #dee2e6;
  position: sticky;
  top: 0;
  z-index: 1000;
  height: 60px; /* 固定页眉高度 */
}

.page-header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  width: 100%;
  height: 100%; /* 继承页眉高度 */
}

.logo {
  display: flex; /* Use flexbox for alignment */
  align-items: center; /* Vertically center items */
  font-size: 1.3rem; /* 轻微减小移动端 logo 大小 */
  font-weight: bold;
  color: #343a40; /* Logo 颜色 */
  text-decoration: none;
}

/* Add styles for the logo image and text */
.logo-image {
  height: 60px; /* Adjust height as needed */
  width: auto; /* Maintain aspect ratio */
  margin-right: 8px; /* Add some space between image and text */
}

/* 桌面导航样式 */
.main-nav.desktop-nav {
  display: none; /* 默认隐藏 */
  align-items: center;
  height: 100%;
}

/* 基础导航链接样式 (适用于 router-link 和下拉触发器) */
.desktop-nav > a,
.desktop-nav .dropdown-trigger {
  display: inline-flex; /* 使用 flex 垂直居中内部文本/箭头 */
  align-items: center;
  height: 100%; /* 撑满页眉高度 */
  margin-left: 1.5rem;
  text-decoration: none;
  color: #007bff;
  cursor: pointer;
  padding: 0 0.5rem; /* 调整左右 padding */
  transition: color 0.2s ease, border-bottom-color 0.2s ease;
  border-bottom: 3px solid transparent; /* 增加底部边框厚度并给普通链接留位 */
  box-sizing: border-box; /* 确保 padding 和 border 不增加高度 */
}
.desktop-nav > a:hover,
.desktop-nav .dropdown-trigger:hover {
  color: #0056b3;
  text-decoration: none;
}

/* 当前活动路由链接样式 */
.desktop-nav > .router-link-active {
  /* Target direct children only */
  color: #343a40;
  font-weight: 600;
  border-bottom-color: #007bff;
  cursor: default;
}

/* 新增：下拉菜单触发器的活动状态样式 */
.desktop-nav .dropdown-trigger.active-dropdown {
  color: #343a40;
  font-weight: 600;
  border-bottom-color: #007bff; /* 应用与 router-link-active 相同的下划线 */
}

/* 下拉菜单容器 */
.dropdown-container {
  position: relative; /* 为绝对定位的下拉菜单提供基准 */
  display: inline-flex; /* 与其他导航项对齐 */
  align-items: center;
  height: 100%;
}

.arrow {
  font-size: 0.7em;
  margin-left: 0.4em; /* Slightly increased margin */
  transition: transform 0.3s ease;
}
.arrow.rotated {
  transform: rotate(180deg);
}

/* 下拉菜单 */
.dropdown-menu {
  position: absolute;
  top: 95%; /* Slightly overlap the trigger */
  left: 50%; /* Start from center */
  transform: translateX(-50%); /* Center align */
  background-color: white;
  border: 1px solid #e0e0e0; /* Slightly softer border */
  border-radius: 8px; /* Slightly larger radius */
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1); /* Adjusted shadow */
  padding: 0; /* Remove padding, rely on item padding */
  min-width: 200px; /* Increased width */
  z-index: 1001;
  display: block;
  overflow: hidden; /* Ensure border-radius clips items */
  text-align: center;
}

/* 下拉菜单项 */
.dropdown-item {
  display: block;
  padding: 1rem 1.75rem; /* Increased padding */
  font-size: 1.05rem; /* Increased font size */
  color: #444; /* Slightly darker text */
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.2s ease, color 0.2s ease;
  border-bottom: 1px solid #eee; /* Add bottom border */
}

/* Remove border from the last item */
.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background-color: #007bff;
  color: white;
}

/* 下拉菜单中的活动链接 */
.dropdown-item.router-link-active {
  background-color: #f8f9fa; /* Light background for active */
  color: #0056b3;
  font-weight: 600;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) translateX(-50%); /* Adjust transform origin */
}

/* 汉堡包菜单按钮样式 */
.mobile-menu-button {
  display: block; /* 默认显示 (将在媒体查询中隐藏) */
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}
.mobile-menu-button .icon-bar {
  display: block;
  width: 22px;
  height: 2px;
  background-color: #343a40;
  margin: 4px 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* 可选：汉堡包按钮动画 (当菜单打开时变为 X) */
.mobile-nav-open .mobile-menu-button .icon-bar:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}
.mobile-nav-open .mobile-menu-button .icon-bar:nth-child(2) {
  opacity: 0;
}
.mobile-nav-open .mobile-menu-button .icon-bar:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

/* 移动端导航菜单样式 */
.mobile-nav {
  position: absolute;
  top: 60px; /* 页眉高度 */
  left: 0;
  right: 0;
  background-color: white;
  border-top: 1px solid #dee2e6;
  border-bottom: 1px solid #dee2e6;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  z-index: 999;
  display: flex;
  flex-direction: column;
}
.mobile-nav a {
  display: block;
  padding: 1rem;
  text-decoration: none;
  color: #343a40;
  border-bottom: 1px solid #f1f1f1;
}
.mobile-nav a:hover {
  background-color: #f8f9fa;
}
.mobile-nav a.router-link-active {
  background-color: #e9ecef;
  font-weight: bold;
}
.mobile-nav-section {
  border-bottom: 1px solid #f1f1f1;
}
.mobile-submenu-trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 1rem;
  background: none;
  border: none;
  text-align: left;
  font-size: 1rem;
  color: #343a40;
  cursor: pointer;
}
.mobile-submenu-trigger:hover {
  background-color: #f8f9fa;
}
.mobile-submenu {
  padding-left: 1rem; /* 子菜单缩进 */
  background-color: #fdfdfd;
}
.mobile-submenu a {
  padding: 0.8rem 1rem 0.8rem 2rem; /* 调整 padding */
  font-size: 0.95rem;
  border-bottom: 1px solid #f8f8f8;
}
.mobile-submenu a:last-child {
  border-bottom: none;
}

/* 移动菜单过渡动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* 桌面端断点 (例如 992px) */
@media (min-width: 992px) {
  .page-header {
    padding: 0 2rem; /* 恢复桌面 padding */
  }
  .logo {
    font-size: 1.5rem; /* 恢复桌面 logo 大小 */
  }
  .main-nav.desktop-nav {
    display: flex; /* 桌面显示常规导航 */
  }
  .mobile-menu-button {
    display: none; /* 桌面隐藏汉堡按钮 */
  }
  .mobile-nav {
    display: none; /* 桌面隐藏移动菜单 */
  }
}
</style> 