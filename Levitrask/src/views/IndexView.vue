<template>
  <div class="index-view">
    <PageHeader />
    <!-- Removed main class="content-area", applying layout directly -->
    <main class="homepage-layout">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-message full-width-message">
        Loading homepage content...
      </div>
      <!-- Error State -->
      <div v-else-if="error" class="error-message full-width-message">
        Failed to load homepage: {{ error }}
      </div>

      <!-- Data Loaded State -->
      <template v-else>
        <!-- Left Sidebar for Navigation -->
        <SideNav
          v-if="navSections && navSections.length > 0"
          :sections="navSections"
          content-selector=".homepage-main-content"
          class="sidebar-left"
        />
        <!-- Placeholder if no nav -->
        <div v-else class="sidebar-left-placeholder"></div>

        <!-- Main Content Area -->
        <div class="homepage-main-content">
          <header class="drug-header">
            <h1>{{ $t('indexView.header.title') }}</h1>
            <p><strong>{{ $t('indexView.header.brandNamesLabel') }}</strong> {{ $t('indexView.header.brandNamesValue') }}</p>
            <p>
              <strong>{{ $t('indexView.header.genericNamesLabel') }}</strong> {{ $t('indexView.header.genericNamesValue') }}
            </p>
            <p><strong>{{ $t('indexView.header.pronunciationLabel') }}</strong> {{ $t('indexView.header.pronunciationValue') }}</p>
            <p><strong>{{ $t('indexView.header.drugClassLabel') }}</strong> {{ $t('indexView.header.drugClassValue') }}</p>
            <p><strong>{{ $t('indexView.header.availabilityLabel') }}</strong> {{ $t('indexView.header.availabilityValue') }}</p>
            <!-- How is it used? - integrated into text -->
          </header>

          <!-- Dynamic Content Blocks (Filtered to exclude Swiper block) -->
          <section
            v-for="block in mainContentBlocks"
            :key="block.block_id"
            :id="block.block_id"
            class="content-block"
          >
            <div v-if="block.html_content" v-html="block.html_content"></div>
            <!-- <el-divider v-if="mainContentBlocks.length > 1" /> -->
          </section>
        </div>

        <!-- Right Sidebar (Displaying fetched data) -->
        <aside class="sidebar-right">
           <div v-if="isSidebarLoading" class="sidebar-loading">Loading sidebar...</div>
           <div v-else-if="sidebarError" class="sidebar-error">{{ sidebarError }}</div>
           <div v-else-if="sidebarBlocks && sidebarBlocks.length > 0">
               <div v-for="(block, index) in sidebarBlocks" :key="`sidebar-block-${index}`" class="sidebar-block">
                   <h3 v-if="block.title">{{ block.title }}</h3>
                   <div v-html="block.html_content"></div>
               </div>
           </div>
            <div v-else class="sidebar-empty"></div> <!-- Optional: Placeholder if no sidebar content -->
        </aside>
      </template>
    </main>
    <PageFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import axios from 'axios'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '../components/PageHeader.vue'
import PageFooter from '../components/PageFooter.vue'
import SideNav from '../components/SideNav.vue' // Import SideNav


// --- Swiper Imports ---
import Swiper from 'swiper'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'

// --- State for Dynamic Content ---
const homepageBlocks = ref([])
const isLoading = ref(true)
const error = ref(null)

// --- State for Right Sidebar (NEW) ---
const sidebarBlocks = ref([]); // Array of { title: string, html_content: string }
const isSidebarLoading = ref(false);
const sidebarError = ref(null);
const HOMEPAGE_IDENTIFIER = 'home'; // Identifier for homepage sidebar

const route = useRoute(); // Get route object
const { t } = useI18n(); // Initialize useI18n

// --- API Setup ---
const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
const api = axios.create({ baseURL: baseUrl }) // Use a base URL if defined

// Helper function to build API URL (can be moved to a utils file)
const buildApiUrl = (path) => `${baseUrl}${path}`; // Ensure it uses baseUrl

// --- Fetch Homepage Blocks ---
const fetchHomepageBlocks = async (lang, retryCount = 0) => { // Accept lang parameter and retry count
  isLoading.value = true
  error.value = null
  homepageBlocks.value = []; // Clear previous blocks

  try {
    // console.log(`Fetching homepage blocks for language: ${lang} (attempt ${retryCount + 1})`);
    // Use the new public endpoint and pass the language
    const response = await api.get(buildApiUrl('/api/homepage-blocks'), {
        params: { lang: lang }, // Pass lang as query parameter
        timeout: 10000 // 10 second timeout
    })
    homepageBlocks.value = response.data || []
    // console.log('Fetched homepage blocks:', homepageBlocks.value)
  } catch (err) {
    console.error('Error fetching homepage blocks:', err)

    // 重试逻辑
    if (retryCount < 2) {
      // console.log(`Retrying homepage blocks fetch in 1 second... (attempt ${retryCount + 2})`)
      setTimeout(() => {
        fetchHomepageBlocks(lang, retryCount + 1)
      }, 1000)
      return
    }

    error.value = err.response?.data?.message || 'Failed to load homepage content.'
  } finally {
    isLoading.value = false
    // Ensure Swiper initializes *after* data is fetched and potentially rendered
    nextTick(() => {
      initializeSwiper()
    })
  }
}

// --- Fetch Sidebar Blocks (NEW) ---
const fetchSidebarBlocks = async (lang) => { // Accept lang parameter
  isSidebarLoading.value = true;
  sidebarError.value = null;
  sidebarBlocks.value = [];
  try {
    // Use the public endpoint, also pass lang for sidebar if needed (adjust API if so)
    // Assuming sidebar API also needs lang now. If not, remove lang param here.
    const response = await api.get(buildApiUrl(`/api/sidebars`), {
        params: { page: HOMEPAGE_IDENTIFIER, lang: lang }
    });
    const content = response.data;
    if (content && Array.isArray(content)) {
       sidebarBlocks.value = content;
       // console.log(`Fetched sidebar blocks for page '${HOMEPAGE_IDENTIFIER}' (lang: ${lang}):`, sidebarBlocks.value);
    } else if (content && typeof content === 'object' && Object.keys(content).length === 0) {
        // console.log(`No sidebar content returned for page '${HOMEPAGE_IDENTIFIER}' (lang: ${lang}).`);
        sidebarBlocks.value = [];
    } else if (content) {
        console.warn(`Received unexpected sidebar content format for page '${HOMEPAGE_IDENTIFIER}' (lang: ${lang}):`, content);
        sidebarBlocks.value = [];
    } else {
        sidebarBlocks.value = [];
    }

  } catch (error) {
      if (error.response && error.response.status === 404) {
          // console.log(`Sidebar content not found for page '${HOMEPAGE_IDENTIFIER}' (lang: ${lang}).`);
          sidebarBlocks.value = [];
      } else {
         console.error("Error fetching sidebar blocks:", error);
         sidebarError.value = error.response?.data?.message || 'Failed to load sidebar content.';
      }
  } finally {
    isSidebarLoading.value = false;
  }
};

// --- Computed Properties (NEW/MODIFIED) ---

// Computed property to get the HTML content for the Swiper
const swiperHtmlContent = computed(() => {
  const swiperBlock = homepageBlocks.value.find((block) => block.block_id === 'homepage-swiper')
  return swiperBlock ? swiperBlock.html_content : '' // Return HTML or empty string
})

// Computed property for the main content blocks (excluding the swiper block)
const mainContentBlocks = computed(() => {
  return homepageBlocks.value.filter((block) => block.block_id !== 'homepage-swiper')
})

// Computed property for navigation sections (excluding the swiper block)
const navSections = computed(() => {
  return mainContentBlocks.value
    .map((block) => ({
      id: block.block_id,
      title: block.nav_title,
    }))
    .filter((section) => section.title) // Only include sections with a nav_title
})

// --- Static Data (Keep or Modify) ---
// Keep the existing sidebar data for now, or fetch dynamically later
const staticHomepageSidebarData = ref({
  drugStatus: {
    /* ... existing ... */
  },
  quickSummary: {
    /* ... existing ... */
  },
  relatedResources: [
    /* ... existing ... */
  ],
  similarDrugs: [
    /* ... existing ... */
  ],
  drugComparison: [
    /* ... existing ... */
  ],
  frequentlyAskedQuestions: [
    /* ... existing ... */
  ],
})

// --- Swiper Instance Ref ---
const swiperInstance = ref(null)

// --- Swiper Initialization Function (NEW) ---
const initializeSwiper = () => {
  // Destroy previous instance if exists to prevent duplicates
  if (swiperInstance.value) {
    swiperInstance.value.destroy(true, true)
    swiperInstance.value = null
    // console.log('Previous Swiper instance destroyed.')
  }

  // *** MODIFIED SELECTOR to find either class name ***
  const swiperContainerSelector = '.related-generics-swiper, .swiperrelated-generics-swiper';
  const swiperContainer = document.querySelector(swiperContainerSelector);
  const swiperWrapper = swiperContainer ? swiperContainer.querySelector('.swiper-wrapper') : null;

  if (swiperWrapper && swiperWrapper.innerHTML.trim() !== '') {
    try {
       // *** Use the flexible selector for initialization ***
      swiperInstance.value = new Swiper(swiperContainerSelector, { // Use the selector that finds the element
        modules: [Navigation],
        loop: false,
        slidesPerView: 3,
        spaceBetween: 20,
        navigation: {
          nextEl: '.related-generics-next',
          prevEl: '.related-generics-prev',
        },
        breakpoints: {
          320: { slidesPerView: 1, spaceBetween: 10 },
          640: { slidesPerView: 2, spaceBetween: 15 },
          1024: { slidesPerView: 3, spaceBetween: 20 },
        },
        observer: true,
        observeParents: true,
      })
      // console.log(`Swiper initialized/re-initialized on element matching selector: "${swiperContainerSelector}".`)
    } catch (swiperError) {
      console.error('Failed to initialize Swiper:', swiperError)
    }
  } else {
    // console.log(`Swiper container matching "${swiperContainerSelector}" not found or empty, skipping initialization.`)
  }
}

// --- Lifecycle Hook and Watcher ---
onMounted(async () => {
  // console.log('[IndexView] Component mounted, initializing...');

  // 等待路由准备就绪
  await nextTick();

  const currentLang = route.params.lang || 'en';
  // console.log(`[IndexView] Mounted. Route language: ${currentLang}`);

  // 验证语言参数
  const supportedLangs = ['en', 'zh-CN', 'ru'];
  const validLang = supportedLangs.includes(currentLang) ? currentLang : 'en';
  // console.log(`[IndexView] Using validated language: ${validLang}`);

  // 获取数据
  fetchHomepageBlocks(validLang);
  fetchSidebarBlocks(validLang);
})

// Watch for language changes in the route params
watch(() => route.params.lang, async (newLang, oldLang) => {
  // console.log(`[IndexView] Language watcher triggered. New: ${newLang}, Old: ${oldLang}`);

  const langToFetch = newLang || 'en';
  const supportedLangs = ['en', 'zh-CN', 'ru'];

  // 确保语言真正发生了变化且新语言有效
  const validLangToFetch = supportedLangs.includes(langToFetch) ? langToFetch : 'en';
  const validOldLang = supportedLangs.includes(oldLang) ? oldLang : 'en';

  if (validLangToFetch !== validOldLang) {
    // console.log(`[IndexView] Language changed from ${oldLang || 'initial'} to ${validLangToFetch}. Refetching content.`);

    // 等待一个tick确保路由和i18n都已更新
    await nextTick();

    fetchHomepageBlocks(validLangToFetch);
    fetchSidebarBlocks(validLangToFetch);
  }
});

// Watch for swiperHtmlContent changes to re-initialize Swiper
watch(swiperHtmlContent, (newHtml, oldHtml) => {
  if (newHtml !== oldHtml) {
    // console.log('[IndexView] Swiper HTML content changed, re-initializing Swiper...');
    nextTick(() => {
      initializeSwiper();
    });
  }
});
</script>

<style scoped>
/* Layout for Homepage - 防止布局偏移优化 */
.homepage-layout {
  display: flex;
  gap: 20px; /* Space between sidebars and main content */
  padding: 20px;
  max-width: 1200px; /* Or your desired max width */
  margin: 0 auto; /* Center the layout */
  contain: layout style; /* 防止布局偏移 */
  transform: translateZ(0); /* 启用硬件加速 */
}

/* Left Sidebar */
.sidebar-left {
  width: 20%; /* Adjust width as needed */
  max-width: 250px; /* Maximum width */
  min-width: 180px; /* Minimum width */
  /* FIXED POSITIONING */
  position: sticky;
  top: 90px; /* Adjust based on header height or desired gap */
  height: calc(100vh - 110px); /* Adjust height based on top offset and footer */
  overflow-y: auto; /* Allow sidebar itself to scroll if content is long */
  z-index: 5; /* 降低z-index，避免遮挡下拉菜单 */
}

.sidebar-left-placeholder {
  width: 20%; /* Match width */
  max-width: 250px;
  min-width: 180px;
}

/* Main Content Area */
.homepage-main-content {
  width: 70%;
  flex-grow: 1;
  /* Removed margin-left as flex handles spacing with gap */
  min-width: 0; /* Prevent flex item overflow */
}

.drug-header {
  margin-bottom: 2rem;
}

.drug-header h1 {
  margin-bottom: 0.5rem;
  color: rgb(52, 58, 64);
  font-size: 2rem;
}

.drug-header p {
  margin-bottom: 0.3rem;
  color: rgb(108, 117, 125);
}

/* Right Sidebar */
.sidebar-right {
  width: 25%; /* Adjust width as needed */
  max-width: 300px;
  min-width: 200px;
  /* Consider making it sticky as well */
  /* position: sticky; */
  /* top: 90px; */
  /* height: calc(100vh - 110px); */
  /* overflow-y: auto; */
}

.sidebar-block {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa; /* Light background for blocks */
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.sidebar-block h3 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 1.1em;
  color: #343a40;
}

/* Style for content rendered via v-html within the sidebar */
.sidebar-block > div {
  font-size: 0.95em;
  line-height: 1.6;
}

/* Optional: Add specific styles for elements within v-html if needed */
.sidebar-block > div ::v-deep(a) {
  color: #007bff;
}
.sidebar-block > div ::v-deep(ul),
.sidebar-block > div ::v-deep(ol) {
  padding-left: 20px;
}
:deep(.sidebar-block img) {
  max-width: 100%;
  height: auto;
}

.sidebar-loading,
.sidebar-error {
    padding: 15px;
    text-align: center;
    color: #6c757d;
}
.sidebar-error {
    color: #dc3545;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
}

/* Styling for dynamic blocks - 防止布局偏移 */
.content-block-wrapper {
  margin-bottom: 2rem;
  contain: layout style; /* 防止布局偏移 */
}

.content-block {
  /* Add scroll-margin-top if using sticky SideNav */
  scroll-margin-top: 80px; /* Adjust to match sticky top + gap */
  contain: layout style; /* 防止布局偏移 */
  transform: translateZ(0); /* 启用硬件加速 */
}

.content-block:last-child .el-divider {
  display: none; /* Hide divider after the last block */
}

/* 侧边栏块优化 */
.sidebar-block-wrapper {
  margin-bottom: 1rem;
  contain: layout style;
}

/* Styling for Swiper */
:deep(.swiper-section) {
  margin-bottom: 2rem;
  position: relative; /* Needed for absolute positioning of nav buttons */
  padding: 0 45px; /* Add padding to prevent content overlap with buttons */
  max-width: 800px; /* Optional: constrain width */
  margin-left: auto;
  margin-right: auto;
}

:deep(.swiper-section h2) {
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  color: #343a40;
}

:deep(.related-generics-swiper-container) {
  position: relative;
}

/* Add position relative to the main container holding swiper and buttons */
:deep(.swiper-container-wrapperrelated-generics-swiper-container) {
  position: relative;
  margin: 2rem 0; /* Keep existing margin if needed */
}

:deep(.swiper-container-wrapper) {
  position: relative;
  margin: 2rem 0; /* Keep existing margin if needed */
}


:deep(.related-generics-swiper),
:deep(.swiperrelated-generics-swiper) {
  width: 100%;
  overflow: hidden !important;
}

:deep(.swiper-slide) {
  display: flex;
  justify-content: center;
  align-items: stretch;
  box-sizing: border-box;
}

:deep(.related-generic-item) {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background-color: #ffffff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  transition: box-shadow 0.3s ease;
}

:deep(.related-generic-item:hover) {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
}

:deep(.related-generic-item h3) {
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-size: 1.1em;
    color: #2c3e50;
    font-weight: 600;
}

:deep(.related-generic-item p) {
    font-size: 0.9em;
    color: #555;
    line-height: 1.5;
    flex-grow: 1; /* Allow description to take available space */
    margin-bottom: 1rem;
}

:deep(.related-generic-item .view-more-button) {
    display: inline-block;
    padding: 0.5em 1em;
    background-color: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    font-size: 0.9em;
    transition: background-color 0.3s ease;
    align-self: center; /* Center button horizontally */
}

:deep(.related-generic-item .view-more-button:hover) {
    background-color: #0056b3;
}


/* Basic Styles for Swiper Navigation Arrows (if needed) */
/* These might be provided by 'swiper/css/navigation', but add them if arrows remain hidden */
:deep(.swiper-button-prev),
:deep(.swiper-button-next) {
    position: absolute;
    top: 50%;
    width: 27px; /* Default width from swiper */
    height: 44px; /* Default height */
    margin-top: -22px; /* Center vertically */
    z-index: 10;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #007aff; /* Example color, adjust as needed */
    /* background-color: rgba(255, 255, 255, 0.8); */ /* Optional background */
    /* border-radius: 50%; */ /* Optional shape */
}
:deep(.swiper-button-prev.swiper-button-disabled),
:deep(.swiper-button-next.swiper-button-disabled) {
    opacity: 0.35;
    cursor: auto;
    pointer-events: none;
}
:deep(.swiper-button-prev:after),
:deep(.swiper-button-next:after) {
    font-family: swiper-icons;
    font-size: 24px;
    font-weight: bold;
    text-transform: none !important;
    letter-spacing: 0;
    font-variant: initial;
    line-height: 1;
}
:deep(.swiper-button-prev:after) {
    content: 'prev';
}
:deep(.swiper-button-next:after) {
    content: 'next';
}

:deep(.swiper-button-prev) {
    left: 10px;
    right: auto;
}

:deep(.swiper-button-next) {
    right: 10px;
    left: auto;
}


/* Responsive adjustments */
@media (max-width: 768px) {
  .homepage-layout {
    flex-direction: column;
  }
  .sidebar-left, .sidebar-right, .sidebar-left-placeholder {
    width: 100%;
    max-width: none;
    position: static; /* Remove sticky on mobile */
    height: auto;
    overflow-y: visible;
    margin-bottom: 20px;
  }
  .homepage-main-content {
    width: 100%;
    margin-left: 0;
  }
}

@media (max-width: 600px) {
  .swiper-section {
    padding: 0 15px;
  }
  .swiper-button-prev,
  .swiper-button-next {
    /* Optionally hide buttons on very small screens or make them smaller */
    width: 30px;
    height: 30px;
  }
}

:deep(.comparison-table-container table) {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px; /* Ensure table doesn't collapse too much */
}

:deep(.comparison-table-container th),
:deep(.comparison-table-container td) {
  border: 1px solid #dee2e6;
  padding: 0.8rem 1rem;
  text-align: left;
  vertical-align: top;
}

:deep(.comparison-table-container th) {
  background-color: #f8f9fa;
  font-weight: 600;
}

:deep(.comparison-table-container tbody tr:nth-child(odd)) {
  background-color: #f8f9fa;
}

:deep(.comparison-table-container tbody tr:hover) {
  background-color: #e9ecef;
}

/* Loading/Error States */
.loading-message,
.error-message {
  text-align: center;
  padding: 5rem 1rem;
  font-size: 1.2rem;
  color: #6c757d;
  width: 100%; /* Ensure they take full width */
}
.error-message {
  color: var(--el-color-danger);
}
.full-width-message {
  flex-basis: 100%;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .homepage-layout {
    flex-direction: column;
  }
  .sidebar-left,
  .sidebar-left-placeholder {
    display: none; /* Hide left nav on smaller screens */
  }
  .homepage-main-content {
    order: 1;
  }
  .sidebar-right {
    order: 2;
    max-width: none;
    margin-top: 2rem;
  }
}

/* Ensure swiper wrapper takes up space even if initially empty */
.swiper-wrapper:empty {
  min-height: 100px; /* Or some placeholder height */
}

/* Styles for the SideNav in the right sidebar */
.sidebar-right ::v-deep(.side-nav) {
    border-right: none;
    border-left: 1px solid #dee2e6;
    padding-right: 0;
    padding-left: 1.5rem;
}
</style>