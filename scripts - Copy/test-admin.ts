
const crypto = require('crypto');

// Generate test data
function generateTestData() {
  const adminKey = process.env.INNER_CIRCLE_ADMIN_KEY || 'test-admin-key';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  console.log('🔧 Inner Circle Admin Test Script');
  console.log('================================');
  console.log(`Admin Key: ${adminKey.slice(0, 10)}...${adminKey.slice(-10)}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log('');
  
  // Test commands
  console.log('📋 Test Commands:');
  console.log('');
  console.log('1. Export data:');
  console.log(`curl -H "x-inner-circle-admin-key: ${adminKey}" ${baseUrl}/api/admin/inner-circle/export`);
  console.log('');
  console.log('2. Test revoke key (replace KEY_HERE):');
  console.log(`curl -X POST -H "Content-Type: application/json" -H "x-inner-circle-admin-key: ${adminKey}" -d '{"key":"KEY_HERE"}' ${baseUrl}/api/admin/inner-circle/revoke`);
  console.log('');
  console.log('3. Test cleanup:');
  console.log(`curl -X POST -H "Content-Type: application/json" -H "x-inner-circle-admin-key: ${adminKey}" ${baseUrl}/api/admin/inner-circle/cleanup`);
  console.log('');
  console.log('4. Test delete member:');
  console.log(`curl -X POST -H "Content-Type: application/json" -H "x-inner-circle-admin-key: ${adminKey}" -d '{"email":"test@example.com"}' ${baseUrl}/api/admin/inner-circle/delete-member`);
  console.log('');
  console.log('🌐 Admin UI:');
  console.log(`${baseUrl}/admin/inner-circle`);
}

if (require.main === module) {
  generateTestData();
}
