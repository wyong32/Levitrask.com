<template>
  <div>
    <PageHeader />
    <main class="post-details-page layout-3-column">
      <!-- Left Sidebar for Navigation -->
      <SideNav
        v-if="blogPost && blogPost.navSections && blogPost.navSections.length > 0"
        :sections="blogPost.navSections"
        content-selector=".post-body > section"
        class="sidebar-left side-nav-component"
      />
      <!-- Add a placeholder or adjust grid if navSections are empty -->
      <div v-else class="sidebar-left-placeholder"></div>

      <div class="container post-container" v-if="blogPost">
        <article class="post-content-area">
          <!-- Main content area -->
          <div class="post-body" ref="postBodyRef" v-html="blogPost.content"></div>
        </article>

        <aside class="post-sidebar drug-sidebar-component">
          <!-- Replace placeholder with DrugSidebar -->
          <DrugSidebar
            v-if="blogPost && blogPost.sidebarData"
            :sidebar-data="blogPost.sidebarData"
          />
          <!-- Placeholder for potential sidebar content (e.g., related posts) -->
          <!-- <div class="sidebar-section related-posts">
            <h3>Related Articles</h3>
            <ul>
              <li>Related post 1</li>
              <li>Related post 2</li>
            </ul>
          </div> -->
        </aside>
      </div>
      <div class="container" v-else>
        <p class="not-found">Blog post not found.</p>
      </div>
    </main>
    <PageFooter />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import blogsData from '../Datas/BlogsData.js'
import PageHeader from '../components/PageHeader.vue'
import PageFooter from '../components/PageFooter.vue'
import SideNav from '../components/SideNav.vue'
import DrugSidebar from '../components/DrugSidebar.vue'

const props = defineProps({
  id: String, // Received from router props: true
})

const route = useRoute()
const router = useRouter()
const blogPost = ref(null)

const loadBlogPost = (postId) => {
  if (postId && blogsData[postId]) {
    blogPost.value = blogsData[postId]
    updateMetaTags()
  } else {
    blogPost.value = null
    // Optionally redirect to a 404 page or BlogView
    // router.push({ name: 'blog' });
  }
}

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

// Watch for changes in the route parameter (props.id)
watch(
  () => props.id,
  (newId) => {
    loadBlogPost(newId)
  },
  { immediate: true } // Load immediately when component mounts
)

// Handle internal links within v-html content (if needed, similar to QuestionDetails)
onMounted(() => {
  // Initial load based on prop
  loadBlogPost(props.id)

  // Optional: Add click handler for internal links if blog content uses <a> tags
  // nextTick(() => {
  //   const contentArea = document.querySelector('.post-body');
  //   if (contentArea) {
  //     contentArea.addEventListener('click', handleContentClick);
  //   }
  // });
})

// Optional: Click handler for internal links
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

// Ref for the content container
const postBodyRef = ref(null)

// Add event listener when the component mounts and cleanup
onMounted(() => {
  // Initial load based on prop - This seems redundant due to the watcher, consider removing if watcher works
  // loadBlogPost(props.id);

  // Add click listener
  nextTick(() => {
    // Use nextTick to ensure DOM is ready
    if (postBodyRef.value) {
      postBodyRef.value.addEventListener('click', handleContentClick)
    }
  })
})

// Remove event listener when the component unmounts
onUnmounted(() => {
  if (postBodyRef.value) {
    postBodyRef.value.removeEventListener('click', handleContentClick)
  }
})

// Optional: Cleanup listener
// import { onUnmounted } from 'vue';
// onUnmounted(() => {
//   const contentArea = document.querySelector('.post-body');
//   if (contentArea) {
//     contentArea.removeEventListener('click', handleContentClick);
//   }
// });
</script>

<style scoped>
/* Reuse styles from QuestionDetails.vue or create specific ones */
.post-details-page {
  padding: 2rem 1rem;
  /* Add display: flex or grid to manage 3 columns */
  display: flex;
  max-width: 1400px; /* Adjust max-width for 3 columns */
  margin: 0 auto;
  gap: 2rem; /* Adjust gap */
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

.not-found {
  text-align: center;
  font-size: 1.2rem;
  color: #6c757d;
  padding: 3rem 0;
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
</style>
