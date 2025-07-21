const https = require('https');

const buildHookUrl = 'https://api.netlify.com/build_hooks/684b264d93f5f750cf78db92';

https.request(buildHookUrl, { method: 'POST' }, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode === 200) {
    console.log('✅ Netlify build triggered successfully.');
  } else {
    console.log('❌ Failed to trigger Netlify.');
  }
}).end();
