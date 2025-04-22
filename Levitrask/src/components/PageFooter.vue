<template>
  <footer class="page-footer professional-footer">
    <div class="footer-content">
      <div class="footer-links">
        <router-link to="/">Home</router-link>
        <router-link to="/blog">Blog</router-link>
        <!-- Add Terms and Privacy links -->
        <router-link to="/terms">Terms of Service</router-link>
        <router-link to="/privacy">Privacy Policy</router-link>
        <!-- Add more relevant links here -->
        <!-- Example: <router-link to="/about">About Us</router-link> -->
        <!-- Example: <router-link to="/contact">Contact</router-link> -->
      </div>

      <!-- Update Social Media Links Section for Direct Linking -->
      <div class="social-media-links">
        <span class="social-label">Follow us:</span>
        <a
          href="https://x.com/laura48803/status/1913544726663581780"
          target="_blank"
          rel="noopener noreferrer"
          title="Follow us on Twitter"
          class="social-icon twitter-icon"
        >
          <!-- Twitter Icon SVG -->
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
            ></path>
          </svg>
        </a>
        <a
          href="https://www.facebook.com/profile.php?id=61575225757881"
          target="_blank"
          rel="noopener noreferrer"
          title="Follow us on Facebook"
          class="social-icon facebook-icon"
        >
          <!-- Facebook Icon SVG -->
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M12 2.04C6.5 2.04 2 6.53 2 12.06c0 5.07 3.67 9.27 8.44 9.94v-7.03H7.9V12.06h2.54V9.84c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.91h-2.33v7.03c4.77-.67 8.44-4.87 8.44-9.94 0-5.53-4.5-10.02-10-10.02z"
            ></path>
          </svg>
        </a>
        <a
          href="https://www.youtube.com/channel/UCKro0a2XfUNFwsHHhq1gthQ"
          target="_blank"
          rel="noopener noreferrer"
          title="Visit our YouTube Channel"
          class="social-icon youtube-icon"
        >
          <!-- YouTube Icon SVG -->
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M21.582 7.684a2.482 2.482 0 0 0-1.756-1.756C18.25 5.5 12 5.5 12 5.5s-6.25 0-7.826.428a2.482 2.482 0 0 0-1.756 1.756C2 9.258 2 12 2 12s0 2.742.418 4.316a2.482 2.482 0 0 0 1.756 1.756C5.75 18.5 12 18.5 12 18.5s6.25 0 7.826-.428a2.482 2.482 0 0 0 1.756-1.756C22 14.742 22 12 22 12s0-2.742-.418-4.316zM9.75 14.857V9.143L15.22 12 9.75 14.857z"
            ></path>
          </svg>
        </a>
        <!-- Reminder to replace # in href attributes above -->
      </div>

      <div class="disclaimer">
        <p>
          <strong>Disclaimer:</strong> The content on this site is for informational purposes only
          and does not constitute medical advice. Always consult a healthcare professional for any
          health concerns or before making any decisions related to your health or treatment.
        </p>
      </div>

      <div class="copyright">
        <p>&copy; 2025 Levitrask. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
// No share functions needed anymore
</script>

<style scoped>
.professional-footer {
  margin-top: 4rem; /* More space above footer */
  padding: 2.5rem 1rem;
  background-color: #343a40; /* Darker background for professional look */
  color: #adb5bd; /* Lighter text color for contrast */
  border-top: 3px solid #007bff; /* Accent top border */
  text-align: center;
}

.footer-content {
  max-width: 900px; /* Constrain width for better centering */
  margin: 0 auto;
}

.footer-links {
  margin-bottom: 1.5rem;
}

.footer-links a {
  color: #ffffff; /* White links for high contrast */
  text-decoration: none;
  margin: 0 1rem; /* More spacing between links */
  font-size: 0.95rem;
  transition: color 0.2s ease-in-out;
}

.footer-links a:hover {
  color: #007bff; /* Link hover color */
  text-decoration: none;
}

.social-media-links {
  margin-bottom: 1.5rem;
  display: flex; /* Use flexbox for alignment */
  justify-content: center; /* Center the items */
  align-items: center;
}

.social-label {
  margin-right: 0.8rem; /* Space after label */
  color: #adb5bd; /* Match footer text color */
  font-size: 0.9rem;
}

.social-icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  color: #ffffff;
  text-decoration: none;
  margin: 0 0.6rem; /* Adjust spacing between icons */
  transition: color 0.2s ease-in-out, transform 0.2s ease;
  vertical-align: middle;
}

.social-icon svg {
  display: block; /* Ensure SVG takes full space */
  width: 100%;
  height: 100%;
}

.social-icon:hover {
  color: #007bff; /* Link hover color */
  transform: scale(1.1); /* Slightly enlarge icon on hover */
}

.disclaimer {
  margin-bottom: 1.5rem;
  font-size: 0.8rem; /* Smaller disclaimer text */
  line-height: 1.6;
  max-width: 700px; /* Limit disclaimer width */
  margin-left: auto;
  margin-right: auto;
}

.disclaimer strong {
  color: #dee2e6; /* Slightly brighter color for 'Disclaimer:' */
}

.copyright {
  font-size: 0.8rem;
  color: #6c757d; /* Muted color for copyright */
}
</style> 