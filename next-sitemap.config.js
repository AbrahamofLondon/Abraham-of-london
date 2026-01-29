// next-sitemap.config.js - Advanced SEO Configuration (Institutional Hardened)
/** @type {import('next-sitemap').IConfig} */
const config = {
  // ✅ FIXED: Hardcoded to the correct institutional domain
  siteUrl: 'https://www.abrahamoflondon.org',
  
  // ==================== GENERATION SETTINGS ====================
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  sitemapSize: 5000,
  
  // ==================== ROBOTS.TXT CONFIGURATION ====================
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/*',
          '/inner-circle/*',
          '/admin/*',
          '/_next/*',
          '/assets/private/*',
          '/404',
          '/500',
          '/maintenance',
          '/test/*',
          '/debug/*',
          '/server-sitemap.xml',
        ],
        crawlDelay: 2,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/*',
          '/inner-circle/*',
          '/admin/*',
          '/assets/private/*',
        ],
        crawlDelay: 1,
      },
    ],
    // ✅ FIXED: Hardcoded correct domain for sitemap indices
    additionalSitemaps: [
      'https://www.abrahamoflondon.org/sitemap.xml',
      'https://www.abrahamoflondon.org/blog-sitemap.xml',
      'https://www.abrahamoflondon.org/canons-sitemap.xml',
      'https://www.abrahamoflondon.org/strategies-sitemap.xml',
      'https://www.abrahamoflondon.org/resources-sitemap.xml',
      'https://www.abrahamoflondon.org/books-sitemap.xml',
    ],
  },
  
  // ==================== EXCLUDED PATHS ====================
  exclude: [
    '/api/*',
    '/inner-circle/*',
    '/admin/*',
    '/auth/*',
    '/login',
    '/register',
    '/logout',
    '/404',
    '/500',
    '/_error',
    '/_offline',
    '/maintenance',
    '/health',
    '/ping',
    '/robots.txt',
    '/sitemap.xml',
    '/favicon.ico',
    '/manifest.json',
    '/test/*',
    '/debug/*',
    '/__tests__/*',
    '/cypress/*',
    '/assets/private/*',
    '/_next/*',
    '/server-sitemap.xml',
  ],
  
  // ==================== SITEMAP TRANSFORMATIONS ====================
  transform: async (config, path) => {
    const priority = calculatePriority(path);
    const changefreq = calculateChangeFrequency(path);
    const lastmod = new Date().toISOString();
    
    return {
      loc: path,
      lastmod: lastmod,
      changefreq: changefreq,
      priority: priority,
      alternateRefs: config.alternateRefs || [],
    };
  },
  
  // ==================== XML OPTIONS ====================
  autoLastmod: true,
  trailingSlash: false,
  sourceDir: '.next',
  outDir: 'public',
  
  // ==================== GZIP COMPRESSION ====================
  // ✅ FIXED: Enable gzip compression
  gzip: true,
  
  // ==================== ADDITIONAL OPTIONS ====================
  // These help with Next.js specific optimizations
  excludeExtensions: [
    'js',
    'css',
    'map',
    'json',
  ],
  
  // Custom transform for better performance
  async additionalPaths(config) {
    return [];
  },
};

function calculatePriority(path) {
  if (path === '/') return 1.0;
  if (path === '/blog') return 0.9;
  if (path === '/canons') return 0.9;
  if (path === '/strategies') return 0.9;
  if (path.includes('/blog/')) return 0.8;
  if (path.includes('/canons/')) return 0.8;
  if (path.includes('/strategies/')) return 0.8;
  if (path.includes('/resources/')) return 0.7;
  if (path.includes('/books/')) return 0.6;
  
  // Calculate based on depth
  const depth = path.split('/').filter(Boolean).length;
  return Math.max(0.3, 1.0 - (depth * 0.1));
}

function calculateChangeFrequency(path) {
  if (path === '/') return 'daily';
  if (path.includes('/blog/')) return 'weekly';
  if (path.includes('/canons/')) return 'monthly';
  if (path.includes('/strategies/')) return 'monthly';
  if (path.includes('/resources/')) return 'monthly';
  if (path.includes('/books/')) return 'yearly';
  return 'monthly';
}

export default config;