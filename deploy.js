// deploy.js
const axios = require("axios");

const NETLIFY_BUILD_HOOK = "https://api.netlify.com/build_hooks/684b264d93f5f750cf78db92"; // Replace with your actual hook

console.log("🚀 Triggering Netlify deploy...");

axios.post(NETLIFY_BUILD_HOOK)
  .then(() => {
    console.log("✅ Deployment triggered successfully.");
  })
  .catch(err => {
    console.error("❌ Failed to trigger deploy:", err.message);
  });
const hookURL = process.env.NETLIFY_BUILD_HOOK;