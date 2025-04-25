<template>
  <div>
    <PageHeader />
    <main class="post-details-page layout-3-column">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-message full-width-message">
        Loading blog post...
      </div>
      <!-- Error State -->
      <div v-else-if="error" class="error-message full-width-message">
        Failed to load blog post: {{ error }}
      </div>

      <!-- Data Loaded State -->
      <template v-else-if="blogPost">
        <!-- Left Sidebar for Navigation -->
        <SideNav
          v-if="blogPost.navSections && blogPost.navSections.length > 0"
          :sections="blogPost.navSections"
          content-selector=".post-body > section"
          class="sidebar-left side-nav-component"
        />
        <!-- Add a placeholder or adjust grid if navSections are empty -->
        <div v-else class="sidebar-left-placeholder"></div>

        <div class="container post-container">
          <article class="post-content-area">
            <!-- Main content area -->
            <div class="post-body" ref="postBodyRef" v-html="blogPost.content"></div>
          </article>
          
          <aside class="post-sidebar drug-sidebar-component">
            <!-- DrugSidebar Component -->
            <DrugSidebar
              v-if="blogPost.sidebarData && blogPost.sidebarData.length > 0"
              :blocks="blogPost.sidebarData"
            />
            <div v-else>
              <!-- No sidebar content for this post -->
            </div>
          </aside>
        </div>
      </template>

      <!-- Not Found State -->
      <div class="container not-found-message full-width-message" v-else>
        <p>Blog post not found.</p>
      </div>
    </main>
    <PageFooter />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios' // Import axios
import PageHeader from '../components/PageHeader.vue'
import PageFooter from '../components/PageFooter.vue'
import SideNav from '../components/SideNav.vue'
import DrugSidebar from '../components/DrugSidebar.vue'

const props = defineProps({
  id: String, // Received from router props: true
})

const route = useRoute()
const router = useRouter()

// Reactive state
const blogPost = ref(null)
const isLoading = ref(true)
const error = ref(null)
const postBodyRef = ref(null) // Ref for the content container

// Base URL from environment variable
const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

// --- Fetch Blog Post Data --- 
async function fetchBlogPost(postId) {
  if (!postId) {
    error.value = 'No blog post ID provided.';
    isLoading.value = false;
    blogPost.value = null;
    updateMetaTags();
    return;
  }

  isLoading.value = true
  error.value = null
  blogPost.value = null // Reset on new fetch

  console.log(`Fetching blog post details for ID: ${postId}`)

  try {
    // UPDATED: Use the detail endpoint
    const detailApiUrl = `${baseUrl}/api/blogs/${postId}`; 
    console.log(`Fetching blog detail from: ${detailApiUrl}`);
    // Assuming the detail endpoint doesn't require auth, add config if it does
    const response = await axios.get(detailApiUrl); 
    const fetchedData = response.data; // Response should be the single blog object

    // Check if data is valid
    if (fetchedData && fetchedData.id) { // Check for ID (or blog_id)
      blogPost.value = fetchedData;
      updateMetaTags(); // Update meta tags after fetching
      console.log('Blog post data loaded:', blogPost.value);

      await nextTick(); // Wait for DOM update cycle
      setupContentClickListener();

    } else {
      // Handle cases where API returns 200 OK but invalid data
      console.warn(`API returned OK but data is missing or invalid for blog ID '${postId}':`, fetchedData);
      error.value = `Received invalid data for blog post with ID '${postId}'.`;
      updateMetaTags(); // Update meta for not found case
    }
  // UPDATED: Catch block remains similar, but error might come from detail endpoint directly
  } catch (err) {
    console.error('Error fetching blog post details:', err);
    // Check for 404 specifically
    if (err.response && err.response.status === 404) {
        error.value = `Blog post with ID '${postId}' not found.`;
    } else {
        error.value = err.response?.data?.message || err.message || 'Failed to load blog post details.';
    }
    updateMetaTags(); // Update meta for error case
  } finally {
    isLoading.value = false
  }
}

// --- Meta Tag Management --- 
const updateMetaTags = () => {
  if (blogPost.value) {
    document.title = blogPost.value.metaTitle || 'Levitrask Blog'
    setMetaTag('description', blogPost.value.metaDescription || '')
    setMetaTag('keywords', blogPost.value.metaKeywords || '')
  } else {
    document.title = 'Blog Post Not Found | Levitrask Blog'
    setMetaTag('description', '')
    setMetaTag('keywords', '')
  }
}

const setMetaTag = (name, content) => {
  let element = document.querySelector(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

// --- Content Click Handler (for internal links) --- 
const handleContentClick = (event) => {
  const target = event.target.closest('a'); // Check closest anchor tag
  if (target && target.closest('.post-body')) { 
    let href = target.getAttribute('href');
    
    // Basic check for internal links (starts with / but not //)
    if (href && href.startsWith('/') && !href.startsWith('//')) {
      event.preventDefault();

      // --- Check if link ALREADY has language prefix --- 
      const langParam = route.params.lang; // Get current language from route
      const hasLangPrefix = href.startsWith(`/${langParam}/`) || href === `/${langParam}`;

      // If it does NOT have the prefix, add it
      if (!hasLangPrefix && langParam) {
          // Ensure we don't double-slash if href is just '/'
          href = href === '/' ? `/${langParam}` : `/${langParam}${href}`;
      }
      
      // Navigate using router.push
      if (href !== route.fullPath) { // Avoid navigating to the same page
        router.push(href);
      }
    } 
    // External links or non-navigational links will behave normally
  }
};

// Function to setup (add) the click listener
const setupContentClickListener = () => {
  if (postBodyRef.value) {
    console.log('Attaching click listener to .post-body');
    // Remove first to avoid duplicates if called multiple times
    postBodyRef.value.removeEventListener('click', handleContentClick);
    postBodyRef.value.addEventListener('click', handleContentClick);
  }
};

// Function to remove the click listener
const removeContentClickListener = () => {
  if (postBodyRef.value) {
    console.log('Removing click listener from .post-body');
    postBodyRef.value.removeEventListener('click', handleContentClick);
  }
};

// ADDED: getImageSrc function (copied from BlogView.vue)
const getImageSrc = (imageValue) => {
  const placeholder = '/images/placeholder-blog.png'; // Ensure placeholder exists

  if (!imageValue) {
    return placeholder; 
  }
  const trimmedValue = imageValue.trim();

  if (trimmedValue.startsWith('data:image')) {
    return trimmedValue; 
  }
  if (trimmedValue.startsWith('/')) {
    // Assuming relative paths are served correctly by the frontend deployment
    return trimmedValue;
  }
  if (trimmedValue.startsWith('http')) {
    return trimmedValue; 
  }
  // Assume Base64 if other checks fail and length is reasonable
  if (trimmedValue.length > 50) { 
      return `data:image/png;base64,${trimmedValue}`; // Assuming PNG
  }
  console.warn(`Unrecognized image format in BlogDetails for value: ${trimmedValue}, using placeholder.`);
  return placeholder;
}

// --- Lifecycle and Watchers --- 

// Watch for changes in the route parameter (props.id)
watch(
  () => props.id,
  (newId) => {
    fetchBlogPost(newId)
  },
  { immediate: true } // Load immediately when component mounts
)

onMounted(() => {
  // Listener setup is now handled within fetchBlogPost after data loads
})

onUnmounted(() => {
  removeContentClickListener(); // Cleanup listener on unmount
})

</script>

<style scoped>
/* Add styles for loading/error/not-found messages */
.loading-message,
.error-message,
.not-found-message {
  text-align: center;
  padding: 5rem 1rem;
  font-size: 1.2rem;
  color: #6c757d;
}

.error-message {
  color: #dc3545;
}

/* Ensure message takes full width if sidebar isn't shown */
.full-width-message {
   grid-column: 1 / -1; /* Span all columns if in grid, or adjust layout */
   width: 100%;
}

/* Reuse styles from QuestionDetails.vue or create specific ones */
.post-details-page {
  padding: 2rem 1rem;
  /* Add display: flex or grid to manage 3 columns */
  display: flex;
  max-width: 1400px; /* Adjust max-width for 3 columns */
  margin: 0 auto;
  gap: 2rem; /* Adjust gap */
  min-height: calc(100vh - 405px);
}

.sidebar-left {
  flex: 1; /* Example width */
  min-width: 180px; /* Example min-width */
  max-width: 220px; /* Example max-width */
  position: sticky; /* Make sidebar sticky */
  top: 80px; /* Adjust based on header height */
  height: calc(100vh - 100px); /* Adjust height */
  overflow-y: auto; /* Allow scrolling if needed */
}

.sidebar-left-placeholder {
  flex: 1; /* Occupy the same space as the sidebar */
  min-width: 180px;
  max-width: 220px;
}

/* Renamed .container to .post-container to avoid conflicts */
.post-container {
  /* max-width: 1100px; Remove max-width or adjust */
  /* margin: 0 auto; Remove margin */
  display: flex; /* Keep flex for content/right sidebar */
  flex: 3; /* Adjust flex grow based on 3 columns */
  gap: 2rem;
  min-width: 0; /* Prevent overflow */
}

.post-content-area {
  flex: 3; /* Adjust flex-basis/grow */
  min-width: 0; /* Prevents overflow issues */
}

.post-body {
  line-height: 1.7;
  color: #333;
}

/* Deep selector to style v-html content */
.post-body :deep(h1),
.post-body :deep(h2),
.post-body :deep(h3) {
  margin-top: 1.8em;
  margin-bottom: 0.8em;
  line-height: 1.3;
  color: #2c3e50;
}

.post-body :deep(h1) {
  font-size: 2rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.post-body :deep(h2) {
  font-size: 1.6rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.4rem;
}

.post-body :deep(h3) {
  font-size: 1.3rem;
}

.post-body :deep(p) {
  margin-bottom: 1.2em;
}

.post-body :deep(ul),
.post-body :deep(ol) {
  margin-left: 1.5em;
  margin-bottom: 1.2em;
  padding-left: 1em;
}

.post-body :deep(li) {
  margin-bottom: 0.5em;
}

.post-body :deep(a) {
  color: #007bff;
  text-decoration: none;
  transition: color 0.2s;
}

.post-body :deep(a:hover) {
  color: #0056b3;
  text-decoration: underline;
}

.post-body :deep(hr) {
  border: none;
  border-top: 1px solid #eee;
  margin: 2em 0;
}

.post-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1em 0;
}

.post-sidebar {
  flex: 1; /* Adjust flex-basis/grow */
  min-width: 200px; /* Minimum width for sidebar */
}

.sidebar-section {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid #e9ecef;
}

.sidebar-section h3 {
  font-size: 1.2rem;
  color: #343a40;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #dee2e6;
}

.sidebar-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-section li {
  margin-bottom: 0.75rem;
}

.sidebar-section li a {
  color: #007bff;
  text-decoration: none;
  font-size: 0.95rem;
}

.sidebar-section li a:hover {
  text-decoration: underline;
}

/* Responsive adjustments */
/* Tablet and smaller screens: Hide left sidebar, stack main and right */
@media (max-width: 1024px) {
  .post-details-page {
    flex-direction: column;
    /* padding: 1.5rem 1rem; /* Adjust padding as needed */
  }
  .sidebar-left,
  .sidebar-left-placeholder,
  .side-nav-component {
    /* Ensure targeting by class too */
    display: none; /* Hide left sidebar */
  }
  .post-container {
    flex-direction: column; /* Stack content and right sidebar */
    flex: 1; /* Take full width */
    padding: 0; /* Reset padding if main container has it */
    gap: 1.5rem; /* Adjust gap */
  }
  .post-content-area {
    order: 1; /* Ensure content comes first */
  }
  .post-sidebar.drug-sidebar-component {
    min-width: unset; /* Allow sidebar to shrink */
    width: 100%; /* Ensure it takes full width */
    margin-top: 1rem; /* Adjust top margin */
    order: 2; /* Ensure sidebar comes after content */
  }
}

/* Further Mobile adjustments (optional, if 1024px is not enough) */
@media (max-width: 768px) {
  .post-details-page {
    padding: 1rem; /* Consistent padding with IndexView */
  }
  /* Styles from 1024px breakpoint already handle the main layout changes */
  /* Add more specific mobile adjustments here if needed */
  .post-container {
    gap: 1rem;
  }
}

/* Add scroll margin to section headers targeted by SideNav */
.post-body :deep(section[id]) {
  scroll-margin-top: 100px; /* Adjust based on actual header height */
}

/* ADDED: Styles for the main image container */
.post-main-image {
  width: 100%;
  max-height: 400px; /* Limit max height */
  margin-bottom: 1.5rem;
  text-align: center; /* Center image if it's narrower than container */
  overflow: hidden; /* Hide overflow */
  border-radius: 8px; /* Optional: add rounding */
  background-color: #f8f9fa; /* Optional: background for loading/aspect ratio */
}

.post-main-image img {
  max-width: 100%;
  height: auto; /* Maintain aspect ratio */
  max-height: 400px; /* Match container max height */
  object-fit: contain; /* Fit within bounds, maintain aspect ratio */
  display: block; /* Remove extra space below image */
  margin: 0 auto; /* Center image */
}

/* Ensure layout still works */
.layout-3-column {
  display: flex; /* Use flex for columns */
  max-width: 1300px; /* Adjust overall max width */
  margin: 2rem auto;
  padding: 0 1rem;
  gap: 2rem;
  align-items: flex-start; /* Align items to the top */
}

.sidebar-left {
  flex: 0 0 220px; /* Fixed width for left nav */
  position: sticky;
  top: 80px; /* Adjust based on header height */
}

.sidebar-left-placeholder {
   flex: 0 0 220px;
}

.post-container {
  display: flex; /* Use flex for main content and right sidebar */
  flex: 1; /* Take remaining space */
  min-width: 0; /* Prevent overflow issues */
  gap: 2rem;
  align-items: flex-start;
}

.post-content-area {
  flex: 1; /* Main content takes most space */
  min-width: 0;
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.post-sidebar {
  flex: 0 0 280px; /* Fixed width for right sidebar */
  position: sticky;
  top: 80px;
}

.post-body :deep(h1) {
  font-size: 2rem;
  color: #343a40;
  margin-top: 0; /* Remove top margin if image is present */
  margin-bottom: 1.5rem; /* Add space below h1 */
  line-height: 1.3;
}

/* Adjust other deep styles if needed */
.post-body :deep(p):first-of-type {
    margin-top: 0; /* Remove top margin on first paragraph after image */
}
</style>
