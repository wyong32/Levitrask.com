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
            <h1>Levitra: A Comprehensive Overview of the Medication</h1>
            <p><strong>Common Brand Name(s):</strong> Staxyn, Levitra</p>
            <p>
              <strong>Common Generic Name(s):</strong> vardenafil, vardenafil HCl, vardenafil
              hydrochloride
            </p>
            <p><strong>Pronunciation:</strong> var-DEN-a-fil</p>
            <p><strong>Drug Class:</strong> Phosphodiesterase-5 (PDE5) inhibitor</p>
            <p><strong>Availability:</strong> Prescription only; generic available</p>
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

// --- API Setup ---
const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
const api = axios.create({ baseURL: baseUrl }) // Use a base URL if defined

// Helper function to build API URL (can be moved to a utils file)
const buildApiUrl = (path) => `${baseUrl}${path}`; // Ensure it uses baseUrl

// --- Fetch Homepage Blocks ---
const fetchHomepageBlocks = async (lang) => { // Accept lang parameter
  isLoading.value = true
  error.value = null
  homepageBlocks.value = []; // Clear previous blocks
  try {
    console.log(`Fetching homepage blocks for language: ${lang}`); // Log language
    // Use the new public endpoint and pass the language
    const response = await api.get(buildApiUrl('/api/homepage-blocks'), {
        params: { lang: lang } // Pass lang as query parameter
    })
    homepageBlocks.value = response.data || []
    console.log('Fetched homepage blocks:', homepageBlocks.value)
  } catch (err) {
    console.error('Error fetching homepage blocks:', err)
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
       console.log(`Fetched sidebar blocks for page '${HOMEPAGE_IDENTIFIER}' (lang: ${lang}):`, sidebarBlocks.value);
    } else if (content && typeof content === 'object' && Object.keys(content).length === 0) {
        console.log(`No sidebar content returned for page '${HOMEPAGE_IDENTIFIER}' (lang: ${lang}).`);
        sidebarBlocks.value = [];
    } else if (content) {
        console.warn(`Received unexpected sidebar content format for page '${HOMEPAGE_IDENTIFIER}' (lang: ${lang}):`, content);
        sidebarBlocks.value = [];
    } else {
        sidebarBlocks.value = [];
    }

  } catch (error) {
      if (error.response && error.response.status === 404) {
          console.log(`Sidebar content not found for page '${HOMEPAGE_IDENTIFIER}' (lang: ${lang}).`);
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
    console.log('Previous Swiper instance destroyed.')
  }

  // Check if the swiper container exists and has content
  const swiperWrapper = document.querySelector('.related-generics-swiper .swiper-wrapper')
  if (swiperWrapper && swiperWrapper.innerHTML.trim() !== '') {
    try {
      swiperInstance.value = new Swiper('.related-generics-swiper', {
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
        observer: true, // Automatically reinitialize on DOM changes (like v-html update)
        observeParents: true, // Observe parent elements too
      })
      console.log('Swiper initialized/re-initialized.')
    } catch (swiperError) {
      console.error('Failed to initialize Swiper:', swiperError)
    }
  } else {
    console.log('Swiper container not found or empty, skipping initialization.')
  }
}

// --- Lifecycle Hook and Watcher ---
onMounted(() => {
  const currentLang = route.params.lang || 'en'; // Get initial language
  console.log(`[IndexView] Mounted. Initial language: ${currentLang}`);
  fetchHomepageBlocks(currentLang); // Fetch main blocks
  fetchSidebarBlocks(currentLang); // Fetch sidebar blocks on mount
})

// Watch for language changes in the route params
watch(() => route.params.lang, (newLang, oldLang) => {
  const langToFetch = newLang || 'en'; // Use newLang or default to 'en'
  if (langToFetch !== (oldLang || 'en')) { // Check if language actually changed
    console.log(`[IndexView] Language changed from ${oldLang || 'initial'} to ${langToFetch}. Refetching content.`);
    fetchHomepageBlocks(langToFetch);   // Refetch main blocks
    fetchSidebarBlocks(langToFetch);    // Refetch sidebar blocks on lang change
  }
}, {
  // immediate: true // No longer needed as onMounted handles initial fetch
});

// Watch for swiperHtmlContent changes to re-initialize Swiper
watch(swiperHtmlContent, (newHtml, oldHtml) => {
  if (newHtml !== oldHtml) {
    console.log('[IndexView] Swiper HTML content changed, re-initializing Swiper...');
    nextTick(() => {
      initializeSwiper();
    });
  }
});
</script>

<style scoped>
/* Layout for Homepage */
.homepage-layout {
  display: flex;
  gap: 20px; /* Space between sidebars and main content */
  padding: 20px;
  max-width: 1200px; /* Or your desired max width */
  margin: 0 auto; /* Center the layout */
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
  z-index: 10; /* Ensure sidebar stays on top */
}

.sidebar-left-placeholder {
  width: 20%; /* Match width */
  max-width: 250px;
  min-width: 180px;
}

/* Main Content Area */
.homepage-main-content {
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

/* Styling for dynamic blocks */
.content-block {
  margin-bottom: 2rem;
  /* Add scroll-margin-top if using sticky SideNav */
  scroll-margin-top: 80px; /* Adjust to match sticky top + gap */
}
.content-block:last-child .el-divider {
  display: none; /* Hide divider after the last block */
}

/* Styling for Swiper */
.swiper-section {
  margin-bottom: 2rem;
  position: relative; /* Needed for absolute positioning of nav buttons */
  padding: 0 45px; /* Add padding to prevent content overlap with buttons */
  max-width: 800px; /* Optional: constrain width */
  margin-left: auto;
  margin-right: auto;
}

.swiper-section h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  color: #343a40;
}

.related-generics-swiper-container {
  position: relative;
}

.related-generics-swiper {
  width: 100%;
  overflow: hidden;
}

.swiper-slide {
  display: flex;
  justify-content: center;
  align-items: stretch;
  box-sizing: border-box;
}

.related-generic-item {
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
  height: 100%; /* Make items take full slide height */
}

.related-generic-item h3 {
  font-size: 1rem;
  color: #0d6efd;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  line-height: 1.3;
}

.related-generic-item p {
  font-size: 0.9rem;
  color: #555;
  margin: 0 0 1rem 0;
  line-height: 1.5;
  flex-grow: 1;
}

.view-more-button {
  display: inline-block;
  background-color: #4a6fbd;
  color: #ffffff;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  text-align: center;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: auto;
  align-self: center; /* Center button horizontally */
}

.view-more-button:hover {
  background-color: #3b5998;
  text-decoration: none;
}
:deep(.swiper-container-wrapper) {
  position: relative;
}
.swiper-button-prev,
.swiper-button-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  background-color: rgba(108, 117, 125, 0.7); /* Semi-transparent background */
  border-radius: 50%;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease, opacity 0.3s ease;
  z-index: 10;
}
.swiper-button-prev:hover,
.swiper-button-next:hover {
  background-color: rgba(90, 98, 104, 0.9);
}
.swiper-button-prev {
  left: 0px;
}
.swiper-button-next {
  right: 0px;
}
.swiper-button-prev::after,
.swiper-button-next::after {
  font-size: 16px;
  font-weight: bold;
}
.swiper-button-disabled {
  opacity: 0.35;
  cursor: auto;
  pointer-events: none;
}
.swiper-disclaimer {
  text-align: center;
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 1.5rem;
}

/* Ensure content rendered by v-html inherits styles or has specific styles */
:deep(.content-block div h1),
:deep(.content-block div h2),
:deep(.content-block div h3) {
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  /* Add other heading styles */
}
:deep(.content-block div p) {
  margin-bottom: 1em;
  line-height: 1.7;
}
:deep(.content-block div ul),
:deep(.content-block div ol) {
  margin-bottom: 1em;
  padding-left: 30px;
}
:deep(.content-block div li) {
  margin-bottom: 0.5em;
}
:deep(.content-block div a) {
  color: var(--el-color-primary); /* Use theme color */
  text-decoration: none;
}
:deep(.content-block div a:hover) {
  text-decoration: underline;
}
:deep(.homepage-main-content h2){
  margin-bottom: 1rem;
  color: rgb(52, 58, 64);
  font-size: 1.6rem;
  border-bottom: 1px solid rgb(238, 238, 238);
  padding-bottom: 0.5rem;
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