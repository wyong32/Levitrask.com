<template>
  <div>
    <PageHeader />
    <main class="articles-page">
      <header class="articles-header">
        <h1>Health & Wellness Articles</h1>
        <p>Explore insights on ED treatments, lifestyle, and related health topics.</p>
      </header>

      <div class="article-list">
        <!-- Loop through blog posts from imported data -->
        <article v-for="post in blogsData" :key="post.id" class="article-item">
          <!-- Update router-link to use named route and params -->
          <router-link
            :to="{ name: 'blog-details', params: { id: post.id } }"
            class="article-link-wrapper"
          >
            <div class="article-image">
              <img :src="post.listImage" :alt="post.listTitle" />
            </div>
            <div class="article-content">
              <h2>{{ post.listTitle }}</h2>
              <p class="article-date">{{ post.listDate }}</p>
              <p>{{ post.listDescription }}</p>
              <span class="read-more-link">Read More &raquo;</span>
            </div>
          </router-link>
        </article>
      </div>
    </main>
    <PageFooter />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import PageFooter from '../components/PageFooter.vue'
import blogsData from '../Datas/BlogsData.js' // Import the blog data

// Remove the old hardcoded blogPosts ref
/*
const blogPosts = ref([...])
*/
</script>

<style scoped>
.articles-page {
  padding: 2rem 1rem;
  max-width: 1200px;
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