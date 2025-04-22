<template>
  <div class="not-found-page">
    <h1>404 - Page Not Found</h1>
    <p>Sorry, the page you are looking for does not exist.</p>
    <router-link to="/">Go back to Home</router-link>
  </div>
</template>

<script setup>
// No specific script logic needed for this simple page
</script>

<style scoped>
.not-found-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px); /* Adjust height based on header/footer */
  text-align: center;
  padding: 2rem;
}

.not-found-page h1 {
  color: #dc3545; /* Red color for emphasis */
  margin-bottom: 1rem;
}

.not-found-page p {
  margin-bottom: 1.5rem;
  color: #6c757d;
}

.not-found-page a {
  color: #007bff;
  text-decoration: none;
  font-weight: bold;
}

.not-found-page a:hover {
  text-decoration: underline;
}
</style> 