<template>
  <div class="managed-page-detail-view">
    <PageHeader />
    
    <main class="content-area-3-column">
      <!-- Optional: Breadcrumbs or Title Area -->
      <!-- <h1 v-if="pageData">{{ pageData.list_title || pageData.meta_title }}</h1> -->

      <!-- Left Sidebar: SideNav -->
      <aside v-if="!isLoading && !errorMessage && parsedNavSections.length > 0" class="sidebar-left">
          <SideNav
            :sections="parsedNavSections"
            content-selector=".main-content-middle"
          />
      </aside>
      <div v-else-if="!isLoading && !errorMessage" class="sidebar-left placeholder"></div>

      <!-- Main content area -->
      <div v-if="isLoading" class="loading-message main-content-middle">
        Loading page content...
      </div>
      <div v-else-if="errorMessage" class="error-message main-content-middle">
        <h2>Error Loading Page</h2>
        <p>{{ errorMessage }}</p>
        <!-- Optional: Link back home or to a relevant list -->
        <router-link to="/">Go to Homepage</router-link>
      </div>
      <article v-else-if="pageData" class="main-content-middle">
        <!-- Render the main HTML content fetched from API -->
        <div v-html="pageData.content" class="content-html"></div>
      </article>
      <div v-else class="main-content-middle not-found-message">
         Page data is unavailable.
      </div>

      <!-- Right Sidebar (Modified Structure) -->
      <aside v-if="!isLoading && !errorMessage && parsedSidebarData.length > 0" class="sidebar-right managed-page-sidebar">
             <div v-for="(block, index) in parsedSidebarData" :key="`sidebar-${index}`" class="sidebar-block">
               <h4 v-if="block.title" class="sidebar-block-title">{{ block.title }}</h4>
               <div v-if="block.content || block.html_content" v-html="block.content || block.html_content" class="sidebar-block-content"></div>
             </div>
      </aside>
       <div v-else-if="!isLoading && !errorMessage" class="sidebar-right placeholder"></div>

    </main>

    <PageFooter />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios'; // Or your shared api instance
import PageHeader from '../components/PageHeader.vue';
import PageFooter from '../components/PageFooter.vue';
import SideNav from '../components/SideNav.vue'; // Import SideNav
import { cloneDeep } from 'lodash'; // Import cloneDeep if needed for parsing, though likely not required here

// --- Props --- 
// We get type and identifier from the route params directly using useRoute()
// defineProps is not needed if we don't pass props from parent component
// UPDATED: We now only get identifier from route params

// --- State --- 
const pageData = ref(null);
const isLoading = ref(false);
const errorMessage = ref('');
const route = useRoute();

// --- API Setup ---
// Correct baseURL setup: Use environment variable for production, leave empty for local dev (Vite proxy handles /api)
const baseUrl = import.meta.env.PROD ? (import.meta.env.VITE_API_BASE_URL || '') : ''; 
const api = axios.create({ baseURL: baseUrl });
console.log(`[API Setup Detail] Axios configured with baseURL: '${baseUrl || '(empty for local proxy)'}'`); // Add log for debugging
// No auth token needed for public requests

// --- Helper to set Meta Tags (simplified from router) ---
const setMetaTag = (attr, key, value) => {
  if (!value) return; // Don't set empty tags
  let element = document.querySelector(`meta[${attr}='${key}']`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', value);
};

const updateMetaTags = (data) => {
    if (!data) return;
    document.title = data.meta_title || 'Levitrask.com'; // Default title if missing
    setMetaTag('name', 'description', data.meta_description);
    setMetaTag('name', 'keywords', data.meta_keywords);
    // Add more meta tags (OpenGraph, Twitter) if needed, similar to router guard
    // Example:
    // setMetaTag('property', 'og:title', document.title);
    // setMetaTag('property', 'og:description', data.meta_description);
    // ... etc
};

// --- Fetch Page Data --- 
const fetchPageData = async (identifier) => { 
  if (!identifier) { 
    errorMessage.value = 'Page identifier is missing.';
    console.error('fetchPageData called with missing identifier', identifier);
    return;
  }

  // Get the language code from the current route
  const lang = route.params.lang;
  if (!lang) {
      errorMessage.value = 'Language code is missing from the route.';
      console.error('Language code missing in route params:', route.params);
      return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  pageData.value = null; 

  try {
    // UPDATED: Use the new API endpoint with lang and identifier
    console.log(`Fetching page data for lang: ${lang}, identifier: ${identifier}`);
    // Always include /api in the path
    const response = await api.get(`/api/managed-pages/${lang}/${identifier}`); 
    pageData.value = response.data;
    console.log('Fetched page data:', pageData.value);

    await nextTick(); 
    updateMetaTags(pageData.value);

  } catch (error) {
    console.error(`Error fetching page data (lang: ${lang}, identifier: ${identifier}):`, error);
    if (error.response?.status === 404) {
        errorMessage.value = `Sorry, the page '${identifier}' could not be found or is not available in this language.`; // Updated message
    } else {
        errorMessage.value = error.response?.data?.message || 'An error occurred while loading the page content.';
    }
    pageData.value = null; 
  } finally {
    isLoading.value = false;
  }
};

// --- Lifecycle and Route Watching --- 
onMounted(() => {
    // Fetch data based on initial route identifier and language
    fetchPageData(route.params.identifier);
});

// Watch for route identifier or language changes
watch(
    () => [route.params.lang, route.params.identifier], // Watch both lang and identifier
    (newParams, oldParams) => {
        const [newLang, newIdentifier] = newParams;
        const [oldLang, oldIdentifier] = oldParams || []; 
        
        // Refetch data only if identifier or language actually changed
        if (newIdentifier && (newIdentifier !== oldIdentifier || newLang !== oldLang)) { 
             console.log('Route changed, refetching data...', newParams);
             fetchPageData(newIdentifier); // fetchPageData now gets lang internally
        }
    },
    { immediate: false } 
);

// --- Computed properties to parse JSON safely (similar to QuestionDetails) ---
const parsedNavSections = computed(() => {
  let result = [];
  const rawNavSections = pageData.value?.nav_sections; // Use snake_case from API

  if (rawNavSections && typeof rawNavSections === 'string') {
    try {
      const parsed = JSON.parse(rawNavSections);
      result = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("[ManagedPageDetail] Error parsing nav_sections JSON:", e, "Raw:", rawNavSections);
    }
  } else if (Array.isArray(rawNavSections)) {
    result = rawNavSections;
  }
  return result;
});

const parsedSidebarData = computed(() => {
  let result = [];
  const rawSidebarData = pageData.value?.sidebar_data; // Use snake_case from API

  if (rawSidebarData && typeof rawSidebarData === 'string') {
    try {
      const parsed = JSON.parse(rawSidebarData);
      result = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("[ManagedPageDetail] Error parsing sidebar_data JSON:", e, "Raw:", rawSidebarData);
    }
  } else if (Array.isArray(rawSidebarData)) {
    result = rawSidebarData;
  }
  // CHANGE: Update filter to accept content OR html_content
  result = result.filter(block => 
      typeof block === 'object' && 
      block !== null && 
      (block.hasOwnProperty('content') || block.hasOwnProperty('html_content'))
  );
  return result;
});

</script>

<style scoped>
:deep(ul) {
  list-style: disc;
  margin-left: 20px;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}
:deep(li) {
  margin-bottom: 0.5rem;
}

/* Adopt 3-column layout styles (assuming shared CSS or define here) */
.content-area-3-column {
  display: grid;
  grid-template-columns: 200px 1fr 250px; /* Adjust widths */
  gap: 30px;
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 20px;
}

.sidebar-left, .sidebar-left-placeholder {
  grid-column: 1 / 2;
  position: sticky;
  top: 80px; /* Adjust based on header height */
  height: calc(100vh - 100px);
  overflow-y: auto;
}

.main-content-middle {
  grid-column: 2 / 3;
  min-width: 0; /* Prevent overflow */
}

.sidebar-right, .sidebar-right-placeholder {
  grid-column: 3 / 4;
  /* Can add specific styles or rely on .managed-page-sidebar */
}

.loading-message, .error-message, .not-found-message {
  padding: 40px;
  text-align: center;
}

/* Styles for the content rendered via v-html */
.content-html :deep(h1), /* Example: Target elements inside v-html */
.content-html :deep(h2),
.content-html :deep(h3) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}
.content-html :deep(p) {
  margin-bottom: 1em;
  line-height: 1.6;
}
.content-html :deep(a) {
   text-decoration: none;
}
.content-html :deep(a:hover) {
   text-decoration: underline;
}

:deep(.sidebar-block img){
  max-width: 100%;
  height: auto;
}

/* Styles for the NEW Right Sidebar Blocks */
.managed-page-sidebar .sidebar-block {
  background-color: #f9f9f9;
  border: 1px solid #eee;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 4px;
}

.managed-page-sidebar .sidebar-block-title {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.1em;
  font-weight: 600;
  color: #303133;
}

.managed-page-sidebar .sidebar-block-content :deep(p) {
  margin-top: 0;
  margin-bottom: 1em;
  line-height: 1.4;
  font-size: 0.9rem;
}
.managed-page-sidebar .sidebar-block-content :deep(a) {
  color: #007bff;
  font-size: 0.9rem;
  text-decoration: none;
}
.managed-page-sidebar .sidebar-block-content :deep(a:hover) {
  text-decoration: underline;
}

.managed-page-sidebar .sidebar-block-content :deep(ul) {
  padding-left: 1.5em;
}

.managed-page-sidebar .sidebar-block-content :deep(ul li) {
  margin-bottom: 0.5em;
}



/* Responsive adjustments (keep or adapt from original) */
@media (max-width: 992px) {
  .content-area-3-column {
    grid-template-columns: 1fr 250px;
    gap: 20px;
  }
  .sidebar-left, .sidebar-left-placeholder {
    display: none;
  }
  .main-content-middle {
     grid-column: 1 / 2;
  }
   .sidebar-right, .sidebar-right-placeholder {
     grid-column: 2 / 3;
   }
}

@media (max-width: 768px) {
  .content-area-3-column {
    grid-template-columns: 1fr;
    max-width: 100%;
    padding: 0 15px;
    margin-top: 15px;
  }
  .main-content-middle {
     grid-column: 1 / -1;
     order: 1;
  }
   .sidebar-right, .sidebar-right-placeholder {
     grid-column: 1 / -1;
     order: 2;
     margin-top: 30px;
     border-top: 1px solid #eee;
     padding-top: 20px;
   }
}

:deep(.comparison-table-container) {
  overflow-x: auto; /* Allow horizontal scrolling on small screens */
  margin: 1.5rem 0;
  border: 1px solid #dee2e6;
  border-radius: 8px;
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

/* Add scroll margin to account for sticky header */
.content-html :deep([id]) {
  scroll-margin-top: 100px; /* Adjust this value based on actual header height */
}

</style> 