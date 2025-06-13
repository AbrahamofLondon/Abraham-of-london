// Load environment variables from .env file
require('dotenv').config();

// Print environment variables
console.log("✅ API_URL:", process.env.API_URL);
console.log("✅ VITE_API_URL:", process.env.VITE_API_URL);
console.log("✅ VITE_ANALYTICS_ID:", process.env.VITE_ANALYTICS_ID);
console.log("✅ NODE_ENV:", process.env.NODE_ENV);
