require('dotenv').config(); // Add this at the very top
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');

const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');

console.log('🔧 Starting automated deployment...');

exec('npm install && npm run build', (err, stdout, stderr) => {
  if (err) {
    console.error(`❌ Build failed: ${stderr}`);
    return;
  }

  console.log(`✅ Build completed:\n${stdout}`);

  exec('git add . && git commit -m "Automated deploy commit" && git push', (err, out, errOut) => {
    if (err) {
      console.error(`❌ Git operation failed: ${errOut}`);
      return;
    }

    console.log(`📦 Pushed to GitHub:\n${out}`);

    // Netlify build trigger
    const hookURL = "https://api.netlify.com/build_hooks/684b264d93f5f750cf78db92"; // replace as env var in future
    const timestamp = new Date().toISOString();

    axios.post(hookURL)
      .then(() => {
        console.log("🚀 Netlify build triggered successfully.");
        fs.appendFileSync('codex-log.txt', `[${timestamp}] ✅ Build triggered\n`);
      })
      .catch(err => {
        console.error("❌ Netlify trigger failed:", err.message);
        fs.appendFileSync('codex-log.txt', `[${timestamp}] ❌ Build failed: ${err.message}\n`);
      });
  });
});
require('dotenv').config();
const hookURL = process.env.NETLIFY_BUILD_HOOK;
