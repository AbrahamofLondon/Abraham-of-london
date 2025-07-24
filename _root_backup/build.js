require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const hookURL = process.env.NETLIFY_BUILD_HOOK;
const timestamp = new Date().toISOString();

axios.post(hookURL)
  .then(() => {
    console.log("🚀 Netlify build triggered successfully.");
    fs.appendFileSync('codex-log.txt', [${timestamp}] ✅ Build triggered\n);
  })
  .catch(err => {
    console.error("❌ Netlify trigger failed:", err.message);
    fs.appendFileSync('codex-log.txt', [${timestamp}] ❌ Build failed: ${err.message}\n);
  });