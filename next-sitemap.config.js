/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://nimble-naiad-725b08.netlify.app', // Replace with your actual domain when you have one
  generateRobotsTxt: true, // (optional)
  // ... other options
  // sitemapSize: 7000,
};
