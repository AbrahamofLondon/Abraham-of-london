// netlify/functions/___netlify-server-handler/index.js
const path = require('path');

let serverHandler;
try {
  // Try multiple possible paths
  const possiblePaths = [
    '../../.next/standalone/server.js',
    '.next/standalone/server.js',
    path.join(process.cwd(), '.next/standalone/server.js')
  ];
  
  for (const p of possiblePaths) {
    try {
      serverHandler = require(p);
      console.log('✅ Loaded server handler from:', p);
      break;
    } catch (e) {
      // Continue trying next path
    }
  }
} catch (error) {
  console.error('❌ Failed to load Next.js server handler:', error);
}

exports.handler = serverHandler ? serverHandler.handler : async () => ({
  statusCode: 500,
  body: 'Server handler not found'
});