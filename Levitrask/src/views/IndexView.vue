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
          content-selector=".homepage-main-content > .content-block"
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

        <!-- Right Sidebar (Keep existing DrugSidebar for now, but data needs adjustment) -->
        <!-- TODO: Decide how the right sidebar on the homepage should be populated -->
        <!-- Option 1: Use a specific contextKey with the new backend system -->
        <!-- Option 2: Keep it static or fetch data differently -->
        <aside class="sidebar-right">
          <DrugSidebar
            :sidebarData="staticHomepageSidebarData"
            :customTitles="{ quickSummary: 'Levitra at a Glance' }"
          />
        </aside>
      </template>
    </main>
    <PageFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import axios from 'axios'
import PageHeader from '../components/PageHeader.vue'
import PageFooter from '../components/PageFooter.vue'
import SideNav from '../components/SideNav.vue' // Import SideNav
import DrugSidebar from '../components/DrugSidebar.vue'
import { ElDivider } from 'element-plus' // Import ElDivider if used

// --- Re-added Swiper Imports ---
import Swiper from 'swiper'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
// --- End Swiper Imports ---

// --- State for Dynamic Content ---
const homepageBlocks = ref([])
const isLoading = ref(true)
const error = ref(null)

// --- API Setup ---
const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
const api = axios.create({ baseURL: baseUrl }) // Use a base URL if defined

// --- Fetch Homepage Blocks ---
const fetchHomepageBlocks = async () => {
  isLoading.value = true
  error.value = null
  try {
    const response = await api.get('/api/homepage-blocks') // Use the new public endpoint
    homepageBlocks.value = response.data || []
    console.log('Fetched homepage blocks:', homepageBlocks.value)
  } catch (err) {
    console.error('Error fetching homepage blocks:', err)
    error.value = err.response?.data?.message || 'Failed to load homepage content.'
  } finally {
    isLoading.value = false
    // Ensure Swiper initializes *after* data is fetched and potentially rendered
    // nextTick in onMounted might still handle this correctly, but
    // let's explicitly re-trigger initialization check if needed
    nextTick(() => {
      initializeSwiper()
    })
  }
}

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

// --- Lifecycle Hook ---
onMounted(() => {
  fetchHomepageBlocks()
  // Swiper initialization will now happen in the finally block of fetchHomepageBlocks or via observer
})
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
  position: fixed;
  top: 90px; /* Adjust based on header height or desired gap */
  /* align-self: flex-start; /* No longer needed for fixed positioning */
 
  overflow-y: auto; /* Allow sidebar itself to scroll if content is long */
  z-index: 10; /* Ensure sidebar stays on top */
}

.sidebar-left-placeholder {
  flex: 1;
  min-width: 200px;
}

/* Main Content Area */
.homepage-main-content {
  flex-grow: 1; /* Takes up remaining space */
  margin-left: 270px; /* sidebar max-width (250px) + layout gap (20px) */
  min-width: 0; /* <<< ADD THIS LINE to prevent flex item overflow */
  /* max-width calculation might need adjustment if right sidebar is also fixed */
  /* max-width: calc(100% - 250px - 20px - width_of_right_sidebar - gap); */ 
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
  width: 20%;
  max-width: 250px;
  min-width: 180px;
  /* Keep as is for now (not fixed or sticky) */
  /* align-self: flex-start; */ /* This might still be useful depending on content */
  /* height: calc(100vh - 40px); */ /* Height might not need to be fixed if not sticky/fixed */
  /* overflow-y: auto; */
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
</style>