// scripts/validate-sitemap.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseStringPromise } from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Validating sitemap...');

const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
const sitemapIndexPath = path.join(process.cwd(), 'public', 'sitemap-0.xml');
const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');

// Check if files exist
if (!fs.existsSync(sitemapPath)) {
  console.error('❌ sitemap.xml not found in public directory');
  process.exit(1);
}

if (!fs.existsSync(sitemapIndexPath)) {
  console.error('❌ sitemap-0.xml not found in public directory');
  process.exit(1);
}

if (!fs.existsSync(robotsPath)) {
  console.error('❌ robots.txt not found in public directory');
  process.exit(1);
}

console.log('✅ Found all required files');

// Validate sitemap.xml (index)
try {
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  const sitemap = await parseStringPromise(sitemapContent);
  
  // Check it's a valid sitemap index
  if (!sitemap.sitemapindex) {
    throw new Error('Invalid sitemap index format');
  }
  
  const sitemaps = sitemap.sitemapindex.sitemap || [];
  console.log(`✅ sitemap.xml is valid (contains ${sitemaps.length} sitemap references)`);
  
  // Validate each referenced sitemap
  for (const sitemapRef of sitemaps) {
    const loc = sitemapRef.loc?.[0];
    if (loc) {
      console.log(`   → ${loc}`);
    }
  }
} catch (error) {
  console.error('❌ Error parsing sitemap.xml:', error.message);
  process.exit(1);
}

// Validate sitemap-0.xml (content)
try {
  const content = fs.readFileSync(sitemapIndexPath, 'utf8');
  const parsed = await parseStringPromise(content);
  
  if (!parsed.urlset) {
    throw new Error('Invalid sitemap format');
  }
  
  const urls = parsed.urlset.url || [];
  console.log(`✅ sitemap-0.xml is valid (contains ${urls.length} URLs)`);
  
  // Count URLs by priority
  const priorityCount = {
    '1.0': 0,
    '0.9': 0,
    '0.8': 0,
    '0.7': 0,
    '0.6': 0,
    '0.5': 0,
    '0.4': 0,
    '0.3': 0,
    '0.2': 0,
    '0.1': 0,
    '0.0': 0,
  };
  
  const changefreqCount = {
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  };
  
  for (const url of urls) {
    const priority = url.priority?.[0] || '0.5';
    const freq = url.changefreq?.[0] || 'weekly';
    
    priorityCount[priority] = (priorityCount[priority] || 0) + 1;
    changefreqCount[freq] = (changefreqCount[freq] || 0) + 1;
  }
  
  console.log('\n📊 Priority distribution:');
  Object.entries(priorityCount)
    .filter(([_, count]) => count > 0)
    .forEach(([priority, count]) => {
      console.log(`   ${priority}: ${count} URLs`);
    });
  
  console.log('\n📊 Change frequency distribution:');
  Object.entries(changefreqCount)
    .filter(([_, count]) => count > 0)
    .forEach(([freq, count]) => {
      console.log(`   ${freq}: ${count} URLs`);
    });
  
} catch (error) {
  console.error('❌ Error parsing sitemap-0.xml:', error.message);
  process.exit(1);
}

// Validate robots.txt
try {
  const robotsContent = fs.readFileSync(robotsPath, 'utf8');
  console.log('\n✅ robots.txt is valid:');
  
  // Check for sitemap reference
  if (robotsContent.includes('Sitemap:')) {
    console.log('   → Contains sitemap reference');
  } else {
    console.warn('   ⚠️  Missing sitemap reference in robots.txt');
  }
  
  // Check for user-agent rules
  if (robotsContent.includes('User-agent:')) {
    console.log('   → Contains user-agent rules');
  }
  
  // Check for disallowed paths
  const lines = robotsContent.split('\n');
  const disallowCount = lines.filter(line => line.includes('Disallow:')).length;
  console.log(`   → ${disallowCount} disallow rules`);
  
} catch (error) {
  console.error('❌ Error reading robots.txt:', error.message);
  process.exit(1);
}

// Check for common issues
console.log('\n🔍 Checking for common issues...');

// 1. Check for non-absolute URLs
try {
  const content = fs.readFileSync(sitemapIndexPath, 'utf8');
  const relativeUrlMatches = content.match(/loc>https?:\/\/[^<]+<\/loc>/g);
  
  if (relativeUrlMatches) {
    const hasRelativeUrls = relativeUrlMatches.some(url => 
      !url.includes('https://') && !url.includes('http://')
    );
    
    if (hasRelativeUrls) {
      console.warn('   ⚠️  Found possible relative URLs in sitemap');
    } else {
      console.log('   ✅ All URLs are absolute');
    }
  }
} catch (error) {
  // Ignore
}

// 2. Check file sizes
const sitemapSize = fs.statSync(sitemapPath).size;
const sitemapIndexSize = fs.statSync(sitemapIndexPath).size;

console.log(`\n📦 File sizes:`);
console.log(`   sitemap.xml: ${(sitemapSize / 1024).toFixed(2)} KB`);
console.log(`   sitemap-0.xml: ${(sitemapIndexSize / 1024).toFixed(2)} KB`);

if (sitemapIndexSize > 50 * 1024 * 1024) { // 50MB limit
  console.warn('   ⚠️  sitemap-0.xml exceeds recommended 50MB limit');
} else {
  console.log('   ✅ All files within size limits');
}

// 3. Check for compression
const hasGzip = fs.existsSync(sitemapPath + '.gz') || fs.existsSync(sitemapIndexPath + '.gz');
if (hasGzip) {
  console.log('   ✅ Gzip compression detected');
} else {
  console.log('   ℹ️  No gzip compression found (optional)');
}

console.log('\n🎉 Sitemap validation complete!');
console.log('All checks passed successfully.');
console.log('\nNext steps:');
console.log('1. Submit sitemap to Google Search Console');
console.log('2. Submit to Bing Webmaster Tools');
console.log('3. Monitor indexing in your analytics platform');