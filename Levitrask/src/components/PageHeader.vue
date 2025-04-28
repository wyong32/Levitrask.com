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
        <router-link :to="{ name: 'home', params: { lang: locale.value } }">{{ $t('navigation.home') }}</router-link>

        <!-- 第一个下拉菜单：Drugs in this Class (DYNAMIC) -->
        <div class="nav-item dropdown-container" @mouseenter="isBlogDropdownOpen = true" @mouseleave="isBlogDropdownOpen = false">
          <a class="dropdown-trigger" :class="{ 'active-dropdown': isDrugActive }">{{ $t('navigation.dropdownDrugs') }} <span class="arrow" :class="{ rotated: isBlogDropdownOpen }">▼</span></a>
          <transition name="fade">
            <div class="dropdown-menu" v-show="isBlogDropdownOpen">
              <!-- Dynamic links using v-for -->
              <router-link
                v-for="page in drugLinks"
                :key="page.page_identifier"
                :to="{ name: 'managed-page-detail', params: { lang: locale.value, identifier: page.page_identifier } }"
                class="dropdown-item">
                {{ page.list_title }}
              </router-link>
              <!-- Show message if no links are loaded -->
              <span v-if="!isLoadingDropdowns && drugLinks.length === 0" class="dropdown-item disabled">No pages found</span>
              <span v-if="isLoadingDropdowns" class="dropdown-item disabled">Loading...</span>
            </div>
          </transition>
        </div>

        <!-- 第二个下拉菜单：药物比较 (DYNAMIC) -->
        <div class="nav-item dropdown-container" @mouseenter="isComparisonDropdownOpen = true" @mouseleave="isComparisonDropdownOpen = false">
          <a class="dropdown-trigger" :class="{ 'active-dropdown': isComparisonActive }">{{ $t('navigation.dropdownCompare') }} <span class="arrow" :class="{ rotated: isComparisonDropdownOpen }">▼</span></a>
          <transition name="fade">
            <div class="dropdown-menu" v-show="isComparisonDropdownOpen">
              <!-- Dynamic links -->
              <router-link
                v-for="page in comparisonLinks"
                :key="page.page_identifier"
                :to="{ name: 'managed-page-detail', params: { lang: locale.value, identifier: page.page_identifier } }"
                class="dropdown-item">
                {{ page.list_title }}
              </router-link>
              <span v-if="!isLoadingDropdowns && comparisonLinks.length === 0" class="dropdown-item disabled">No pages found</span>
              <span v-if="isLoadingDropdowns" class="dropdown-item disabled">Loading...</span>
            </div>
          </transition>
        </div>

        <!-- 其他常规链接 (使用翻译) -->
        <router-link :to="{ name: 'news', params: { lang: locale.value } }">{{ $t('navigation.news') }}</router-link>
        <router-link :to="{ name: 'blog', params: { lang: locale.value } }">{{ $t('navigation.blog') }}</router-link>

        <!-- Online Dropdown (DYNAMIC) -->
        <div class="nav-item dropdown-container" @mouseenter="isOnlineDropdownOpen = true" @mouseleave="isOnlineDropdownOpen = false">
          <a class="dropdown-trigger" :class="{ 'active-dropdown': isOnlineActive }">{{ $t('navigation.dropdownOnline') }} <span class="arrow" :class="{ rotated: isOnlineDropdownOpen }">▼</span></a>
          <transition name="fade">
            <div class="dropdown-menu" v-show="isOnlineDropdownOpen">
              <!-- Dynamic links -->
               <router-link
                 v-for="page in buyOnlineLinks"
                 :key="page.page_identifier"
                 :to="{ name: 'managed-page-detail', params: { lang: locale.value, identifier: page.page_identifier } }"
                 class="dropdown-item">
                 {{ page.list_title }}
               </router-link>
               <span v-if="!isLoadingDropdowns && buyOnlineLinks.length === 0" class="dropdown-item disabled">No pages found</span>
               <span v-if="isLoadingDropdowns" class="dropdown-item disabled">Loading...</span>
            </div>
          </transition>
        </div>

        <!-- 语言切换下拉菜单 -->
        <el-dropdown trigger="click" @command="changeLanguage" class="language-dropdown">
           <span class="el-dropdown-link">
              {{ currentLanguageName }} <el-icon class="el-icon--right"><arrow-down /></el-icon>
           </span>
           <template #dropdown>
             <el-dropdown-menu>
               <el-dropdown-item v-for="lang in availableLanguages" :key="lang.code" :command="lang.code" :disabled="locale === lang.code">
                  {{ lang.name }}
               </el-dropdown-item>
             </el-dropdown-menu>
           </template>
         </el-dropdown>
      </nav>

      <!-- 移动端导航菜单 (点击汉堡按钮展开) -->
      <transition name="slide-fade">
        <nav v-if="isMobileMenuOpen" class="mobile-nav">
          <router-link :to="{ name: 'home', params: { lang: locale.value } }" @click="closeMobileMenu">Levitra</router-link>

          <!-- 移动端下拉菜单：Drugs in this Class (DYNAMIC) -->
          <div class="mobile-nav-section">
            <button @click="toggleMobileSubmenu('drugs')" class="mobile-submenu-trigger">
               {{ $t('navigation.dropdownDrugs') }}
              <span class="arrow" :class="{ rotated: mobileSubmenuOpen === 'drugs' }">▼</span>
            </button>
            <div v-if="mobileSubmenuOpen === 'drugs'" class="mobile-submenu">
               <!-- Dynamic links using v-for -->
               <router-link
                 v-for="page in drugLinks"
                 :key="page.page_identifier"
                 :to="{ name: 'managed-page-detail', params: { lang: locale.value, identifier: page.page_identifier } }"
                 @click="closeMobileMenu">
                 {{ page.list_title }}
               </router-link>
               <!-- Show message if no links are loaded -->
               <span v-if="!isLoadingDropdowns && drugLinks.length === 0" class="mobile-submenu-item disabled">No pages found</span>
               <span v-if="isLoadingDropdowns" class="mobile-submenu-item disabled">Loading...</span>
            </div>
          </div>

          <!-- 移动端下拉菜单：Drug Comparison (DYNAMIC) -->
          <div class="mobile-nav-section">
            <button @click="toggleMobileSubmenu('compare')" class="mobile-submenu-trigger">
              {{ $t('navigation.dropdownCompare') }}
              <span class="arrow" :class="{ rotated: mobileSubmenuOpen === 'compare' }">▼</span>
            </button>
            <div v-if="mobileSubmenuOpen === 'compare'" class="mobile-submenu">
               <!-- Dynamic links -->
               <router-link
                 v-for="page in comparisonLinks"
                 :key="page.page_identifier"
                 :to="{ name: 'managed-page-detail', params: { lang: locale.value, identifier: page.page_identifier } }"
                 @click="closeMobileMenu">
                 {{ page.list_title }}
               </router-link>
               <span v-if="!isLoadingDropdowns && comparisonLinks.length === 0" class="mobile-submenu-item disabled">No pages found</span>
               <span v-if="isLoadingDropdowns" class="mobile-submenu-item disabled">Loading...</span>
            </div>
          </div>

          <router-link :to="{ name: 'news', params: { lang: locale.value } }" @click="closeMobileMenu">News</router-link>
          <router-link :to="{ name: 'blog', params: { lang: locale.value } }" @click="closeMobileMenu">Blog</router-link>

          <!-- Mobile Online Submenu (DYNAMIC) -->
          <div class="mobile-nav-section">
            <button @click="toggleMobileSubmenu('online')" class="mobile-submenu-trigger">
              {{ $t('navigation.dropdownOnline') }}
              <span class="arrow" :class="{ rotated: mobileSubmenuOpen === 'online' }">▼</span>
            </button>
            <div v-if="mobileSubmenuOpen === 'online'" class="mobile-submenu">
               <!-- Dynamic links -->
                <router-link
                  v-for="page in buyOnlineLinks"
                  :key="page.page_identifier"
                  :to="{ name: 'managed-page-detail', params: { lang: locale.value, identifier: page.page_identifier } }"
                  @click="closeMobileMenu">
                  {{ page.list_title }}
                </router-link>
               <span v-if="!isLoadingDropdowns && buyOnlineLinks.length === 0" class="mobile-submenu-item disabled">No pages found</span>
               <span v-if="isLoadingDropdowns" class="mobile-submenu-item disabled">Loading...</span>
            </div>
          </div>
        </nav>
      </transition>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowDown } from '@element-plus/icons-vue'
import axios from 'axios'

// --- i18n --- 
const { locale, t } = useI18n();

const route = useRoute();
const router = useRouter();

// Define available languages HERE, reflecting router/i18n config
const availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '中文 (简体)' },
  { code: 'ru', name: 'Русский' } // Added Russian
];

// 计算属性，显示当前语言的名称
const currentLanguageName = computed(() => {
  const current = availableLanguages.find(lang => lang.code === locale.value);
  return current ? current.name : locale.value;
});

// 切换语言的方法
const changeLanguage = (langCode) => {
  console.log(`Attempting to change language to: ${langCode}`);
  const currentRoute = route; // Get current route information
  const currentLang = locale.value;

  if (langCode !== currentLang) {
    console.log(`Navigating from ${currentLang} to ${langCode} for route: ${currentRoute.name}`);
    // 使用 router.push 进行导航，替换 lang 参数
    router.push({
      name: currentRoute.name, 
      params: { ...currentRoute.params, lang: langCode }, // 保留现有参数，更新 lang
      query: currentRoute.query, // 保留查询参数
      hash: currentRoute.hash // 保留哈希
    }).catch(err => {
        // 捕获潜在的导航错误 (例如，如果路由不存在或守卫阻止)
        console.error('Navigation error during language change:', err);
    });
    // 注意：不再需要手动设置 locale 或 localStorage，导航守卫会处理
    // locale.value = langCode;
    // localStorage.setItem('user-locale', langCode); 
  }
};

// --- State for dynamic links ---
const drugLinks = ref([]);
const comparisonLinks = ref([]);
const buyOnlineLinks = ref([]);
const isLoadingDropdowns = ref(false);

// --- API Setup ---
const baseUrl = import.meta.env.VITE_API_BASE_URL || ''; // Default to empty string for local proxy
const api = axios.create({ baseURL: baseUrl });

// --- Fetch Dynamic Links Function ---
const fetchDropdownLinks = async (type) => {
  isLoadingDropdowns.value = true;
  console.log(`Fetching dropdown links for type: ${type}`);
  try {
    const response = await api.get(`/api/managed-pages`, {
      params: {
        type: type,
        lang: locale.value
      }
    });
    if (type === 'drug') {
      drugLinks.value = response.data || [];
    } else if (type === 'comparison') {
      comparisonLinks.value = response.data || [];
    } else if (type === 'buy-online') {
      buyOnlineLinks.value = response.data || [];
    }
    console.log(`Fetched dropdown links for type ${type} (lang: ${locale.value}):`, response.data);
  } catch (error) {
    console.error(`Error fetching dropdown links for type ${type}:`, error);
    if (type === 'drug') {
      drugLinks.value = [];
    } else if (type === 'comparison') {
      comparisonLinks.value = [];
    } else if (type === 'buy-online') {
      buyOnlineLinks.value = [];
    }
  } finally {
    isLoadingDropdowns.value = false;
  }
};

// 控制桌面下拉菜单显示状态
const isComparisonDropdownOpen = ref(false)
const isBlogDropdownOpen = ref(false)
const isOnlineDropdownOpen = ref(false)

// 控制移动菜单显示状态
const isMobileMenuOpen = ref(false)
const mobileSubmenuOpen = ref(null) // 'drugs', 'compare', 'online' or null

// --- Computed properties for dropdown active states (UPDATED) ---

// 计算属性：判断药物比较下拉菜单是否应处于活动状态
const isComparisonActive = computed(() => {
  // Check specific comparison routes if they still exist
  const comparisonRouteNames = [
    'compare-levitra-cialis',
    'compare-levitra-stendra',
    'compare-levitra-viagra',
    'compare-cialis-stendra',
    'compare-cialis-viagra',
    'compare-stendra-viagra',
  ];
  const isLegacyComparisonRoute = comparisonRouteNames.includes(route.name);

  // Check if the current route is a managed page detail AND its identifier is in the comparisonLinks array
  const isManagedComparisonPage = 
    route.name === 'managed-page-detail' &&
    comparisonLinks.value.some(link => link.page_identifier === route.params.identifier);

  return isLegacyComparisonRoute || isManagedComparisonPage;
});

// 计算属性：判断"药物"下拉菜单是否应处于活动状态 (Renamed from isBlogActive for clarity)
const isDrugActive = computed(() => { // Renamed from isBlogActive
  // Check specific legacy drug routes if they exist (e.g., routes ending in -blog)
  const legacyDrugRoutes = route.name?.endsWith('-blog'); 

  // Check if the current route is a managed page detail AND its identifier is in the drugLinks array
  const isManagedDrugPage = 
    route.name === 'managed-page-detail' &&
    drugLinks.value.some(link => link.page_identifier === route.params.identifier);

  return legacyDrugRoutes || isManagedDrugPage;
});

// 计算属性：判断在线下拉菜单是否应处于活动状态
const isOnlineActive = computed(() => {
  // Check specific online routes if they exist
  const onlineRouteNames = [
      'buy-levitra-online', 
      'buy-viagra-online', 
      'buy-cialis-online', 
      'buy-stendra-online'
  ];
  const isLegacyOnlineRoute = onlineRouteNames.includes(route.name);

  // Check if the current route is a managed page detail AND its identifier is in the buyOnlineLinks array
  const isManagedOnlinePage = 
    route.name === 'managed-page-detail' &&
    buyOnlineLinks.value.some(link => link.page_identifier === route.params.identifier);

  return isLegacyOnlineRoute || isManagedOnlinePage;
});

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

// --- Lifecycle Hook (NEW) ---
onMounted(async () => {
    isLoadingDropdowns.value = true;
    try {
      await Promise.all([
        fetchDropdownLinks('drug'), 
        fetchDropdownLinks('comparison'), 
        fetchDropdownLinks('buy-online')
      ]);
    } finally {
       isLoadingDropdowns.value = false;
    }
});

// Watch for route changes to update active state and potentially language?
// Watching locale changes might be needed if i18n setup doesn't automatically update components
watch(locale, (newLocale, oldLocale) => {
  // Prevent refetching if locale didn't actually change
  if (newLocale && newLocale !== oldLocale) {
     console.log(`Locale changed in header from ${oldLocale} to ${newLocale}, refetching dropdowns...`);
     // Refetch all dropdown data when locale changes
     // Add loading state handling if desired
     isLoadingDropdowns.value = true; // Show loading indicator
     Promise.all([
       fetchDropdownLinks('drug'),
       fetchDropdownLinks('comparison'),
       fetchDropdownLinks('buy-online')
     ]).finally(() => {
         isLoadingDropdowns.value = false; // Hide loading indicator after all fetches complete
     });
  }
});
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

/* 当前活动路由链接样式 - Use exact active */
.desktop-nav > .router-link-exact-active {
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
/* Use exact active for mobile links */
.mobile-nav a.router-link-exact-active {
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

/* 语言切换下拉菜单样式 */
.language-dropdown {
  margin-left: 1rem; /* 与其他导航项保持一些距离 */
  cursor: pointer;
}

.el-dropdown-link {
  color: #333; /* 调整颜色以匹配页眉背景 */
  display: flex;
  align-items: center;
}

.dropdown-item.disabled,
.mobile-submenu-item.disabled {
    color: #aaa;
    cursor: default;
    pointer-events: none; /* Prevent clicks */
}
</style> 