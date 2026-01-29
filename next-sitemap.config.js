// next-sitemap.config.js - Advanced SEO Configuration
/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abrahamoflondon.org',
  
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
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
        disallow: [
          '/api/*',
          '/inner-circle/*',
          '/admin/*',
          '/assets/private/*',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/*',
          '/inner-circle/*',
          '/admin/*',
          '/assets/private/*',
        ],
        crawlDelay: 2,
      },
      {
        userAgent: 'Slurp',
        allow: '/',
        disallow: [
          '/api/*',
          '/inner-circle/*',
          '/admin/*',
          '/assets/private/*',
        ],
        crawlDelay: 3,
      },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abrahamoflondon.org'}/sitemap.xml`,
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abrahamoflondon.org'}/blog-sitemap.xml`,
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abrahamoflondon.org'}/canons-sitemap.xml`,
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abrahamoflondon.org'}/strategies-sitemap.xml`,
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abrahamoflondon.org'}/resources-sitemap.xml`,
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abrahamoflondon.org'}/books-sitemap.xml`,
    ],
  },
  
  // ==================== EXCLUDED PATHS ====================
  exclude: [
    // API routes
    '/api/*',
    
    // Authentication & private areas
    '/inner-circle/*',
    '/admin/*',
    '/auth/*',
    '/login',
    '/register',
    '/logout',
    
    // Error pages
    '/404',
    '/500',
    '/_error',
    '/_offline',
    
    // System pages
    '/maintenance',
    '/health',
    '/ping',
    '/robots.txt',
    '/sitemap.xml',
    '/favicon.ico',
    '/manifest.json',
    
    // Development & testing
    '/test/*',
    '/debug/*',
    '/__tests__/*',
    '/cypress/*',
    
    // Assets (handled separately if needed)
    '/assets/private/*',
    
    // Next.js internals
    '/_next/*',
    '/server-sitemap.xml',
  ],
  
  // ==================== SITEMAP TRANSFORMATIONS ====================
  transform: async (config, path) => {
    // Calculate priority based on path depth and type
    const priority = calculatePriority(path);
    
    // Determine change frequency
    const changefreq = calculateChangeFrequency(path);
    
    // Get last modified date (in production, this would come from your CMS/database)
    const lastmod = await getLastModifiedDate(path);
    
    // Get image data for image sitemap
    const images = await getImagesForPath(path);
    
    // Get video data if applicable
    const videos = await getVideosForPath(path);
    
    return {
      loc: path,
      lastmod: lastmod,
      changefreq: changefreq,
      priority: priority,
      alternateRefs: config.alternateRefs || [],
      images: images.length > 0 ? images : undefined,
      videos: videos.length > 0 ? videos : undefined,
      news: path.includes('/blog/') ? getNewsData(path) : undefined,
    };
  },
  
  // ==================== ADDITIONAL SITEMAPS ====================
  additionalPaths: async (config) => {
    const result = [];
    
    // Add blog post sitemaps
    const blogPosts = await getBlogPosts();
    for (const post of blogPosts) {
      result.push({
        loc: `/blog/${post.slug}`,
        lastmod: post.updatedAt,
        changefreq: 'weekly',
        priority: 0.8,
      });
    }
    
    // Add canon sitemaps
    const canons = await getCanons();
    for (const canon of canons) {
      result.push({
        loc: `/canons/${canon.slug}`,
        lastmod: canon.updatedAt,
        changefreq: 'monthly',
        priority: 0.9,
      });
    }
    
    // Add strategy sitemaps
    const strategies = await getStrategies();
    for (const strategy of strategies) {
      result.push({
        loc: `/strategies/${strategy.slug}`,
        lastmod: strategy.updatedAt,
        changefreq: 'monthly',
        priority: 0.85,
      });
    }
    
    return result;
  },
  
  // ==================== I18N SUPPORT ====================
  i18n: {
    locales: ['en-US', 'en-GB'], // Add more locales as needed
    defaultLocale: 'en-US',
    domains: [
      {
        domain: 'www.abrahamoflondon.org',
        defaultLocale: 'en-US',
      },
    ],
  },
  
  // ==================== XML OPTIONS ====================
  autoLastmod: true,
  trailingSlash: false,
  sourceDir: '.next',
  outDir: 'public',
  
  // ==================== GZIP COMPRESSION ====================
  gzip: true,
};

// Helper functions for sitemap generation
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

async function getLastModifiedDate(path) {
  // In production, implement logic to get actual last modified date
  // from your database or filesystem
  
  // For static sites, you could check file modification times
  // For dynamic sites, query your database
  
  // Default to current date
  return new Date().toISOString();
}

async function getImagesForPath(path) {
  // Implement logic to get images for a specific path
  // This would typically come from your CMS or database
  
  // Example: return featured image for blog posts
  if (path.includes('/blog/')) {
    return [
      {
        loc: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abrahamoflondon.org'}/images/blog/featured/${path.split('/').pop()}.jpg`,
        title: 'Featured Image',
        caption: 'Featured image for blog post',
        geoLocation: 'London, UK',
        license: 'https://creativecommons.org/licenses/by/4.0/',
      },
    ];
  }
  
  return [];
}

async function getVideosForPath(path) {
  // Implement logic to get videos for a specific path
  // This would typically come from your CMS or database
  
  // Example: return embedded videos for tutorial pages
  if (path.includes('/tutorials/')) {
    return [
      {
        thumbnailLoc: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abrahamoflondon.org'}/images/video-thumbnails/${path.split('/').pop()}.jpg`,
        title: 'Tutorial Video',
        description: 'Video tutorial for this content',
        contentLoc: `https://youtube.com/watch?v=example123`,
        playerLoc: `https://www.youtube.com/embed/example123`,
        duration: 300, // seconds
        publicationDate: new Date().toISOString(),
        tags: ['tutorial', 'video', 'learning'],
        category: 'Education',
      },
    ];
  }
  
  return [];
}

function getNewsData(path) {
  // Implement logic for Google News sitemap
  if (path.includes('/blog/') && isRecentPost(path)) {
    return {
      publication: {
        name: 'Abraham of London',
        language: 'en',
      },
      genres: 'Blog',
      publicationDate: new Date().toISOString(),
      title: getPostTitle(path),
      keywords: ['strategy', 'business', 'leadership', 'canon'],
    };
  }
  
  return undefined;
}

// Data fetching functions (implement based on your data source)
async function getBlogPosts() {
  // Implement based on your CMS/database
  return [];
}

async function getCanons() {
  // Implement based on your CMS/database
  return [];
}

async function getStrategies() {
  // Implement based on your CMS/database
  return [];
}

function isRecentPost(path) {
  // Implement logic to check if post is recent (e.g., within last 2 days)
  return false;
}

function getPostTitle(path) {
  // Implement logic to get post title from path
  return 'Blog Post Title';
}

// Export as ES module
export default config;