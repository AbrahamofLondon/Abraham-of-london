#!/usr/bin/env node
/**
 * Deployment Verification Script
 * Checks if the deployed application is working correctly
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Get deployment URL from environment or config
function getDeploymentUrl() {
  // Try various environment variables
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL ||
    process.env.URL ||
    process.env.DEPLOY_URL ||
    null
  );
}

async function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeout = options.timeout || 10000;
    
    const req = protocol.get(url, { timeout }, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkEndpoint(url, name, options = {}) {
  const checks = {
    name,
    url,
    success: false,
    statusCode: null,
    responseTime: null,
    error: null,
    warnings: []
  };
  
  console.log(`🔍 Checking ${name}...`);
  
  try {
    const startTime = Date.now();
    const response = await fetchUrl(url, options);
    const endTime = Date.now();
    
    checks.responseTime = endTime - startTime;
    checks.statusCode = response.statusCode;
    
    // Check status code
    if (response.statusCode >= 200 && response.statusCode < 300) {
      checks.success = true;
      console.log(`✅ ${name} - ${response.statusCode} (${checks.responseTime}ms)`);
    } else if (response.statusCode >= 300 && response.statusCode < 400) {
      checks.success = true;
      checks.warnings.push(`Redirect status: ${response.statusCode}`);
      console.log(`⚠️  ${name} - ${response.statusCode} (redirect) (${checks.responseTime}ms)`);
    } else if (response.statusCode === 404) {
      checks.success = false;
      checks.error = `Not Found (${response.statusCode})`;
      console.log(`❌ ${name} - 404 Not Found (${checks.responseTime}ms)`);
    } else {
      checks.success = false;
      checks.error = `HTTP ${response.statusCode}`;
      console.log(`❌ ${name} - ${response.statusCode} (${checks.responseTime}ms)`);
    }
    
    // Check response time
    if (checks.responseTime > 3000) {
      checks.warnings.push(`Slow response time: ${checks.responseTime}ms`);
    }
    
    // Check content type for HTML pages
    if (options.expectHtml && response.headers['content-type']) {
      if (!response.headers['content-type'].includes('text/html')) {
        checks.warnings.push(`Unexpected content-type: ${response.headers['content-type']}`);
      }
    }
    
    // Check for common security headers
    if (options.checkSecurityHeaders) {
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'strict-transport-security'
      ];
      
      for (const header of securityHeaders) {
        if (!response.headers[header]) {
          checks.warnings.push(`Missing security header: ${header}`);
        }
      }
    }
    
    // Check body content
    if (options.expectContent && checks.success) {
      const bodyLower = response.body.toLowerCase();
      
      if (options.expectContent.some(content => bodyLower.includes(content.toLowerCase()))) {
        console.log(`   ✓ Expected content found`);
      } else {
        checks.warnings.push('Expected content not found in response');
        console.log(`   ⚠️  Expected content not found`);
      }
    }
    
  } catch (error) {
    checks.success = false;
    checks.error = error.message;
    console.log(`❌ ${name} - Error: ${error.message}`);
  }
  
  console.log('');
  return checks;
}

async function checkDeployment() {
  console.log('🚀 Starting Deployment Verification...\n');
  console.log('='.repeat(60) + '\n');
  
  const deploymentUrl = getDeploymentUrl();
  
  if (!deploymentUrl) {
    console.log('❌ No deployment URL found in environment variables\n');
    console.log('Please set one of the following:');
    console.log('  - NEXT_PUBLIC_SITE_URL');
    console.log('  - NEXTAUTH_URL');
    console.log('  - VERCEL_URL');
    console.log('  - URL');
    console.log('  - DEPLOY_URL\n');
    process.exit(1);
  }
  
  // Ensure URL has protocol
  let baseUrl = deploymentUrl;
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  
  console.log(`📍 Deployment URL: ${baseUrl}\n`);
  
  const results = [];
  
  // Check homepage
  results.push(await checkEndpoint(
    baseUrl,
    'Homepage',
    {
      expectHtml: true,
      checkSecurityHeaders: true,
      expectContent: ['<!DOCTYPE html>', '<html']
    }
  ));
  
  // Check API health endpoint (if exists)
  results.push(await checkEndpoint(
    `${baseUrl}/api/health`,
    'API Health Endpoint',
    { timeout: 5000 }
  ));
  
  // Check common pages
  const pagesToCheck = [
    { path: '/about', name: 'About Page' },
    { path: '/contact', name: 'Contact Page' },
    { path: '/api/auth/providers', name: 'Auth Providers API' },
  ];
  
  for (const page of pagesToCheck) {
    results.push(await checkEndpoint(
      `${baseUrl}${page.path}`,
      page.name,
      { expectHtml: true, timeout: 5000 }
    ));
  }
  
  // Check static assets
  results.push(await checkEndpoint(
    `${baseUrl}/favicon.ico`,
    'Favicon',
    { timeout: 3000 }
  ));
  
  // Print summary
  console.log('='.repeat(60));
  console.log('📊 DEPLOYMENT VERIFICATION SUMMARY');
  console.log('='.repeat(60) + '\n');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  
  console.log(`✅ Successful checks: ${successful}/${results.length}`);
  console.log(`❌ Failed checks: ${failed}/${results.length}`);
  console.log(`⚠️  Total warnings: ${totalWarnings}\n`);
  
  // Show failed checks
  if (failed > 0) {
    console.log('❌ Failed Checks:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}: ${r.error || 'Unknown error'}`);
    });
    console.log('');
  }
  
  // Show warnings
  if (totalWarnings > 0) {
    console.log('⚠️  Warnings:');
    results.forEach(r => {
      if (r.warnings.length > 0) {
        console.log(`   ${r.name}:`);
        r.warnings.forEach(w => console.log(`     - ${w}`));
      }
    });
    console.log('');
  }
  
  // Show performance metrics
  const responseTimes = results
    .filter(r => r.responseTime !== null)
    .map(r => r.responseTime);
  
  if (responseTimes.length > 0) {
    const avgResponseTime = Math.round(
      responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
    );
    const maxResponseTime = Math.max(...responseTimes);
    
    console.log('📈 Performance Metrics:');
    console.log(`   Average response time: ${avgResponseTime}ms`);
    console.log(`   Maximum response time: ${maxResponseTime}ms\n`);
  }
  
  // Overall verdict
  if (failed === 0) {
    if (totalWarnings === 0) {
      console.log('✅ DEPLOYMENT VERIFICATION PASSED\n');
      console.log('All checks passed successfully!\n');
      process.exit(0);
    } else {
      console.log('⚠️  DEPLOYMENT VERIFICATION PASSED WITH WARNINGS\n');
      console.log('Please review the warnings above.\n');
      process.exit(0);
    }
  } else {
    const criticalFailed = results.filter(r => 
      !r.success && (r.name === 'Homepage' || r.name === 'API Health Endpoint')
    ).length;
    
    if (criticalFailed > 0) {
      console.log('❌ DEPLOYMENT VERIFICATION FAILED\n');
      console.log('Critical endpoints are not responding correctly.\n');
      process.exit(1);
    } else {
      console.log('⚠️  DEPLOYMENT VERIFICATION PASSED WITH FAILURES\n');
      console.log('Some non-critical checks failed. Review the results above.\n');
      process.exit(0);
    }
  }
}

// Run deployment check
checkDeployment().catch(error => {
  console.error('❌ Deployment verification failed with error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
