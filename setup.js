const fs = require('fs');
const path = require('path');

// Create folder structure
const folders = [
  'alomarada-site',
  'alomarada-site/images',
  'alomarada-site/styles'
];

folders.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// === HTML content ===
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Alomarada</title>
  <link rel="stylesheet" href="styles/main.css" />
</head>
<body>
  <!-- Hero Section -->
  <header>
    <div class="nav">
      <a class="brand" href="#"><img class="logo" src="images/alomarada-logo.jpg" alt="Logo"> Alomarada</a>
      <ul class="nav-links">
        <li><a href="#brands">Brands</a></li>
        <li><a href="#book">Book</a></li>
      </ul>
    </div>
  </header>

  <section class="hero">
    <div class="hero-text">
      <h1>Business with Endurance</h1>
      <p>Empowering Africa with Strategy, Story, and Strength.</p>
      <a href="#book" class="cta-button">Explore the Movement</a>
    </div>
    <img src="images/endureluxe.jpg" class="hero-image" alt="Endureluxe Gear" />
  </section>

  <section class="brands" id="brands">
    <h2>Our Brands</h2>
    <div class="brand-grid">
      <div class="brand-card">
        <img src="images/alomarada-logo.jpg" alt="Alomarada" class="brand-img" />
        <h3>Alomarada</h3>
        <p>Strategic consulting for visionary businesses in Africa.</p>
      </div>
      <div class="brand-card">
        <img src="images/endureluxe.jpg" alt="Endureluxe" class="brand-img" />
        <h3>Endureluxe</h3>
        <p>Premium fitness gear for the resilient lifestyle.</p>
      </div>
    </div>
  </section>

  <section class="book" id="book">
    <div class="book-container">
      <img src="images/fatehring-without-fear.jpg" class="book-cover" alt="Fathering Without Fear" />
      <div class="book-details">
        <h2>Fathering Without Fear</h2>
        <p>A powerful memoir that challenges systemic injustice and reclaims legacy through truth and courage.</p>
      </div>
    </div>
  </section>

  <footer>
    <div class="footer-container">
      <p>© 2025 Alomarada Ltd. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>`;

// Write HTML
fs.writeFileSync('alomarada-site/index.html', htmlContent);

// Copy images from root (assumed uploaded in current directory)
fs.copyFileSync('alomarada-logo.jpg', 'alomarada-site/images/alomarada-logo.jpg');
fs.copyFileSync('endureluxe.jpg', 'alomarada-site/images/endureluxe.jpg');
fs.copyFileSync('fatehring-without-fear.jpg', 'alomarada-site/images/fatehring-without-fear.jpg');

// CSS from your last message
const cssContent = fs.readFileSync('alomarada.css', 'utf-8'); // Paste your entire CSS into 'alomarada.css' first
fs.writeFileSync('alomarada-site/styles/main.css', cssContent);

// Create deploy.js
const deployScript = `require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const hookURL = process.env.NETLIFY_DEPLOY_HOOK;
const timestamp = new Date().toISOString();

axios.post(hookURL)
  .then(() => {
    console.log("🚀 Netlify build triggered successfully.");
    fs.appendFileSync('codex-log.txt', \`[\${timestamp}] ✅ Build triggered\\n\`);
  })
  .catch(err => {
    console.error("❌ Netlify trigger failed:", err.message);
    fs.appendFileSync('codex-log.txt', \`[\${timestamp}] ❌ Build failed: \${err.message}\\n\`);
    process.exit(1);
  });`;

fs.writeFileSync('alomarada-site/deploy.js', deployScript);

// Create .env (you must replace with your real hook)
fs.writeFileSync('alomarada-site/.env', 'NETLIFY_DEPLOY_HOOK=https://api.netlify.com/build_hooks/684c730862a2c482c589aa5e');

// Create package.json
const pkg = {
  name: "alomarada-site",
  version: "1.0.0",
  scripts: {
    deploy: "node deploy.js"
  },
  dependencies: {
    axios: "^1.5.1",
    dotenv: "^16.3.1"
  }
