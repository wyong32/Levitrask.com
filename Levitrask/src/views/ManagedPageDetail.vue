<template>
  <div class="managed-page-detail-view">
    <PageHeader />
    
    <main class="page-detail-container detail-layout">
      <!-- Optional: Breadcrumbs or Title Area -->
      <!-- <h1 v-if="pageData">{{ pageData.list_title || pageData.meta_title }}</h1> -->

      <div v-if="isLoading" class="loading-message full-width-message">Loading page content...</div>
      <div v-else-if="errorMessage" class="error-message full-width-message">
        <h2>Error Loading Page</h2>
        <p>{{ errorMessage }}</p>
        <!-- Optional: Link back home or to a relevant list -->
        <router-link to="/">Go to Homepage</router-link>
      </div>

      <!-- Data Loaded State -->
      <template v-else-if="pageData">
          <!-- Left Sidebar for Navigation (NEW) -->
          <SideNav
            v-if="pageData.nav_sections && pageData.nav_sections.length > 0"
            :sections="pageData.nav_sections"
            content-selector=".detail-main-content" 
            class="sidebar-left"
          />
          <!-- Placeholder if no nav -->
          <div v-else class="sidebar-left-placeholder"></div>

          <!-- Main Content Area (NEW Wrapper) -->
          <div class="detail-main-content">
             <!-- Render the main HTML content fetched from API -->
             <!-- The existing nav rendered inside main content is removed, SideNav handles it -->
             <div v-html="pageData.content" class="content-html"></div>
          </div>

          <!-- Right Sidebar (Modified Structure) -->
          <aside v-if="pageData.sidebar_data && pageData.sidebar_data.length > 0" class="sidebar-right">
             <!-- Removed h3, blocks should have titles if needed -->
             <div v-for="(block, index) in pageData.sidebar_data" :key="`sidebar-${index}`" class="sidebar-block">
               <h3 v-if="block.title">{{ block.title }}</h3> <!-- Changed from h4 to h3 -->
               <div v-html="block.html_content"></div>
               <!-- Removed hr, use CSS for spacing if needed -->
             </div>
          </aside>
           <!-- Placeholder if no right sidebar -->
          <div v-else class="sidebar-right-placeholder"></div>
      </template>
       <!-- Fallback if pageData is somehow null/undefined after loading -->
       <div v-else class="error-message full-width-message">
          Page data is unavailable.
       </div>

    </main>

    <PageFooter />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios'; // Or your shared api instance
import PageHeader from '../components/PageHeader.vue';
import PageFooter from '../components/PageFooter.vue';
import SideNav from '../components/SideNav.vue'; // Import SideNav

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
const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const api = axios.create({ baseURL: baseUrl });
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
    const response = await api.get(`/managed-pages/${lang}/${identifier}`); // Use lang from route
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

</script>

<style scoped>
/* Layout styles (inspired by IndexView potentially) */
.detail-layout {
  display: grid;
  /* Adjust grid template for 3 columns */
  grid-template-columns: 200px 1fr 250px; /* Example: Adjust widths as needed */
  gap: 30px; /* Space between columns */
  max-width: 1200px; /* Increase max-width for 3 columns */
  margin: 20px auto; /* Center layout */
  padding: 0 20px; /* Add padding */
}

.sidebar-left, .sidebar-left-placeholder {
  grid-column: 1 / 2;
  /* Add specific styles for left sidebar if needed */
  position: sticky; /* Make left nav sticky */
  top: 80px; /* Adjust based on header height + desired offset */
  height: calc(100vh - 100px); /* Adjust height */
  overflow-y: auto; /* Allow scrolling if content overflows */
}

.detail-main-content {
  grid-column: 2 / 3;
  min-width: 0; /* Prevent content overflow issues in grid */
}

.sidebar-right, .sidebar-right-placeholder {
  grid-column: 3 / 4;
  /* Right sidebar specific styles */
}

.full-width-message {
    grid-column: 1 / -1; /* Make loading/error span all columns */
    text-align: center;
    padding: 40px;
}

/* Responsive adjustments */
@media (max-width: 992px) {
  .detail-layout {
    grid-template-columns: 1fr 250px; /* Sidebar right, main content takes rest */
    gap: 20px;
  }
  .sidebar-left, .sidebar-left-placeholder {
    display: none; /* Hide left nav on smaller screens */
  }
  .detail-main-content {
     grid-column: 1 / 2;
  }
   .sidebar-right, .sidebar-right-placeholder {
     grid-column: 2 / 3;
   }
}

@media (max-width: 768px) {
  .detail-layout {
    grid-template-columns: 1fr; /* Single column */
    max-width: 100%;
    padding: 0 15px;
    margin-top: 15px;
  }
  .detail-main-content {
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

/* Keep existing scoped styles */
.page-detail-container {
  /* Styles from this class are now mostly handled by .detail-layout */
  /* padding: 20px; */
  /* max-width: 1000px; */
  /* margin: 0 auto; */
  /* min-height: calc(100vh - 120px); */ 
}

.loading-area, .error-area {
  /* text-align: center; */ /* Handled by full-width-message */
  /* padding: 40px; */
  color: #606266;
}

.error-area h2 {
    color: #f56c6c;
    margin-bottom: 15px;
}
.error-area p {
    margin-bottom: 20px;
}

/* Remove old page-content-wrapper styles if not needed */
/* .page-content-wrapper { ... } */

/* Remove old page-sidebar styles if covered by .sidebar-right */
/* .page-sidebar { ... } */

/* Keep styles for content inside main/sidebar */
.main-content { /* This class might not be needed anymore */
    /* order: 1; */
    /* width: 100%; */
}

/* Remove old page-nav styles as SideNav component handles this */
/* .page-nav { ... } */

.content-html {
    line-height: 1.6;
}

.content-html ::v-deep(h1),
.content-html ::v-deep(h2),
.content-html ::v-deep(h3) {
    margin-top: 1.5em;
    margin-bottom: 0.8em;
}

.sidebar-block {
    margin-bottom: 25px; /* Increased spacing */
    padding-bottom: 20px;
}
.sidebar-block:not(:last-child) {
    border-bottom: 1px solid #eee; /* Add separator */
}

.sidebar-block h3 { /* Changed from h4 */
    margin-top: 0;
    margin-bottom: 10px; /* Increased spacing */
    font-size: 1.2em; /* Slightly larger title */
    color: #333;
}
.sidebar-block ::v-deep(p) {
    font-size: 0.95em;
    line-height: 1.5;
    color: #555;
}
.sidebar-block ::v-deep(a) {
    color: #007bff;
    text-decoration: none;
}
.sidebar-block ::v-deep(a:hover) {
    text-decoration: underline;
}

/* Remove old responsive styles if replaced */
/* @media (min-width: 768px) { ... } */

</style> 