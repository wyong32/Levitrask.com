<template>
  <aside class="sidebar">
    <!-- Drug Status Section -->
    <div v-if="sidebarData.drugStatus" class="sidebar-section drug-status">
      <h3>{{ customTitles.drugStatus || 'Drug Status' }}</h3>
      <p v-if="sidebarData.drugStatus.availability">
        Availability:
        <span :class="sidebarData.drugStatus.availability.statusClass || ''">
          {{ sidebarData.drugStatus.availability.text }}
        </span>
        {{ sidebarData.drugStatus.details || '' }}
      </p>
      <p v-if="sidebarData.drugStatus.pregnancyLactation">
        Pregnancy & Lactation: {{ sidebarData.drugStatus.pregnancyLactation }}
      </p>
      <p v-if="sidebarData.drugStatus.approvalHistory">
        Approval History: {{ sidebarData.drugStatus.approvalHistory }}
      </p>
    </div>

    <!-- Quick Summary Section -->
    <div v-if="sidebarData.quickSummary" class="sidebar-section quick-summary">
      <h3>{{ customTitles.quickSummary || 'Quick Summary' }}</h3>
      <p v-if="sidebarData.quickSummary.formsStrengths" class="forms-strengths-text">
        <strong>Forms/Strengths:</strong>
        <span v-html="sidebarData.quickSummary.formsStrengths"></span>
      </p>
      <p v-if="sidebarData.quickSummary.reminders && sidebarData.quickSummary.reminders.length">
        <strong>Key Reminders:</strong>
      </p>
      <ul v-if="sidebarData.quickSummary.reminders && sidebarData.quickSummary.reminders.length">
        <li
          v-for="(reminder, index) in sidebarData.quickSummary.reminders"
          :key="`reminder-${index}`"
        >
          {{ reminder }}
        </li>
      </ul>
    </div>

    <!-- Drug Image Section -->
    <div v-if="sidebarData.drugImage" class="sidebar-section drug-image">
      <h3>{{ customTitles.drugImage || 'Drug Image' }}</h3>
      <img :src="sidebarData.drugImage.src" :alt="sidebarData.drugImage.alt || 'Drug image'" />
      <p v-if="sidebarData.drugImage.caption" class="drug-image-caption">
        {{ sidebarData.drugImage.caption }}
      </p>
    </div>

    <!-- Related Resources Section -->
    <div
      v-if="sidebarData.relatedResources && sidebarData.relatedResources.length"
      class="sidebar-section related-resources"
    >
      <h3>{{ customTitles.relatedResources || 'Related Resources' }}</h3>
      <ul>
        <li v-for="(link, index) in sidebarData.relatedResources" :key="`resource-${index}`">
          <router-link :to="link.to">{{ link.text }}</router-link>
        </li>
      </ul>
    </div>

    <!-- Similar Drugs Section -->
    <div
      v-if="sidebarData.similarDrugs && sidebarData.similarDrugs.length"
      class="sidebar-section similar-drugs"
    >
      <h3>{{ customTitles.similarDrugs || 'Drugs in this Class (PDE5 Inhibitors)' }}</h3>
      <ul>
        <li v-for="(link, index) in sidebarData.similarDrugs" :key="`similar-${index}`">
          <router-link :to="link.to">{{ link.text }}</router-link>
        </li>
      </ul>
    </div>

    <!-- Drug Comparison Section -->
    <div
      v-if="sidebarData.drugComparison && sidebarData.drugComparison.length"
      class="sidebar-section drug-comparison"
    >
      <h3>{{ customTitles.drugComparison || 'Drug Comparison' }}</h3>
      <ul>
        <li v-for="(link, index) in sidebarData.drugComparison" :key="`compare-${index}`">
          <router-link :to="link.to">{{ link.text }}</router-link>
        </li>
      </ul>
    </div>

    <!-- Frequently Asked Questions Section -->
    <div
      v-if="sidebarData.frequentlyAskedQuestions && sidebarData.frequentlyAskedQuestions.length"
      class="sidebar-section faq-section"
    >
      <h3>{{ customTitles.frequentlyAskedQuestions || 'Frequently Asked Questions' }}</h3>
      <ul>
        <li v-for="(link, index) in sidebarData.frequentlyAskedQuestions" :key="`faq-${index}`">
          <router-link :to="link.to">{{ link.text }}</router-link>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup>
// import { RouterLink } from 'vue-router'; // Uncomment if RouterLink is not global

defineProps({
  sidebarData: {
    type: Object,
    required: true,
    default: () => ({
      // Provide a default empty structure
      drugStatus: null,
      quickSummary: null,
      drugImage: null,
      relatedResources: [],
      similarDrugs: [],
      drugComparison: [],
      frequentlyAskedQuestions: [],
    }),
  },
  // Add the new optional prop for custom titles
  customTitles: {
    type: Object,
    default: () => ({}), // Default to an empty object
  },
})
</script>

<style scoped>
/* 右侧边栏 */
.sidebar {
  flex: 1.5;
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  height: fit-content;
  /* sticky positioning removed previously */
}

/* 侧边栏 */
.sidebar-section {
  margin-bottom: 1.5rem;
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
.sidebar-section p {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  line-height: 1.4;
}
.status-active {
  color: #28a745;
  font-weight: bold;
}
.drug-image img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  display: block;
  margin-bottom: 0.5rem;
}

/* Add style for the image caption */
.drug-image-caption {
  font-size: 0.8rem;
  color: #6c757d;
  text-align: center;
  margin-top: 0.5rem;
  margin-bottom: 0;
}

/* Styling for lists and links within the sidebar */
.sidebar-section ul {
  padding-left: 20px;
  margin-top: 0.5rem;
}

.sidebar-section li {
  margin-bottom: 0.4rem;
}

/* Target both regular links and router-links */
.sidebar-section a {
  color: #007bff;
  text-decoration: none;
  font-size: 0.9rem;
}
.sidebar-section a:hover {
  text-decoration: underline;
}

/* Adjust spacing if needed */
.sidebar-section.quick-summary ul {
  list-style: disc; /* Use standard bullets for reminders */
  padding-left: 20px; /* Ensure padding for list style */
}
</style> 