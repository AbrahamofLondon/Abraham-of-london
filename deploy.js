require('dotenv').config();
const axios = require('axios');

const hookURL = process.env.NETLIFY_BUILD_HOOK || 'https://api.netlify.com/build_hooks/684b264d93f5f750cf78db92';

if (!hookURL) {
  console.error('❌ No Netlify build hook URL provided.');
  process.exit(1);
}

console.log('🚀 Triggering Netlify deploy...');

axios.post(hookURL)
  .then(() => {
    console.log('✅ Deployment triggered successfully.');
  })
  .catch(err => {
    console.error('❌ Failed to trigger deploy:', err.message);
    process.exit(1);
  });
