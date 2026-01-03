/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://yourapp.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/private/',
          '/_next/',
          '/404',
          '/500'
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 1,
      },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap-0.xml`,
      `${process.env.NEXT_PUBLIC_SITE_URL}/posts-sitemap.xml`,
    ],
  },
  exclude: [
    '/server-sitemap.xml',
    '/admin/**',
    '/api/**',
    '/private/**',
    '/404',
    '/500',
  ],
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  generateIndexSitemap: true,
  transform: async (config, path) => {
    // Custom transformations
    const priority = getPriority(path);
    const changefreq = getChangeFreq(path);
    
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
      alternateRefs: config.alternateRefs ?? [],
    };
  },
};