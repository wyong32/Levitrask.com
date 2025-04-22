<template>
  <div>
    <PageHeader />
    <main class="news-page">
      <header class="news-header">
        <h1>Latest News & Updates</h1>
      </header>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-message">Loading news articles...</div>

      <!-- Error State -->
      <div v-else-if="error" class="error-message">
        Failed to load news: {{ error }}
      </div>

      <!-- Data Loaded State -->
      <div v-else class="news-list">
        <!-- Loop through news items from data -->
        <article v-for="item in newsListItems" :key="item.id" class="news-item">
          <div class="news-image">
            <!-- Use listImage if available, otherwise fallback -->
            <img
              :src="item.listImage?.src || '/images/placeholder-news.png'"
              :alt="item.listImage?.alt || item.listTitle || 'News article image'"
            />
          </div>
          <div class="news-content">
            <!-- Use listTitle or fallback to metaTitle (or a generic placeholder) -->
            <h2>{{ item.listTitle || item.metaTitle || 'News Article' }}</h2>
            <p class="news-meta">
              <!-- Display date/source if available in data -->
              <span v-if="item.listDate" class="news-date">{{ item.listDate }}</span>
              <span v-if="item.listDate && item.listSource"> | </span>
              <span v-if="item.listSource" class="news-source">Source: {{ item.listSource }}</span>
            </p>
            <!-- Use listDescription for snippet -->
            <p>
              {{ item.listDescription || 'Read more...' }}
            </p>
            <router-link
              :to="{ name: 'news-details', params: { id: item.id } }"
              class="read-more-link"
            >
              Read Full Story &raquo;
              <!-- Adjusted text -->
            </router-link>
          </div>
        </article>

        <!-- Show message if no news items and not loading/error -->
        <p v-if="newsListItems.length === 0 && !isLoading && !error" class="no-news-message">
          No news articles available at the moment.
        </p>
      </div>
    </main>
    <PageFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue' // Import ref and onMounted
import axios from 'axios' // Import axios
import PageHeader from '../components/PageHeader.vue'
import PageFooter from '../components/PageFooter.vue'
// Removed: import allNewsData from '../Datas/newsData.js'

// Reactive state for data, loading, and errors
const newsData = ref({}) // Stores the fetched news data object
const isLoading = ref(true) // Tracks loading state
const error = ref(null) // Stores any fetch error

// Fetch news data when component mounts
onMounted(async () => {
  try {
    // Use relative path for API call, Vite proxy will handle redirection locally
    const apiUrl = '/api/news'; 
    console.log(`Fetching news from: ${apiUrl}`); // Log the relative URL
    const response = await axios.get(apiUrl) // Use relative path
    newsData.value = response.data 
    error.value = null // Clear any previous errors
  } catch (err) {
    console.error('Error fetching news data:', err)
    error.value = err.response?.data?.message || err.message || 'An unknown error occurred'
    newsData.value = {} // Clear data on error
  } finally {
    isLoading.value = false // Set loading to false regardless of outcome
  }
})

// Convert the fetched news data object into an array for v-for
const newsListItems = computed(() => {
  // Check if newsData.value is an object before calling Object.values
  return newsData.value && typeof newsData.value === 'object'
    ? Object.values(newsData.value)
    : []
  // You might want to add sorting here later, e.g., by date
  // .sort((a, b) => new Date(b.date) - new Date(a.date))
})
</script>

<style scoped>
/* Add styles for loading and error messages */
.loading-message,
.error-message {
  text-align: center;
  padding: 3rem 1rem;
  font-size: 1.2rem;
  color: #6c757d;
}

.error-message {
  color: #dc3545; /* Bootstrap danger color */
}

.news-page {
  padding: 2rem 1rem;
  max-width: 950px; /* Adjusted max-width */
  margin: 0 auto;
}

.news-header {
  text-align: center;
  margin-bottom: 3rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.news-header h1 {
  font-size: 2.5rem;
  color: #343a40;
  margin-bottom: 0.5rem;
}

.news-header p {
  font-size: 1.1rem;
  color: #6c757d;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 2.5rem; /* Increased gap */
}

.news-item {
  display: flex; /* Arrange image and content in a row */
  align-items: center; /* Align items to top */
  gap: 1.5rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.07);
  border: 1px solid #e9ecef;
  overflow: hidden; /* To handle image radius if needed */
  transition: box-shadow 0.2s ease-in-out;
}

.news-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.news-image {
  flex: 0 0 180px; /* Fixed width for image container */
  height: 140px; /* Fixed height for image container */
  overflow: hidden; /* Hide image overflow */
}

.news-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 8px 0 0 8px; /* Optional: round top-left and bottom-left corners */
}

.news-content {
  flex: 1; /* Allow content to take remaining space */
  padding: 1rem 1.5rem 1rem 0; /* Add padding (mostly right) */
  display: flex;
  flex-direction: column;
  /* Ensure content takes height if needed, adjust based on look */
  min-height: 140px; /* Match image height roughly */
}

.news-content h2 {
  font-size: 1.3rem; /* Adjusted size */
  color: #343a40;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.news-meta {
  font-size: 0.8rem;
  color: #868e96;
  margin-bottom: 0.8rem;
}

.news-date,
.news-source {
  display: inline-block;
  margin-right: 0.5rem;
}

.news-content p {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #495057;
  margin-bottom: 1rem;
  flex-grow: 1; /* Allow description to push link down */
}

.read-more-link {
  display: inline-block;
  margin-top: auto; /* Push link to bottom */
  padding: 0.4rem 0.8rem;
  background-color: #6c757d;
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  align-self: flex-start;
  font-size: 0.9rem;
}

.read-more-link:hover {
  background-color: #5a6268;
}

/* Message for no news */
.no-news-message {
  text-align: center;
  color: #6c757d;
  padding: 2rem;
  font-style: italic;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .news-item {
    flex-direction: column; /* Stack image and content */
    gap: 0; /* Remove gap when stacked */
  }
  .news-image {
    flex-basis: auto;
    width: 100%;
    height: 200px; /* Adjust height */
  }
  .news-image img {
    border-radius: 8px 8px 0 0; /* Round top corners only */
  }
  .news-content {
    padding: 1rem; /* Add padding all around */
    min-height: auto; /* Reset min-height */
  }
}
</style> 