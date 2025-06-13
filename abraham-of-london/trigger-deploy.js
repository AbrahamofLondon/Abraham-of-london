require('dotenv').config();
const https = require('https');
const fs = require('fs');

const buildHookUrl = process.env.NETLIFY_BUILD_HOOK || 'https://api.netlify.com/build_hooks/684c730862a2c482c589aa5e';
const timestamp = new Date().toISOString();

https.request(buildHookUrl, { method: 'POST' }, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode === 200) {
    console.log('✅ Netlify build triggered successfully.');
  } else {
    console.log('❌ Failed to trigger Netlify.');
  }
  fs.appendFileSync('codex-log.txt', `\n[${timestamp}] Trigger deploy status: ${res.statusCode}\n`);
}).on('error', (err) => {
  console.error('Netlify trigger failed:', err.message);
  fs.appendFileSync('codex-log.txt', `\n[${timestamp}] Trigger deploy failed: ${err.message}\n`);
}).end();
