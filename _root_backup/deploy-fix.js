// deploy-fixed.js
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const hookURL = "https://api.netlify.com/build_hooks/6846264d93f5f758cf78db92";
const timestamp = new Date().toISOString();

console.log("🚀 Deploying with hook:", hookURL);

axios.post(hookURL, {}, { maxRedirects: 0 })
  .then(() => {
    console.log("✅ Netlify build triggered.");
    fs.appendFileSync('codex-log.txt', `[${timestamp}] ✅ Build triggered\n`);
  })
  .catch(err => {
    console.error("❌ Trigger failed:", err.message);
    fs.appendFileSync('codex-log.txt', `[${timestamp}] ❌ Build failed: ${err.message}\n`);
    process.exit(1);
  });