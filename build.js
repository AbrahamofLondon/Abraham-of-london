require('dotenv').config();
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');

const hookURL = process.env.NETLIFY_BUILD_HOOK || 'https://api.netlify.com/build_hooks/684b264d93f5f750cf78db92';

console.log('🔧 Starting automated deployment...');

exec('npm ci', (err, stdout, stderr) => {
  if (err) {
    console.error(`❌ Dependency install failed: ${stderr}`);
    return;
  }

  console.log(`✅ Dependencies installed:\n${stdout}`);

  exec('git add . && git commit -m "Automated deploy commit" && git push', (gitErr, out, errOut) => {
    if (gitErr) {
      console.error(`❌ Git operation failed: ${errOut}`);
      return;
    }

    console.log(`📦 Pushed to GitHub:\n${out}`);
    const timestamp = new Date().toISOString();

    axios.post(hookURL)
      .then(() => {
        console.log('🚀 Netlify build triggered successfully.');
        fs.appendFileSync('codex-log.txt', `[${timestamp}] ✅ Build triggered\n`);
      })
      .catch(error => {
        console.error('❌ Netlify trigger failed:', error.message);
        fs.appendFileSync('codex-log.txt', `[${timestamp}] ❌ Build failed: ${error.message}\n`);
      });
  });
});
