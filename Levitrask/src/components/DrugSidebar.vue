<template>
  <!-- Render sidebar only if there is content to display -->
  <aside class="sidebar" v-if="hasContent">
    <!-- Related Resources Section -->
    <div 
      v-if="sidebarData.relatedResources && sidebarData.relatedResources.length > 0" 
      class="sidebar-section"
    >
      <h3>相关资源</h3> <!-- Or use i18n for title -->
      <ul>
        <li v-for="(link, index) in sidebarData.relatedResources" :key="`rel-${index}-${link.to}`">
          <router-link :to="link.to">{{ link.text }}</router-link>
        </li>
      </ul>
    </div>

    <!-- FAQs Section -->
    <div 
      v-if="sidebarData.faqs && sidebarData.faqs.length > 0" 
      class="sidebar-section"
    >
      <h3>常见问题</h3> <!-- Or use i18n for title -->
      <ul>
        <li v-for="(link, index) in sidebarData.faqs" :key="`faq-${index}-${link.to}`">
          <router-link :to="link.to">{{ link.text }}</router-link>
        </li>
      </ul>
    </div>

    <!-- Add more sections here if sidebarData structure expands -->

  </aside>
  <!-- Optional: Render a placeholder or nothing if no content -->
  <div v-else>
    <!-- Sidebar is empty -->
  </div>
</template>

<script setup>
import { computed } from 'vue'; // Import computed

// Define the 'sidebarData' prop, expecting an object
// containing arrays for relatedResources and faqs
const props = defineProps({
  sidebarData: {
    type: Object,
    required: true,
    default: () => ({ relatedResources: [], faqs: [] }) // Default to an object with empty arrays
  }
});

// Computed property to check if there is any content to display
const hasContent = computed(() => {
  return (props.sidebarData.relatedResources && props.sidebarData.relatedResources.length > 0) ||
         (props.sidebarData.faqs && props.sidebarData.faqs.length > 0);
  // Add checks for other potential sections here
});

// No need for generateRouteObject anymore as we use router-link

</script>

<style scoped>
/* Keep existing styles, they should apply reasonably well */
.sidebar {
  /* Basic sidebar container styles */
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  height: fit-content; 
}

.sidebar-section {
  margin-bottom: 1.5rem; /* Space between sections */
}
.sidebar-section:last-child {
  margin-bottom: 0;
}
.sidebar-section h3 {
  font-size: 1.1rem;
  margin-bottom: 0.8rem;
  border-bottom: 1px solid #ced4da;
  padding-bottom: 0.4rem;
  color: #495057;
}

/* Styling for the lists */
.sidebar-section ul {
  list-style: none; /* Remove default bullets */
  padding-left: 0; /* Remove default padding */
  margin-top: 0.5rem;
}

.sidebar-section ul li {
  margin-bottom: 0.6rem; /* Space between links */
}

/* Styling for the links */
.sidebar-section ul li a {
  color: #007bff; /* Link color */
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.sidebar-section ul li a:hover {
  color: #0056b3; /* Link hover color */
  text-decoration: underline;
}

/* Remove styles specific to v-html content if they are no longer needed */
/* .sidebar-section > div > p, ... etc. */

</style> 