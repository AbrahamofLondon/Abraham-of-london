// simple-deploy-no-deps.js
// This script uses only built-in Node.js modules - no npm install required!

const https = require('https');
const fs = require('fs');
const url = require('url');

// Your Netlify build hook URL
const hookURL = "https://api.netlify.com/build_hooks/684c730862a2c482c589aa5e";
const timestamp = new Date().toISOString();

console.log("🚀 Deploying with hook:", hookURL);

// Parse the URL
const parsedUrl = new URL(hookURL);

// Set up the request options
const options = {
  hostname: parsedUrl.hostname,
  path: parsedUrl.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Codex-Deploy-Script'
  }
};

// Make the request
const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 204) {
      console.log("✅ Netlify build triggered successfully!");
      
      // Log success to file
      try {
        fs.appendFileSync('codex-log.txt', `[${timestamp}] ✅ Build triggered successfully\n`);
      } catch (err) {
        console.log("Note: Could not write to log file, but deployment was successful");
      }
    } else {
      console.log("❌ Deployment failed with status:", res.statusCode);
      console.log("Response:", data);
      
      // Log failure to file
      try {
        fs.appendFileSync('codex-log.txt', `[${timestamp}] ❌ Build failed: Status ${res.statusCode}\n`);
      } catch (err) {
        console.log("Note: Could not write to log file");
      }
    }
  });
});

// Handle request errors
req.on('error', (error) => {
  console.error("❌ Request failed:", error.message);
  
  // Log error to file
  try {
    fs.appendFileSync('codex-log.txt', `[${timestamp}] ❌ Request failed: ${error.message}\n`);
  } catch (err) {
    console.log("Note: Could not write to log file");
  }
});

// Send the request
req.end();

console.log("📡 Request sent, waiting for response...");