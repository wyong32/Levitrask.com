<template>
  <div class="news-post-page single-column-page">
    <PageHeader />
    <main class="content-area-single-column">
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
          <!-- Render the full HTML content string -->
          <div v-html="questionData.content"></div>
        </div>
      </article>
      <!-- Article Not Found State (handled by error now, but could be separate) -->
      <div v-else class="main-content-middle not-found-message">
        <p>Not Found</p>
      </div>
    </main>
    <PageFooter />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import PageHeader from '../components/PageHeader.vue'
import PageFooter from '../components/PageFooter.vue'
import SideNav from '../components/SideNav.vue'
import DrugSidebar from '../components/DrugSidebar.vue'

const route = useRoute()
const router = useRouter()
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

// Fetch question data when component mounts or route changes
async function fetchQuestionData() {
  const questionId = route.params.id
  if (!questionId) {
    error.value = 'No question ID provided.';
    isLoading.value = false;
    questionData.value = null; // Ensure reset
    updateMetaTags(null); // Update meta for no ID case
    return;
  }

  isLoading.value = true
  error.value = null
  questionData.value = null // Reset on new fetch

  console.log(`Fetching question details for ID: ${questionId}`)

  try {
    const apiUrl = `${baseUrl}/api/questions`; // Base API URL
    console.log(`Fetching question from: ${apiUrl}/${questionId}`);
    // Fetch the specific question using the ID in the URL
    const response = await fetch(`${apiUrl}/${questionId}`); // Use fetch or axios.get

    if (!response.ok) {
      // Handle non-OK responses (like 404)
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
          const errData = await response.json();
          errorMsg = errData.message || errorMsg; 
      } catch (parseErr) { /* Ignore if body isn't JSON */ }
      throw new Error(errorMsg);
    }

    // If response IS ok (200), parse the data
    const data = await response.json();

    // Check if the returned data is a valid object with an ID
    if (data && data.id) {
      questionData.value = data; // Assign the received object directly
      updateMetaTags(questionData.value);
      console.log('Question data loaded:', questionData.value);
    } else {
      // Handle case where API returns 200 OK but invalid/empty data
      console.warn(`API returned OK but data is missing or invalid for ID '${questionId}':`, data);
      error.value = `Received invalid data for question ID '${questionId}'.`;
      updateMetaTags(null);
    }

  } catch (err) {
    // Catch network errors or errors thrown from !response.ok check
    console.error('Error fetching question details:', err);
    error.value = err.message || 'Failed to load question details.';
    updateMetaTags(null);
  } finally {
    isLoading.value = false
  }
}

// Watch route parameter changes to refetch data
watch(() => route.params.id, fetchQuestionData, { immediate: true }) // Use immediate: true to fetch on initial load

// Event listener setup/teardown for internal links
// Add ref="postBody" to the main content article tag in the template
watch(postBody, (newPostBody) => {
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
</style> 