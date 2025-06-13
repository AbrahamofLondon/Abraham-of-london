require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const hookURL = process.env.NETLIFY_BUILD_HOOK || 'https://api.netlify.com/build_hooks/684c730862a2c482c589aa5e';
const timestamp = new Date().toISOString();

axios.post(hookURL)
  .then(() => {
    console.log('Netlify build triggered successfully.');
    fs.appendFileSync('codex-log.txt', `\n[${timestamp}] Build triggered\n`);
  })
  .catch(err => {
    console.error('Netlify trigger failed:', err.message);
    fs.appendFileSync('codex-log.txt', `\n[${timestamp}] Build failed: ${err.message}\n`);
  });
