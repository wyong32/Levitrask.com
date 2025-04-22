import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
// Removed direct imports, using lazy loading below

// --- Helper function to set meta tags (handles name and property) ---
const setMetaTag = (attr, key, value) => {
  let element = document.querySelector(`meta[${attr}='${key}']`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attr, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', value)
}

// --- Helper function to set Canonical URL ---
const setCanonicalUrl = (url) => {
  let element = document.querySelector('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }
  element.setAttribute('href', url)
}

// --- Default Meta Values ---
const DEFAULT_TITLE = 'Levitra:Dosage, Side Effects-levitra online-Levitrask.com'
const DEFAULT_DESCRIPTION =
  'Levitra is an effective ED treatment. Find information on how to use Levitra, side effects, interactions, and comparisons with Viagra, Cialis, and Stendra.'
const DEFAULT_KEYWORDS =
  'Levitra online,Levitra dosage, Levitra side effects, Levitra vs Viagra, Levitra vs Cialis,Stendra'
const DEFAULT_OG_IMAGE = '/images/logo.png' // Default Open Graph image - PLEASE REPLACE

// --- Navigation Guard (Example - commented out, adjust if needed) ---
// const requireNavigationFromApp = (to, from, next) => {
//   // If from.name is undefined, it means direct access or refresh
//   if (from.name === undefined && to.name !== 'levitra') { // Allow direct access to home
//     // Redirect to home page
//     next({ name: 'levitra' }) // Or next('/')
//   } else {
//     // Otherwise, allow normal navigation
//     next()
//   }
// }

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'levitra',
      component: () => import('../views/IndexView.vue'), // Use lazy loading
      meta: {
        title: 'Levitra:Dosage, Side Effects-levitra online-Levitrask.com',
        description:
          'Levitra is an effective ED treatment. Find information on how to use Levitra, side effects, interactions, and comparisons with Viagra, Cialis, and Stendra.',
        keywords:
          'Levitra online,Levitra dosage, Levitra side effects, Levitra vs Viagra, Levitra vs Cialis,Stendra',
      },
    },
    {
      path: '/Levitra-vs-Cialis',
      name: 'compare-levitra-cialis',
      component: () => import('../views/Drug-Comparison-List/CialisComparison.vue'),
      meta: {
        title: 'Levitra vs Cialis Comparison | Levitrask.com',
        description:
          'Compare Levitra vs Cialis: Which ED Medication is Right for You? Dosing Flexibility, Side Effects , Food and Alcohol Interactions, duration, and more.',
        keywords:
          'Levitra vs Cialis,Levitra,Cialis,Side Effects,Onset Time and Duration,ED drug comparison',
      },
    },
    {
      path: '/Levitra-vs-Stendra',
      name: 'compare-levitra-stendra',
      component: () => import('../views/Drug-Comparison-List/StendraComparison.vue'),
      meta: {
        title: 'Levitra vs Stendra Comparison | Levitrask.com',
        description:
          'Compare Levitra vs Stendra: Which ED Medication is Right for You? Dosing Flexibility, Side Effects , Food and Alcohol Interactions, duration, and more.',
        keywords:
          'Levitra vs Stendra,Levitra,Stendra,Side Effects,Onset Time and Duration,ED drug comparison',
      },
    },
    {
      path: '/Levitra-vs-Viagra',
      name: 'compare-levitra-viagra',
      component: () => import('../views/Drug-Comparison-List/ViagraComparison.vue'),
      meta: {
        title: 'Levitra vs Viagra Comparison | Levitrask.com',
        description:
          'Compare Levitra vs Viagra: Which ED Medication is Right for You? Dosing Flexibility, Side Effects , Food and Alcohol Interactions, duration, and more.',
        keywords:
          'Levitra vs Viagra,Levitra,Viagra,Side Effects,Onset Time and Duration,ED drug comparison',
      },
    },
    {
      path: '/Cialis-vs-Stendra',
      name: 'compare-cialis-stendra',
      component: () => import('../views/Drug-Comparison-List/CialisStendraComparison.vue'),
      meta: {
        title: 'Cialis vs Stendra Comparison | Levitrask.com',
        description:
          'Compare Cialis vs Stendra: Which ED Medication is Right for You? Dosing Flexibility, Side Effects , Food and Alcohol Interactions, duration, and more.',
        keywords:
          'Cialis vs Stendra,Cialis,Stendra,Side Effects,Onset Time and Duration,ED drug comparison',
      },
    },
    {
      path: '/Cialis-vs-Viagra',
      name: 'compare-cialis-viagra',
      component: () => import('../views/Drug-Comparison-List/CialisViagraComparison.vue'),
      meta: {
        title: 'Cialis vs Viagra Comparison | Levitrask.com',
        description:
          'Compare Cialis vs Viagra: Which ED Medication is Right for You? Dosing Flexibility, Side Effects , Food and Alcohol Interactions, duration, and more.',
        keywords:
          'Cialis vs Viagra,Cialis,Viagra,Side Effects,Onset Time and Duration,ED drug comparison',
      },
    },
    {
      path: '/Stendra-vs-Viagra',
      name: 'compare-stendra-viagra',
      component: () => import('../views/Drug-Comparison-List/StendraViagraComparison.vue'),
      meta: {
        title: 'Stendra vs Viagra Comparison | Levitrask.com',
        description:
          'Compare Stendra vs Viagra: Which ED Medication is Right for You? Dosing Flexibility, Side Effects , Food and Alcohol Interactions, duration, and more.',
        keywords:
          'Stendra vs Viagra,Stendra,Viagra,Side Effects,Onset Time and Duration,ED drug comparison',
      },
    },
    {
      path: '/Cialis',
      name: 'cialis-blog',
      component: () => import('../views/Drugs-In-This-Class-List/CialisBlogPost.vue'),
      // beforeEnter: requireNavigationFromApp,
      meta: {
        title: 'Cialis Dosage, Side Effects-Cialis online-Levitrask.com',
        description:
          'Cialis,a long-lasting ED medication. Covers Cialis usage, Cialis dosage, Cialis side effects, What is Cialis, Cialis generic, Cialis vs Viagra and more.',
        keywords:
          'Cialis dosage, Cialis side effects,  Cialis vs Viagra, Cialis vs Lavitra,Stendra,Cialis online',
      },
    },
    {
      path: '/Stendra',
      name: 'stendra-blog',
      component: () => import('../views/Drugs-In-This-Class-List/StendraBlogPost.vue'),
      // beforeEnter: requireNavigationFromApp,
      meta: {
        title: 'Stendra Dosage, Side Effects-Stendra online-Levitrask.com',
        description:
          'Stendra,a long-lasting ED medication. Covers Stendra usage, Stendra dosage, Stendra side effects,  Stendr generic, Stendra vs Viagra and more.',
        keywords:
          'Stendra dosage, Stendra sidae effects, Stendra vs Viagra, Stendra vs Lavitra,Stendra,Stendra online',
      },
    },
    {
      path: '/Viagra',
      name: 'viagra-blog',
      component: () => import('../views/Drugs-In-This-Class-List/ViagraBlogPost.vue'),
      // beforeEnter: requireNavigationFromApp,
      meta: {
        title: 'Viagra pill​,generic,side effects​,online buy|Levitrask.com',
        description:
          'Viagra (sildenafil), is a well-known ED medication. Covers how it works, dosage, side effects, Viagra vs Levitra,Viagra vs Cialis,Viagra vs Stendra and more.',
        keywords:
          'Viagra dosage, Viagra side effects,  Viagra vs Levitra, Viagra vs Cialis,Stendra,Viagra online',
      },
    },
    {
      path: '/blog',
      name: 'blog',
      component: () => import('../views/BlogView.vue'),
      meta: {
        title: 'Blog | Levitrask Demo',
        description:
          'Read articles and posts about erectile dysfunction, treatments, and related health topics.',
        keywords: 'ED blog, erectile dysfunction articles, sexual health blog',
      },
    },
    {
      path: '/news',
      name: 'news',
      component: () => import('../views/NewsView.vue'),
      meta: {
        title: 'News | Levitrask Demo',
        description: 'Latest news related to ED treatments and sexual health.',
        keywords: 'ED news, sexual health news, medication news',
      },
    },
    {
      path: '/blog/:id',
      name: 'blog-details',
      component: () => import('../views/BlogDetails.vue'),
      props: true,
      meta: {
        // Default meta, component should update based on fetched data
        title: 'Blog Post | Levitrask Demo',
        description: 'Read this blog post about ED.',
        keywords: 'blog post, ED information',
      },
    },
    {
      path: '/questions/:id',
      name: 'question-details',
      component: () => import('../views/QuestionDetails.vue'),
      props: true,
      meta: {
        // Default meta, component should update based on fetched data
        title: 'Question Detail | Levitrask Demo',
        description: 'View details for a frequently asked question about ED.',
        keywords: 'FAQ, ED question, answer',
      },
    },
    {
      path: '/news/:id',
      name: 'news-details',
      component: () => import('../views/NewsDetails.vue'),
      props: true,
      meta: {
        // Default meta, component should update based on fetched data
        title: 'News Detail | Levitrask Demo',
        description: 'Read the full news article.',
        keywords: 'news article, health news',
      },
    },
    {
      path: '/Buy-Levitra-Online',
      name: 'buy-levitra-online',
      component: () => import('../views/Buy-Online-List/LevitraOnline.vue'),
      meta: {
        title: 'Buy Levitra Online | Levitrask.com',
        description:
          'buy Levitra online,Why Choose to Buy Levitra Online,Steps to Buy Levitra Online,Where to Buy Levitra Online,Is It Safe and Legal to Buy Levitra Online?',
        keywords:
          'buy levitra online,online,vardenafil,online pharmacy ED,Where to Buy Levitra Online',
      },
    },
    {
      path: '/Buy-Viagra-Online',
      name: 'buy-viagra-online',
      component: () => import('../views/Buy-Online-List/ViagraOnline.vue'),
      meta: {
        title: 'Buy Viagra Online | Levitrask.com',
        description:
          'buy Viagra online,Why Choose to Buy Viagra Online,Steps to Buy Viagra Online,Where to Buy Viagra Online,Is It Safe and Legal to Buy Viagra Online?',
        keywords:
          'buy Viagra online,online,vardenafil,online pharmacy ED,Where to Buy Viagra Online',
      },
    },
    {
      path: '/Buy-Cialis-Online',
      name: 'buy-cialis-online',
      component: () => import('../views/Buy-Online-List/CialisOnline.vue'),
      meta: {
        title: 'Buy Cialis Online | Levitrask.com',
        description:
          'buy Cialis online,Why Choose to Buy Cialis Online,Steps to Buy Cialis Online,Where to Buy Cialis Online,Is It Safe and Legal to Buy Cialis Online?',
        keywords:
          'buy Cialis online,online,vardenafil,online pharmacy ED,Where to Buy Cialis Online',
      },
    },
    {
      path: '/Buy-Stendra-Online',
      name: 'buy-stendra-online',
      component: () => import('../views/Buy-Online-List/StendraOnline.vue'),
      meta: {
        title: 'Buy Stendra Online | Levitrask.com',
        description:
          'buy Stendra online,Why Choose to Buy Stendra Online,Steps to Buy Stendra Online,Where to Buy Stendra Online,Is It Safe and Legal to Buy Stendra Online?',
        keywords:
          'buy Stendra online,online,vardenafil,online pharmacy ED,Where to Buy Stendra Online',
      },
    },
    // --- Terms of Service Route ---
    {
      path: '/terms',
      name: 'terms',
      component: () => import('../views/TermsView.vue'), // Lazy load TermsView
      meta: {
        title: '服务条款 | Levitrask Demo',
        description: '阅读 Levitrask Demo 的服务条款。',
        keywords: '条款, 条件, 服务协议, 法律',
      },
    },
    // --- Privacy Policy Route ---
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('../views/PrivacyView.vue'), // Lazy load PrivacyView
      meta: {
        title: '隐私政策 | Levitrask Demo',
        description: '了解 Levitrask Demo 如何处理您的隐私。',
        keywords: '隐私, 政策, 数据保护, 用户隐私, 法律',
      },
    },
    // Catch-all route: Display NotFoundView for unmatched paths (Keep this last)
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue'), // Lazy load NotFoundView
      meta: {
        title: 'Page Not Found | Levitrask Demo',
        description: 'The page you requested could not be found.',
      },
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      // Ensure return { top: 0 } only if not navigating with hash
      if (to.hash) {
        return { el: to.hash, behavior: 'smooth' } // Smooth scroll to hash
      } else {
        return { top: 0, behavior: 'smooth' } // Smooth scroll to top
      }
    }
  },
})

// --- Global Navigation Guard for Meta Tags, Canonical URL, and Open Graph ---
router.afterEach((to, from) => {
  nextTick(() => {
    const pageTitle = to.meta.title || DEFAULT_TITLE
    const pageDescription = to.meta.description || DEFAULT_DESCRIPTION
    const pageKeywords = to.meta.keywords || DEFAULT_KEYWORDS
    const canonicalUrl = window.location.origin + to.fullPath
    // Use specific og:image from meta if available, otherwise use default
    const ogImageUrl = window.location.origin + (to.meta.ogImage || DEFAULT_OG_IMAGE)

    // Set Title
    document.title = pageTitle

    // Set Meta Description
    setMetaTag('name', 'description', pageDescription)

    // Set Meta Keywords
    setMetaTag('name', 'keywords', pageKeywords)

    // Set Canonical URL
    setCanonicalUrl(canonicalUrl)

    // --- Set Open Graph Tags ---
    setMetaTag('property', 'og:title', pageTitle) // Use page title for og:title
    setMetaTag('property', 'og:description', pageDescription) // Use page description for og:description
    setMetaTag('property', 'og:url', canonicalUrl) // Use canonical URL for og:url
    setMetaTag('property', 'og:image', ogImageUrl) // Set og:image
    setMetaTag('property', 'og:type', 'website') // Default type, can be 'article' for blog posts
    // Optional: Add more tags like og:site_name
    // setMetaTag('property', 'og:site_name', 'Levitrask Demo');

    // --- Optional: Add Twitter Card Tags (Similar to Open Graph) ---
    // setMetaTag('name', 'twitter:card', 'summary_large_image'); // or 'summary'
    // setMetaTag('name', 'twitter:title', pageTitle);
    // setMetaTag('name', 'twitter:description', pageDescription);
    // setMetaTag('name', 'twitter:image', ogImageUrl);
    // setMetaTag('name', 'twitter:url', canonicalUrl);
  })
})

export default router
