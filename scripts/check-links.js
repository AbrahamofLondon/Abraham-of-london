#!/usr/bin/env node
/**
 * COMPREHENSIVE LINK CHECKER FOR ABRAHAM OF LONDON
 * Based on ACTUAL page structure from your codebase
 */

const https = require('https');
const http = require('http');

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const TIMEOUT = 8000;
const CONCURRENT_CHECKS = 3;

// ACTUAL PATHS FROM YOUR CODEBASE
const ACTUAL_PATHS = {
  corePages: [
    '/',
    '/consulting',
    '/canon',
    '/shorts',
    '/books',
    '/ventures',
    '/strategy',
    '/resources',
    '/downloads',
    '/contact',
    '/about',
    '/services',
    '/services/executive-coaching',
    '/services/leadership-development',
    '/insights',
    '/inner-circle',
  ],

  workshops: [
    '/workshops/purpose-pyramid',
    '/workshops/decision-matrix',
    '/workshops/legacy-canvas',
  ],

  canonPages: [
    '/canon',
    '/canon/volume-i-foundations-of-purpose',
  ],

  resourceCategories: [
    '/resources/leadership-standards-blueprint',
    '/resources/purpose-pyramid',
    '/resources/legacy-canvas',
    '/resources/strategic-frameworks',
  ],

  pdfDownloads: [
    '/downloads/purpose-pyramid.pdf',
    '/downloads/decision-matrix.pdf',
    '/downloads/legacy-canvas.pdf',
    '/downloads/leadership-standards-blueprint.pdf',
  ],

  criticalAssets: [
    '/assets/images/abraham-of-london-banner.webp',
    '/assets/images/canon/architecture-of-human-purpose-cover.jpg',
    '/assets/downloads/public-assets/resources/pdfs/leadership-standards-blueprint.pdf',
    '/fonts/inter-var-latin.woff2',
  ],

  apiRoutes: [
    '/api/downloads/register',
  ],

  dynamicTestPages: [
    '/downloads/sample-download',
    '/resources/sample-resource',
    '/insights/sample-article',
  ],

  criticalRedirects: [
    '/workshop/purpose-pyramid',
    '/workshop/decision-matrix',
    '/workshop/legacy-canvas',
    '/workshops/purpose-pyramid-workshop',
    '/workshops/decision-matrix-workshop',
    '/workshops/legacy-canvas-workshop',
    '/downloads/purpose-pyramid-worksheet-fillable.pdf',
    '/downloads/decision-matrix-worksheet-fillable.pdf',
    '/downloads/legacy-canvas-worksheet-fillable.pdf',
    '/resources/leadership-standards',
    '/resources/purpose-pyramid-guide',
    '/resources/legacy-framework',
    '/about-us',
    '/contact-us',
    '/get-in-touch',
    '/services/coaching',
    '/services/consulting',
    '/index.html',
    '/blog/strategic-thinking',
    '/articles/leadership-framework',
    '/news/latest-update',
  ],
};

async function checkUrl(url, expectedStatus = 200, isRedirect = false) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https://');
    const requester = isHttps ? https : http;
    
    const options = {
      method: 'HEAD',
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Abraham-of-London-Audit/1.0',
        'Accept': '*/*',
      },
      followRedirect: false,
    };

    const startTime = Date.now();
    const req = requester.request(url, options, (res) => {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      const location = res.headers.location || '';
      
      let success = false;
      if (isRedirect) {
        success = [301, 302, 307, 308].includes(statusCode);
      } else {
        success = statusCode === expectedStatus;
      }

      const diagnostics = {
        responseTime: `${responseTime}ms`,
        contentLength: res.headers['content-length'] || 'unknown',
        contentType: (res.headers['content-type'] || '').split(';')[0],
      };

      resolve({
        url,
        status: statusCode,
        expected: expectedStatus,
        isRedirect,
        location,
        success,
        error: null,
        diagnostics,
      });
      
      res.destroy();
    });

    req.on('error', (error) => {
      resolve({
        url,
        status: 0,
        expected: expectedStatus,
        isRedirect,
        location: '',
        success: false,
        error: error.message || 'Connection failed',
        diagnostics: null,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 0,
        expected: expectedStatus,
        isRedirect,
        location: '',
        success: false,
        error: `Timeout after ${TIMEOUT}ms`,
        diagnostics: null,
      });
    });

    req.end();
  });
}

async function checkUrls(urls, expectedStatus = 200, isRedirect = false) {
  const results = [];
  
  for (let i = 0; i < urls.length; i += CONCURRENT_CHECKS) {
    const batch = urls.slice(i, i + CONCURRENT_CHECKS);
    const promises = batch.map(url => 
      checkUrl(`${SITE_URL}${url}`, expectedStatus, isRedirect)
    );
    
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return results;
}

function printResults(category, results, showDiagnostics = false) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${category.toUpperCase()}`);
  console.log(`${'='.repeat(80)}`);

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const path = result.url.replace(SITE_URL, '');
    const statusText = result.status ? `[${result.status}]` : '[ERROR]';
    
    console.log(`${status} ${index + 1}. ${statusText} ${path}`);
    
    if (!result.success) {
      console.log(`   Expected: ${result.isRedirect ? '301/302/307/308' : result.expected}`);
      console.log(`   Error: ${result.error || 'Unknown error'}`);
      if (result.location) {
        console.log(`   Redirects to: ${result.location}`);
      }
    } else if (result.isRedirect && result.location) {
      console.log(`   ↳ Redirects to: ${result.location.replace(SITE_URL, '')}`);
    }
    
    if (showDiagnostics && result.diagnostics) {
      console.log(`   ⚡ ${result.diagnostics.responseTime} | 📦 ${result.diagnostics.contentLength} bytes | 📄 ${result.diagnostics.contentType}`);
    }
  });

  console.log(`\n📊 Summary: ${successCount}/${totalCount} successful`);
  return { successCount, totalCount };
}

function checkLocalFiles(filePaths) {
  const fs = require('fs');
  const path = require('path');
  
  const results = [];
  
  filePaths.forEach(filePath => {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    const exists = fs.existsSync(fullPath);
    
    results.push({
      path: filePath,
      exists,
      size: exists ? fs.statSync(fullPath).size : 0,
    });
  });
  
  return results;
}

async function main() {
  console.log('🔍 ABRAHAM OF LONDON - COMPREHENSIVE AUDIT');
  console.log(`🌐 Target: ${SITE_URL}`);
  console.log(`📅 ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  const totals = { success: 0, total: 0 };
  const failedUrls = [];

  try {
    // 1. Check core pages
    console.log('\n📄 CORE PAGES (Should return 200 OK)');
    const coreResults = await checkUrls(ACTUAL_PATHS.corePages, 200, false);
    const coreStats = printResults('Core Pages', coreResults, true);
    totals.success += coreStats.successCount;
    totals.total += coreStats.totalCount;
    coreResults.filter(r => !r.success).forEach(r => failedUrls.push(r.url.replace(SITE_URL, '')));

    // 2. Check workshop pages
    console.log('\n🎯 WORKSHOP PAGES (Should return 200 OK)');
    const workshopResults = await checkUrls(ACTUAL_PATHS.workshops, 200, false);
    const workshopStats = printResults('Workshop Pages', workshopResults, true);
    totals.success += workshopStats.successCount;
    totals.total += workshopStats.totalCount;
    workshopResults.filter(r => !r.success).forEach(r => failedUrls.push(r.url.replace(SITE_URL, '')));

    // 3. Check canon pages
    console.log('\n📖 CANON PAGES (Should return 200 OK)');
    const canonResults = await checkUrls(ACTUAL_PATHS.canonPages, 200, false);
    const canonStats = printResults('Canon Pages', canonResults, true);
    totals.success += canonStats.successCount;
    totals.total += canonStats.totalCount;
    canonResults.filter(r => !r.success).forEach(r => failedUrls.push(r.url.replace(SITE_URL, '')));

    // 4. Check resource categories
    console.log('\n📚 RESOURCE CATEGORIES (Should return 200 OK)');
    const resourceResults = await checkUrls(ACTUAL_PATHS.resourceCategories, 200, false);
    const resourceStats = printResults('Resource Categories', resourceResults, true);
    totals.success += resourceStats.successCount;
    totals.total += resourceStats.totalCount;
    resourceResults.filter(r => !r.success).forEach(r => failedUrls.push(r.url.replace(SITE_URL, '')));

    // 5. Check PDF downloads
    console.log('\n📥 PDF DOWNLOADS (Should return 200 OK)');
    const pdfResults = await checkUrls(ACTUAL_PATHS.pdfDownloads, 200, false);
    const pdfStats = printResults('PDF Downloads', pdfResults, true);
    totals.success += pdfStats.successCount;
    totals.total += pdfStats.totalCount;
    pdfResults.filter(r => !r.success).forEach(r => failedUrls.push(r.url.replace(SITE_URL, '')));

    // 6. Check critical redirects
    console.log('\n🔄 CRITICAL REDIRECTS (Should return 301/302)');
    const redirectResults = await checkUrls(ACTUAL_PATHS.criticalRedirects, 301, true);
    const redirectStats = printResults('Critical Redirects', redirectResults, true);
    totals.success += redirectStats.successCount;
    totals.total += redirectStats.totalCount;
    redirectResults.filter(r => !r.success).forEach(r => failedUrls.push(r.url.replace(SITE_URL, '')));

    // 7. Local file checks
    console.log('\n💾 LOCAL FILE CHECKS');
    const localFiles = checkLocalFiles([
      ...ACTUAL_PATHS.pdfDownloads.map(p => p.startsWith('/') ? p.slice(1) : p),
      ...ACTUAL_PATHS.criticalAssets.map(a => a.startsWith('/') ? a.slice(1) : a),
    ]);
    
    localFiles.forEach(file => {
      const status = file.exists ? '✅' : '❌';
      console.log(`${status} ${file.path} ${file.exists ? `(${file.size} bytes)` : 'MISSING'}`);
      if (!file.exists) failedUrls.push(`/public/${file.path}`);
    });

    // 8. Final summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL AUDIT SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests Run: ${totals.total}`);
    console.log(`Successful: ${totals.success}`);
    console.log(`Failed: ${totals.total - totals.success}`);
    const successRate = totals.total > 0 ? (totals.success / totals.total) * 100 : 0;
    console.log(`Overall Success Rate: ${successRate.toFixed(1)}%`);

    if (failedUrls.length > 0) {
      console.log('\n⚠️ CRITICAL ISSUES NEEDING ATTENTION:');
      failedUrls.forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
      });
      
      console.log('\n🔧 RECOMMENDED ACTIONS:');
      console.log('1. Check if these pages exist in your Next.js app directory');
      console.log('2. Verify the files exist in /public/ directory');
      console.log('3. Check your netlify.toml redirects are correct');
      
      process.exit(1);
    } else {
      console.log('\n🎉 ALL CRITICAL LINKS ARE WORKING CORRECTLY!');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Abraham of London Link Checker
Usage:
  node scripts/check-links.js [options]

Options:
  --local       Test against localhost:3000
  --prod        Test against production site
  --url=URL     Test against custom URL
  --help, -h    Show this help
    `);
    process.exit(0);
  }
  
  if (args.includes('--prod')) {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.abrahamoflondon.org';
  } else if (args.includes('--local')) {
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
  } else {
    const urlArg = args.find(arg => arg.startsWith('--url='));
    if (urlArg) {
      process.env.NEXT_PUBLIC_SITE_URL = urlArg.split('=')[1];
    }
  }
  
  main();
}

module.exports = {
  ACTUAL_PATHS,
  checkUrl,
  checkUrls,
  checkLocalFiles
};
