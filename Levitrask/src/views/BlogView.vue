<template>
  <div>
    <PageHeader />
    <main class="articles-page">
      <header class="articles-header">
        <h1>Health & Wellness Articles</h1>
        <p>Explore insights on ED treatments, lifestyle, and related health topics.</p>
      </header>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-message">Loading articles...</div>

      <!-- Error State -->
      <div v-else-if="error" class="error-message">
        Failed to load articles: {{ error }}
      </div>

      <!-- Data Loaded State -->
      <div v-else class="article-list">
        <!-- Loop through blog posts from fetched data -->
        <article v-for="post in blogListItems" :key="post.slug" class="article-item">
          <!-- Update router-link to use named route and params (lang and slug) -->
          <router-link
            :to="{ name: 'BlogDetails', params: { lang: currentLanguage, slug: post.slug } }"
            class="article-link-wrapper"
          >
            <div class="article-image">
              <img 
                :src="getImageSrc(post.listImageSrc)" 
                :alt="post.listImageAlt || post.listTitle || 'Blog post image'"
              />
            </div>
            <div class="article-content">
              <h2>{{ post.listTitle }}</h2>
              <p class="article-date">{{ post.listDate }}</p>
              <p>{{ post.listDescription }}</p>
              <span class="read-more-link">Read More &raquo;</span>
            </div>
          </router-link>
        </article>

        <!-- Show message if no blog posts -->
        <p v-if="blogListItems.length === 0 && !isLoading && !error" class="no-articles-message">
          No articles available at the moment.
        </p>
      </div>
    </main>
    <PageFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import PageHeader from '../components/PageHeader.vue'
import PageFooter from '../components/PageFooter.vue'
import { useRoute } from 'vue-router'

// State
const blogsData = ref([])
const isLoading = ref(true)
const error = ref(null)
const route = useRoute()

// Compute current language from route or default
const currentLanguage = computed(() => route.params.lang || 'en')

// Base URL
const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

// Fetch blog data
onMounted(async () => {
  fetchBlogList()
})

// Watch for language changes if the component stays mounted while lang changes
watch(currentLanguage, (newLang, oldLang) => {
  if (newLang !== oldLang) {
    console.log(`Language changed to ${newLang}, fetching blog list...`)
    fetchBlogList()
  }
})

// Function to fetch blog list based on current language
const fetchBlogList = async () => {
  isLoading.value = true
  error.value = null
  try {
    const apiUrl = `${baseUrl}/api/blogs?lang=${currentLanguage.value}`
    console.log(`Fetching blogs from: ${apiUrl}`)
    const response = await axios.get(apiUrl)
    if (Array.isArray(response.data)) {
      blogsData.value = response.data
    } else {
      console.warn('API response data for blogs is not an array:', response.data)
      blogsData.value = []
    }
    error.value = null
  } catch (err) {
    console.error('Error fetching blog data:', err)
    error.value = err.response?.data?.message || err.message || 'An unknown error occurred'
    blogsData.value = []
  } finally {
    isLoading.value = false
  }
}

// Computed property to get an array for v-for
const blogListItems = computed(() => {
  return blogsData.value.sort((a, b) => new Date(b.listDate) - new Date(a.listDate))
})

// REVISED function with detailed logging
const getImageSrc = (imageValue) => {
  const placeholder = '/images/placeholder-blog.png'
  console.log(`getImageSrc called with: '${imageValue}'`)

  if (!imageValue) {
    console.log('Value is empty, returning placeholder.')
    return placeholder
  }

  // Trim whitespace just in case
  const trimmedValue = imageValue.trim()
  console.log(`Trimmed value: '${trimmedValue}'`)

  console.log(`Checking startsWith('data:image'):`, trimmedValue.startsWith('data:image'))
  if (trimmedValue.startsWith('data:image')) {
    console.log('Returning existing data URI.')
    return trimmedValue
  }

  console.log(`Checking startsWith('/'):`, trimmedValue.startsWith('/'))
  if (trimmedValue.startsWith('/')) {
    console.log('Returning relative path.')
    return trimmedValue
  }

  console.log(`Checking startsWith('http'):`, trimmedValue.startsWith('http'))
  if (trimmedValue.startsWith('http')) {
    console.log('Returning absolute URL.')
    return trimmedValue
  }

  // If it's not empty, not a data URI, not a path, not a URL,
  // assume it's Base64 data needing the prefix.
  console.log(`Checking length > 50:`, trimmedValue.length > 50)
  if (trimmedValue.length > 50) {
    console.log('Assuming Base64, adding prefix.')
      // Assuming PNG, adjust mime type if necessary (e.g., image/jpeg)
    return `data:image/png;base64,${trimmedValue}`
  }

  // Fallback to placeholder if it doesn't look like any valid format
  console.warn(`Unrecognized image format for value: ${trimmedValue}, using placeholder.`)
  return placeholder
}

</script>

<style scoped>
/* Add styles for loading and error messages */
.loading-message,
.error-message,
.no-articles-message {
  text-align: center;
  padding: 3rem 1rem;
  font-size: 1.2rem;
  color: #6c757d;
}

.error-message {
  color: #dc3545 /* Bootstrap danger color */
}

/* Existing styles */
.articles-page {
  padding: 2rem 1rem;
  max-width: 1200px;
  min-height: calc(100vh - 405px);
  margin: 0 auto;
}

.articles-header {
  text-align: center;
  margin-bottom: 3rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.articles-header h1 {
  font-size: 2.5rem;
  color: #343a40;
  margin-bottom: 0.5rem;
}

.articles-header p {
  font-size: 1.1rem;
  color: #6c757d;
}

.article-list {
  display: grid;
  /* Responsive grid: 1 col mobile, 2 tab, 3 small desktop, 4 large desktop */
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.article-item {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid #e9ecef;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  display: flex; /* Ensure the link wrapper fills the item */
  flex-direction: column; /* Stack content vertically */
}

.article-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

/* Add a wrapper for the link to contain image and content */
.article-link-wrapper {
  text-decoration: none; /* Remove underline from link */
  color: inherit; /* Inherit text color */
  display: flex;
  flex-direction: column;
  height: 100%; /* Make wrapper fill the item */
}

.article-image {
  width: 100%;
  height: 180px; /* Fixed height */
  /* aspect-ratio: 16 / 9; */ /* Alternative: maintain aspect ratio */
  overflow: hidden;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Cover the area, cropping if needed */
  transition: transform 0.3s ease; /* Smooth zoom on hover */
}

.article-item:hover .article-image img {
  transform: scale(1.05); /* Slightly zoom image on hover */
}

.article-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* Allow content to take remaining space */
}

.article-content h2 {
  font-size: 1.15rem; /* Slightly smaller for grid */
  color: #343a40;
  margin-bottom: 0.3rem; /* Adjust margin for date */
  line-height: 1.4;
  /* Limit title lines */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: calc(1.4em * 1.15 * 2); /* Reserve space for 2 lines */
}

.article-date {
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 0.6rem;
}

.article-content p {
  font-size: 0.9rem;
  line-height: 1.5;
  color: #495057;
  flex-grow: 1; /* Allow description to push button down */
  margin-bottom: 1rem;
  /* Limit description lines */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.read-more-link {
  display: inline-block;
  margin-top: auto; /* Push to bottom */
  padding: 0.4rem 0.8rem;
  background-color: #007bff;
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  align-self: flex-start; /* Align button left */
  font-size: 0.85rem;
  font-weight: 500;
}

.article-link-wrapper:hover .read-more-link {
  background-color: #0056b3; /* Darker background on hover */
}

/* Responsive adjustments (using minmax in grid takes care of some) */
@media (max-width: 768px) {
  .articles-header h1 {
    font-size: 2.2rem;
  }
  .article-content h2 {
    font-size: 1.1rem;
    min-height: calc(1.4em * 1.1 * 2);
  }
}

@media (max-width: 576px) {
  .articles-page {
    padding: 1.5rem 0.5rem;
  }
  .articles-header h1 {
    font-size: 1.8rem;
  }
  .article-list {
    gap: 1rem;
  }
  .article-image {
    height: 160px; /* Slightly smaller image on mobile */
  }
}
</style> 