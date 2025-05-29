import { createRouter, createWebHistory, RouterView } from 'vue-router'
import { nextTick } from 'vue'
import i18n, { supportedLocales } from '../i18n' // 导入 i18n 实例和支持的语言列表

// Removed direct imports, using lazy loading below

// --- Import Admin Components (Lazy Loading) ---
const AdminLogin = () => import('../views/admin/AdminLogin.vue');
const AdminDashboard = () => import('../views/admin/AdminDashboard.vue');
const NewsManagement = () => import('../views/admin/NewsManagement.vue');
const BlogManagement = () => import('../views/admin/BlogManagement.vue'); // Assuming this component exists
const QuestionManagement = () => import('../views/admin/QuestionManagement.vue'); // Assuming
const HomeManagement = () => import('../views/admin/HomeManagement.vue');
const SidebarManagement = () => import('../views/admin/SidebarManagement.vue'); // <--- 添加组件导入
const ManagedPageManagement = () => import('../views/admin/ManagedPageManagement.vue'); // <-- 新导入
// Add imports for other admin components if needed

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

// --- Admin Route Guard ---
const requireAdminAuth = (to, from, next) => {
  const token = localStorage.getItem('admin-auth-token');
  if (token) {
    // Basic check: token exists. Add more robust validation if needed (e.g., check expiration).
    next(); // Logged in, proceed to route
  } else {
    // Not logged in, redirect to login page
    next({ name: 'admin-login' });
  }
};

// --- Define public routes ---
const publicRoutes = [
  {
    path: '', // 对应 /en 或 /zh (改回空字符串)
    name: 'home', // 路由名称保持唯一，但现在会带 lang 参数
    component: () => import('../views/IndexView.vue'),
    meta: {
      title: 'Levitra:Dosage, Side Effects-levitra online-Levitrask.com',
      description:
        'Levitra is an effective ED treatment. Find information on how to use Levitra, side effects, interactions, and comparisons with Viagra, Cialis, and Stendra.',
      keywords:
        'Levitra online,Levitra dosage, Levitra side effects, Levitra vs Viagra, Levitra vs Cialis,Stendra',
    },
  },
  /* ROUTE REMOVED: Comparison Pages Start */
  /*
  {
    path: 'Levitra-vs-Cialis', // 路径不再以 / 开头
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
    path: 'Levitra-vs-Stendra',
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
    path: 'Levitra-vs-Viagra',
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
    path: 'Cialis-vs-Stendra',
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
    path: 'Cialis-vs-Viagra',
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
    path: 'Stendra-vs-Viagra',
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
  */
  /* ROUTE REMOVED: Comparison Pages End */
  {
    path: 'blog',
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
    path: 'news',
    name: 'news',
    component: () => import('../views/NewsView.vue'),
    meta: {
      title: 'News | Levitrask Demo',
      description: 'Latest news related to ED treatments and sexual health.',
      keywords: 'ED news, sexual health news, medication news',
    },
  },
  {
    path: 'blog/:slug',
    name: 'blog-details',
    component: () => import('../views/BlogDetails.vue'),
    props: true,
    meta: {
      title: 'Blog Post | Levitrask Demo',
      description: 'Read this blog post about ED.',
      keywords: 'blog post, ED information',
    },
  },
  {
    path: 'questions/:id',
    name: 'question-details',
    component: () => import('../views/QuestionDetails.vue'),
    props: true,
    meta: {
      title: 'Question Detail | Levitrask Demo',
      description: 'View details for a frequently asked question about ED.',
      keywords: 'FAQ, ED question, answer',
    },
  },
  {
    path: 'news/:id',
    name: 'news-details',
    component: () => import('../views/NewsDetails.vue'),
    props: true,
    meta: {
      title: 'News Detail | Levitrask Demo',
      description: 'Read the full news article.',
      keywords: 'news article, health news',
    },
  },
  /* ROUTE REMOVED: Buy Online Pages Start */
  /*
  {
    path: 'Buy-Levitra-Online',
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
    path: 'Buy-Viagra-Online',
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
    path: 'Buy-Cialis-Online',
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
    path: 'Buy-Stendra-Online',
    name: 'buy-stendra-online',
    component: () => import('../views/Buy-Online-List/StendraOnline.vue'),
    meta: {
      title: 'Buy Stendra Online | Levitrask.com',
      description:
        'buy Stendra online,Why Choose to Buy Stendra Online,Steps to Buy Stendra Online,Where to Buy Stendra Online,Is It Safe and Legal to Buy Stendra Online?',
      keywords:
        'buy Stendra online,online,avanafil,online pharmacy ED,Where to Buy Stendra Online',
    },
  },
  */
  /* ROUTE REMOVED: Buy Online Pages End */
  {
    path: 'terms',
    name: 'terms',
    component: () => import('../views/TermsView.vue'),
    meta: {
      title: '服务条款 | Levitrask Demo',
      description: '阅读 Levitrask Demo 的服务条款。',
      keywords: '条款, 条件, 服务协议, 法律',
    },
  },
  {
    path: 'privacy',
    name: 'privacy',
    component: () => import('../views/PrivacyView.vue'),
    meta: {
      title: '隐私政策 | Levitrask Demo',
      description: '了解 Levitrask Demo 如何处理您的隐私。',
      keywords: '隐私, 政策, 数据保护, 用户隐私, 法律',
    },
  },
  // 明确的404路由，用于重定向
  {
    path: '404',
    name: 'NotFoundPage',
    component: () => import('../views/NotFound.vue'),
    meta: {
      title: '404 - Page Not Found | Levitrask',
      description: 'The page you are looking for does not exist.',
      keywords: '404, not found, error'
    }
  },
  {
    path: ':identifier',
    name: 'managed-page-detail',
    component: () => import('../views/ManagedPageDetail.vue'),
    props: false,
    meta: {
      // Default meta tags (组件会覆盖)
      title: 'Page Detail | Levitrask.com',
      description: 'Detailed information.',
      keywords: 'page, information',
    },
  },
  // 404 route for language-prefixed paths - must be last in publicRoutes
  {
    path: ':pathMatch(.*)*',
    name: 'NotFoundWithLang',
    component: () => import('../views/NotFound.vue'),
    meta: {
      title: '404 - Page Not Found | Levitrask',
      description: 'The page you are looking for does not exist.',
      keywords: '404, not found, error'
    }
  }
];

// --- Define Admin routes (Restore Nested Structure) ---
const adminRoutes = [
  {
    path: 'login',
    name: 'admin-login',
    component: AdminLogin,
    meta: { title: 'Admin Login' }
  },
  {
    // Path is now just 'dashboard' relative to '/admin'
    path: 'dashboard',
    name: 'admin-dashboard', // Optional name for the layout route itself
    component: AdminDashboard, // This component should have a <router-view>
    beforeEnter: requireAdminAuth, // Apply guard to dashboard and all children
    redirect: { name: 'admin-homepage' }, // Redirect /admin/dashboard to /admin/dashboard/homepage by default
    meta: { title: 'Admin Dashboard', requiresAuth: true },
    children: [
      {
        path: 'homepage', // Full path: /admin/dashboard/homepage
        name: 'admin-homepage',
        component: HomeManagement,
        // beforeEnter is inherited unless overridden
        meta: { title: 'Homepage Management', requiresAuth: true } // Ensure meta here too
      },
      {
        path: 'news',
        name: 'admin-news',
        component: NewsManagement,
        meta: { title: 'News Management', requiresAuth: true }
      },
      {
        path: 'blogs',
        name: 'admin-blogs',
        component: BlogManagement,
        meta: { title: 'Blog Management', requiresAuth: true }
      },
      {
        path: 'questions',
        name: 'admin-questions',
        component: QuestionManagement,
        meta: { title: 'Question Management', requiresAuth: true }
      },
      {
        // Add the new sidebars route as a child of dashboard
        path: 'sidebars',
        name: 'admin-sidebars',
        component: SidebarManagement,
        meta: {
          title: 'Sidebar Management | Admin Panel',
          requiresAuth: true
        }
      },
      {
        path: 'drug-page-management',
        name: 'admin-manage-drugs',
        component: ManagedPageManagement,
        props: { pageType: 'drug' },
        meta: {
          title: 'Drug Page Management',
          requiresAuth: true
        }
      },
      {
        path: 'manage-comparisons',
        name: 'admin-manage-comparisons',
        component: ManagedPageManagement,
        props: { pageType: 'comparison' },
        meta: {
          title: 'Comparison Page Management',
          requiresAuth: true
        },
        beforeEnter: requireAdminAuth
      },
      {
        path: 'buy-online-management',
        name: 'admin-buy-online-management',
        component: ManagedPageManagement,
        props: { pageType: 'buy-online' },
        meta: {
          title: 'Buy Online Page Management',
          requiresAuth: true
        },
        beforeEnter: requireAdminAuth
      }
      // Add other nested admin routes here...
    ]
  }
];

// 支持的语言列表已从 i18n.js 导入

// --- Combine routes and language prefix ---
const langPrefixedRoutes = [
  {
    // <--- 1. 更新语言代码的正则表达式
    path: `/:lang(${supportedLocales.join('|')})`,
    component: RouterView, // Use imported RouterView directly
    children: publicRoutes,
  },
];

// --- All Routes ---
const routes = [
  ...langPrefixedRoutes,
  // Root path redirect - Default to English unless valid locale is saved
  {
    path: '/',
    redirect: () => {
        const savedLocale = localStorage.getItem('user-locale');
        // <--- 3. 更新根路径重定向逻辑
        if (savedLocale && supportedLocales.includes(savedLocale)) {
            return `/${savedLocale}`;
        }
        // Otherwise, always default to English
        return '/en';
    }
  },
  {
    // Mount admin routes under /admin
    path: '/admin',
    component: RouterView, // Top-level wrapper for /admin routes
    children: adminRoutes // Use the nested adminRoutes definition
  },
  // Global catch-all 404 route for paths that don't match any pattern
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: {
      title: '404 - Page Not Found | Levitrask',
      description: 'The page you are looking for does not exist.',
      keywords: '404, not found, error'
    }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
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

// Navigation Guard for Language Handling and Meta Tags
router.beforeEach((to, from, next) => {
  // console.log('[Router] Guard entered. Path:', to.path, 'Params:', to.params);

  // Skip ALL processing for admin routes
  if (to.path.startsWith('/admin')) {
    // console.log('[Router] Skipping admin route:', to.path);
    document.title = to.meta.title || 'Admin Panel';
    next();
    return;
  }

  // --- Frontend Locale Logic ---
  const lang = to.params.lang;
  // console.log('[Router] Extracted lang from params:', lang);

  // 检查语言参数是否有效
  if (!lang || !supportedLocales.includes(lang)) {
     // console.log('[Router] Invalid or missing lang in params. Checking localStorage...');

     let userLocale = null;
     try {
       userLocale = localStorage.getItem('user-locale');
     } catch (e) {
       console.warn('[Router] localStorage not available:', e);
     }

     // console.log('[Router] localStorage locale:', userLocale);
     const targetLocale = (userLocale && supportedLocales.includes(userLocale)) ? userLocale : 'en';
     // console.log('[Router] Determined target locale for redirect:', targetLocale);

     // 构建重定向路径
     const intendedPath = to.fullPath === '/' ? '' : to.fullPath;
     // console.log('[Router] Intended path:', intendedPath);

     if (!intendedPath.startsWith(`/${targetLocale}`)) {
       const redirectPath = `/${targetLocale}${intendedPath}`;
       // console.log('[Router] Redirecting to:', redirectPath);
       next(redirectPath);
       return;
     } else {
        // console.log('[Router] Already has correct locale, proceeding...');
        next();
        return;
     }
  }

  // console.log('[Router] Valid lang found:', lang);

  // --- 简化的语言设置逻辑 ---
  if (i18n && i18n.global) {
    const currentLocale = i18n.global.locale.value;
    // console.log('[Router] Current i18n locale:', currentLocale, 'Target lang:', lang);

    // 只在语言真正不同时才更新
    if (currentLocale !== lang) {
      // console.log('[Router] Updating i18n locale from', currentLocale, 'to', lang);
      i18n.global.locale.value = lang;

      try {
        localStorage.setItem('user-locale', lang);
      } catch (e) {
        console.warn('[Router] Failed to save locale to localStorage:', e);
      }

      // console.log('[Router] i18n locale updated successfully');
    }
  } else {
    console.error('[Router] i18n instance is not available!');
  }

  next();
});

// --- Meta Tag Update Guard (MODIFIED) ---
router.afterEach((to) => {
  // Skip meta tag updates for admin routes (handled in beforeEach or manually)
  if (to.path.startsWith('/admin')) {
    return;
  }

  // --- Frontend Meta Tag Logic ---
  nextTick(() => {
    const nearestWithTitle = to.matched.slice().reverse().find(r => r.meta && r.meta.title);
    const nearestWithMeta = to.matched.slice().reverse().find(r => r.meta && (r.meta.description || r.meta.keywords));

    document.title = nearestWithTitle ? nearestWithTitle.meta.title : DEFAULT_TITLE;

    const description = nearestWithMeta?.meta?.description || DEFAULT_DESCRIPTION;
    const keywords = nearestWithMeta?.meta?.keywords || DEFAULT_KEYWORDS;
    const ogImage = nearestWithMeta?.meta?.ogImage || DEFAULT_OG_IMAGE;
    const canonicalUrl = window.location.origin + to.fullPath;

    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    // Open Graph Tags
    setMetaTag('property', 'og:title', document.title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', window.location.origin + ogImage);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', 'website');
    // Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', document.title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', window.location.origin + ogImage);

    // Set Canonical URL
    setCanonicalUrl(canonicalUrl);
  });
});

export default router
