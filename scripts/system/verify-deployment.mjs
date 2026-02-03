/* scripts/system/verify-deployment.mjs — DEPLOYMENT SUCCESS AUDITOR */
import axios from 'axios';
import chalk from 'chalk'; // Ensure chalk is in your devDependencies

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000';

const REDIRECT_TESTS = [
  { from: '/blog/test-post', expected: '/insights/test-post', name: 'Legacy Blog Migration' },
  { from: '/articles/test-post', expected: '/insights/test-post', name: 'Articles Migration' },
  { from: '/index.html', expected: '/', name: 'HTML Canonicalization' },
  { from: '/news/test-post', expected: '/insights/test-post', name: 'News Migration' }
];

const SECURITY_HEADERS = [
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'strict-transport-security'
];

async function verifyDeployment() {
  console.log(chalk.bold(`\n🏛️  [VERIFICATION] Auditing Deployment: ${TARGET_URL}\n`));

  let failureCount = 0;

  // 1. Audit Redirect Logic
  console.log(chalk.cyan('--- Redirect Sovereignty ---'));
  for (const test of REDIRECT_TESTS) {
    try {
      const response = await axios.get(`${TARGET_URL}${test.from}`, { 
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400
      });

      const finalPath = new URL(response.request.res.responseUrl).pathname;
      
      if (finalPath.startsWith(test.expected)) {
        console.log(`✅ ${test.name.padEnd(25)}: Redirected to ${finalPath}`);
      } else {
        console.log(`❌ ${test.name.padEnd(25)}: Failed. Got ${finalPath}`);
        failureCount++;
      }
    } catch (error) {
      console.log(`❌ ${test.name.padEnd(25)}: Error - ${error.message}`);
      failureCount++;
    }
  }

  // 2. Audit Security Headers
  console.log(chalk.cyan('\n--- Institutional Security Headers ---'));
  try {
    const root = await axios.get(TARGET_URL);
    SECURITY_HEADERS.forEach(header => {
      if (root.headers[header]) {
        console.log(`✅ ${header.padEnd(25)}: ${root.headers[header]}`);
      } else {
        console.log(`❌ ${header.padEnd(25)}: MISSING`);
        failureCount++;
      }
    });
  } catch (e) {
    console.log(`❌ Could not fetch root headers: ${e.message}`);
    failureCount++;
  }

  // 3. Audit Asset Availability (Sample Check)
  console.log(chalk.cyan('\n--- Asset Availability ---'));
  const assets = ['/lexicon', '/insights', '/vault'];
  for (const path of assets) {
    try {
      const res = await axios.head(`${TARGET_URL}${path}`);
      console.log(`✅ ${path.padEnd(25)}: Status ${res.status}`);
    } catch (e) {
      console.log(`❌ ${path.padEnd(25)}: BROKEN (Status ${e.response?.status || 'ERR'})`);
      failureCount++;
    }
  }

  if (failureCount > 0) {
    console.log(chalk.red(`\n🚨 [AUDIT_FAILED] ${failureCount} discrepancies found in the architecture.`));
    process.exit(1);
  } else {
    console.log(chalk.green('\n✨ [AUDIT_PASSED] All institutional systems are operational. Deployment verified.'));
  }
}

verifyDeployment();