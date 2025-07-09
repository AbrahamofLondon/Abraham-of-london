// deploy-script-no-deps.js - Safe deployment script for Abraham of London website
const axios = require('axios');

async function deployWebsite() {
  console.log('🚀 Starting Abraham of London website deployment...');
  
  // Netlify webhook URL
  const webhookUrl = 'https://api.netlify.com/build_hooks/684c730862a2c482c589aa5e';
  
  try {
    console.log('📡 Triggering Netlify build...');
    const response = await axios.post(webhookUrl);
    
    if (response.status === 200) {
      console.log('✅ SUCCESS: Abraham of London website deployment triggered!');
      console.log('🌟 Status:', response.status);
      console.log('🎯 Netlify build started successfully');
      console.log('📋 Build will be available at your Netlify domain shortly');
    } else {
      console.log('⚠️  Warning: Unexpected status code:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📄 Response data:', error.response.data);
    }
    
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Verify the webhook URL is correct');
    console.log('3. Ensure Netlify project is properly configured');
    
    process.exit(1);
  }
}

// Run deployment
deployWebsite();