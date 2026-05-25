// next-sitemap.config.js - Institutional SEO (Prioritized for Canons/Essays/Shorts)
/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: 'https://www.abrahamoflondon.org',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  sitemapSize: 5000,
  
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
          '/404',
          '/500',
          '/maintenance',
        ],
        crawlDelay: 2,
      },
    ],
    additionalSitemaps: [
      'https://www.abrahamoflondon.org/sitemap.xml',
      'https://www.abrahamoflondon.org/blog-sitemap.xml',
      'https://www.abrahamoflondon.org/canons-sitemap.xml',
      'https://www.abrahamoflondon.org/shorts-sitemap.xml',
      'https://www.abrahamoflondon.org/strategies-sitemap.xml',
      'https://www.abrahamoflondon.org/downloads-sitemap.xml',
      'https://www.abrahamoflondon.org/resources-sitemap.xml',
    ],
  },
  
  exclude: ['/api/*', '/inner-circle/*', '/admin/*', '/404', '/500', '/maintenance'],
  
  transform: async (config, path) => {
    return {
      loc: path,
      lastmod: new Date().toISOString(),
      changefreq: calculateChangeFrequency(path),
      priority: calculatePriority(path),
      alternateRefs: config.alternateRefs || [],
    };
  },
  
  autoLastmod: true,
  gzip: true,
  sourceDir: '.next',
  outDir: 'public',
};

function calculatePriority(path) {
  // Tier 1: Primary Nodes
  if (path === '/') return 1.0;
  
  // Tier 2: Institutional Hubs (Canons, Essays, Shorts)
  if (['/canons', '/blog', '/shorts'].some(p => path === p)) return 0.95;
  
  // Tier 3: Deep Intelligence Content
  if (path.includes('/canons/')) return 0.9;
  if (path.includes('/blog/')) return 0.9;
  if (path.includes('/shorts/')) return 0.85;
  
  // Tier 4: Functional Repositories
  if (path.includes('/downloads/')) return 0.75;
  if (path.includes('/strategies/')) return 0.75;
  if (path.includes('/resources/')) return 0.7;
  
  // Tier 5: Archive
  if (path.includes('/books/')) return 0.6;
  
  const depth = path.split('/').filter(Boolean).length;
  return Math.max(0.3, 1.0 - (depth * 0.1));
}

function calculateChangeFrequency(path) {
  // Real-time Intelligence
  if (path === '/' || path.includes('/shorts')) return 'daily';
  
  // Dynamic Content
  if (path.includes('/blog/')) return 'weekly';
  
  // Stable Institutional Content
  if (path.includes('/canons/') || path.includes('/strategies/')) return 'monthly';
  
  // Static Assets
  if (path.includes('/books/') || path.includes('/downloads/')) return 'yearly';
  
  return 'monthly';
}

export default config;