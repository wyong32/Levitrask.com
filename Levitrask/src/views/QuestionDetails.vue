<template>
  <div class="question-details-page" :key="route.params.id">
    <PageHeader />
    <main class="content-area-3-column">
      <!-- Left Sidebar: SideNav -->
      <aside v-if="!isLoading && !error && parsedNavSections.length > 0" class="sidebar-left">
          <SideNav 
            :sections="parsedNavSections" 
            content-selector=".post-body" 
          />
      </aside>
      <div v-else-if="!isLoading && !error" class="sidebar-left placeholder"></div> <!-- Optional: Placeholder if no nav -->
      
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-message main-content-middle">
        Loading question...
      </div>
      <!-- Error State -->
      <div v-else-if="error" class="error-message main-content-middle">
        Failed to load question: {{ error }}
      </div>
      <!-- Main content area -->
      <article v-else-if="questionData" class="main-content-middle">
        <div ref="postBody" class="post-body">
          <div v-html="questionData.content"></div>
        </div>
      </article>
      <!-- Article Not Found State -->
      <div v-else class="main-content-middle not-found-message">
        <p>Question Not Found</p>
      </div>

      <!-- Right Sidebar: Render Blocks -->
      <aside v-if="!isLoading && !error && parsedSidebarData && parsedSidebarData.length > 0" class="sidebar-right question-sidebar">
          <div v-for="(block, index) in parsedSidebarData" :key="`sidebar-block-${index}`" class="sidebar-block">
              <h4 v-if="block.title" class="sidebar-block-title">{{ block.title }}</h4>
              <div v-if="block.content" v-html="block.content" class="sidebar-block-content"></div>
          </div>
      </aside>
      <div v-else-if="!isLoading && !error" class="sidebar-right placeholder"></div> <!-- Optional: Placeholder if no sidebar data -->

    </main>
    <PageFooter />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import PageHeader from '../components/PageHeader.vue'
import PageFooter from '../components/PageFooter.vue'
import SideNav from '../components/SideNav.vue'

const route = useRoute()
const router = useRouter()
const { locale } = useI18n()
const postBody = ref(null)

// Reactive state for the question data, loading, and error
const questionData = ref(null)
const isLoading = ref(true)
const error = ref(null)

// Base URL from environment variable
const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

// Click handler remains the same
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

// Meta tag update function remains the same
const updateMetaTags = (qData) => {
  if (qData) {
    document.title = qData.metaTitle || qData.listTitle || 'Question | Levitrask'
    let descriptionTag = document.querySelector('meta[name="description"]')
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta')
      descriptionTag.setAttribute('name', 'description')
      document.head.appendChild(descriptionTag)
    }
    descriptionTag.setAttribute('content', qData.metaDescription || '')

    let keywordsTag = document.querySelector('meta[name="keywords"]')
    if (!keywordsTag) {
      keywordsTag = document.createElement('meta')
      keywordsTag.setAttribute('name', 'keywords')
      document.head.appendChild(keywordsTag)
    }
    keywordsTag.setAttribute('content', qData.metaKeywords || '')
  } else {
    document.title = '找不到问题 | Levitrask'
    const descriptionTag = document.querySelector('meta[name="description"]')
    if (descriptionTag) descriptionTag.setAttribute('content', '')
    const keywordsTag = document.querySelector('meta[name="keywords"]')
    if (keywordsTag) keywordsTag.setAttribute('content', '')
  }
}

// Computed properties to parse JSON safely
const parsedNavSections = computed(() => {
  let result = []; // Default to empty array
  // Use the correct snake_case property name from the API response
  const rawNavSections = questionData.value?.nav_sections; 

  if (rawNavSections && typeof rawNavSections === 'string') {
    try {
      const parsed = JSON.parse(rawNavSections);
      result = Array.isArray(parsed) ? parsed : []; // Ensure it's an array
    } catch (e) {
      console.error("[Debug] Error parsing nav_sections JSON:", e, "Raw data:", rawNavSections);
    }
  } else if (Array.isArray(rawNavSections)) {
      // Handle case where API might already return parsed JSON
      result = rawNavSections; 
  }
  console.log("[Debug] Parsed Nav Sections (using nav_sections):", result); // <-- Log parsed result
  return result; // Return the result
});

const parsedSidebarData = computed(() => {
  // CHANGE: Expect and return an array of blocks
  let result = []; // Default to empty array
  const rawSidebarData = questionData.value?.sidebar_data;

  if (rawSidebarData && typeof rawSidebarData === 'string') {
    try {
      const parsed = JSON.parse(rawSidebarData);
      // Ensure the parsed result is an array
      result = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("[Debug] Error parsing sidebar_data JSON:", e, "Raw data:", rawSidebarData);
      result = []; // Default to empty array on error
    }
  } else if (Array.isArray(rawSidebarData)) {
    // Handle case where API might already return parsed array
    result = rawSidebarData;
  }
  // Filter out any blocks that might be malformed (optional)
  // result = result.filter(block => typeof block === 'object' && block !== null);
  console.log("[Debug] Parsed Sidebar Data (expecting array):", result);
  return result;
});

// Fetch question data when component mounts or route changes
async function fetchQuestionData() {
  // Get ID and Lang from route params
  const questionId = route.params.id;
  const langCode = route.params.lang || locale.value || 'en'; // Use route lang, fallback to i18n locale, then 'en'

  if (!questionId) {
    error.value = 'No question ID provided.';
    isLoading.value = false;
    questionData.value = null;
    updateMetaTags(null);
    return;
  }

  isLoading.value = true
  error.value = null
  questionData.value = null // Reset on new fetch

  console.log(`Fetching question details for ID: ${questionId}, Lang: ${langCode}`)

  try {
    const apiUrl = `${baseUrl}/api/questions`;
    const requestUrl = `${apiUrl}/${questionId}?lang=${langCode}`; // Add lang as query parameter
    console.log(`[Debug] Fetching question from: ${requestUrl}`);
    
    const response = await axios.get(requestUrl);
    
    console.log("[Debug] Raw API Response Data:", response.data); // <-- Log raw response data
    const data = response.data;

    if (data && data.id) {
      questionData.value = data; 
      console.log("[Debug] Assigned questionData:", questionData.value);
      // Log the actual property names from the API response
      console.log("[Debug] Raw nav_sections from data:", questionData.value.nav_sections); 
      console.log("[Debug] Raw sidebar_data from data:", questionData.value.sidebar_data); 
      updateMetaTags(questionData.value);
      console.log('[Debug] Question data loaded and assigned.');
      // Ensure i18n locale matches the displayed content language
      if (locale.value !== langCode) {
          console.warn(`i18n locale (${locale.value}) might be out of sync with displayed lang (${langCode}). Consider updating locale.`);
          // Optionally: locale.value = langCode; // If you want i18n to sync with URL param
      }
    } else {
      console.warn(`[Debug] API returned OK but data is missing or invalid for ID '${questionId}', Lang '${langCode}':`, data);
      error.value = `Received invalid data for question ID '${questionId}'.`;
      updateMetaTags(null);
    }

  } catch (err) {
    console.error('[Debug] Error fetching question details:', err);
    if (err.response && err.response.status === 404) {
        error.value = `Question with ID '${questionId}' not found for language '${langCode}'.`; // Include lang in error
    } else {
        error.value = err.response?.data?.message || err.message || 'Failed to load question details.';
    }
    updateMetaTags(null);
  } finally {
    isLoading.value = false
  }
}

// Watch route parameter changes (BOTH id and lang) to refetch data
watch(
  () => route.params, // Watch the whole params object
  (newParams, oldParams) => {
      // Refetch only if id or lang actually changed
      if (newParams.id !== oldParams?.id || newParams.lang !== oldParams?.lang) {
           console.log('Route params changed, refetching data...', newParams);
           fetchQuestionData();
      }
  },
  { immediate: true, deep: true } // immediate for initial load, deep might be needed for nested params if any
)

// Event listener setup/teardown for internal links
// Add ref="postBody" to the main content article tag in the template
watch(postBody, (newPostBody, oldPostBody) => {
  if (oldPostBody) {
    oldPostBody.removeEventListener('click', handleContentClick);
  }
  if (newPostBody) {
    console.log('Adding click listener to postBody for internal links');
    newPostBody.addEventListener('click', handleContentClick);
  }
}, { flush: 'post' }); // Use flush: 'post' to ensure element exists after render

onMounted(() => {
  // Initial fetch is handled by the watcher with immediate: true
});

onUnmounted(() => {
  if (postBody.value) {
    console.log('Removing click listener from postBody');
    postBody.value.removeEventListener('click', handleContentClick);
  }
});
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
  min-height: calc(100vh - 405px);
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
.post-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
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

/* Add some basic styling for the new sidebar blocks */
.question-sidebar .sidebar-block {
  background-color: #f9f9f9; /* Light background for blocks */
  border: 1px solid #eee;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 4px;
}

.question-sidebar .sidebar-block-title {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.1em; /* Slightly larger title */
  font-weight: 600;
  color: #303133;
}

/* Style for content rendered via v-html if needed */
.question-sidebar .sidebar-block-content :deep(p) {
  margin-top: 0;
  margin-bottom: 1em;
  line-height: 1.6;
}
.question-sidebar .sidebar-block-content :deep(a) {
  color: var(--link-color); /* Use existing link color */
  text-decoration: none;
}
.question-sidebar .sidebar-block-content :deep(a:hover) {
  text-decoration: underline;
}
</style> 