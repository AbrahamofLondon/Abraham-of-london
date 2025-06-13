const log = require('./log');
// Load environment variables
require('dotenv').config();
const axios = require('axios');

// Set Netlify build hook URL (from .env or fallback)
const DEPLOY_HOOK_URL = process.env.NETLIFY_DEPLOY_HOOK || "https://api.netlify.com/build_hooks/YOUR-HOOK-ID";

console.log("🔗 Using hook:", DEPLOY_HOOK_URL);

(async () => {
  try {
    const response = await axios.post(DEPLOY_HOOK_URL);
    console.log("✅ Netlify build triggered successfully.");
    console.log("📦 Response status:", response.status);
  } catch (error) {
    console.error("❌ Failed to trigger Netlify build.");
    if (error.response) {
      console.error("📡 Server responded with:", error.response.status);
      console.error("💬 Message:", error.response.data);
    } else {
      console.error("🔍 Error:", error.message);
    }
    process.exit(1);
  }
})();
