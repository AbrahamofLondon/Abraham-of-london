const { exec } = require('child_process');

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
  });
});
"scripts": {
  "start": "node index.js",
  "build": "node build.js"
}
const axios = require('axios');
const fs = require('fs');

(async () => {
  const hookURL = "https://api.netlify.com/build_hooks/684b264d93f5f750cf78db92"; // <- yours
  const timestamp = new Date().toISOString();

  try {
    console.log("🚀 Triggering Netlify build...");
    await axios.post(hookURL);
    console.log("✅ Build triggered successfully.");

    fs.appendFileSync('codex-log.txt', `[${timestamp}] Build triggered\n`);
  } catch (err) {
    console.error("❌ Build failed:", err.message);
    fs.appendFileSync('codex-log.txt', `[${timestamp}] Build failed: ${err.message}\n`);
  }
})();

