// netlify/functions/___netlify-server-handler/index.js
const { execSync } = require('child_process');
const path = require('path');

// This is a minimal wrapper that points to your Next.js build
exports.handler = async (event, context) => {
  // Your server handler logic here
  return {
    statusCode: 200,
    body: 'OK'
  };
};