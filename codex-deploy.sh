
#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🔁 Starting full automation deployment process..."

# Step 1: Install dependencies
echo "📦 Installing project dependencies..."
npm install

# Step 2: Fix Netlify config (if needed) and commit
echo "🛠 Ensuring netlify.toml is committed..."
git add netlify.toml
git commit -m "Automated: Ensure netlify.toml is present and updated" || echo "✅ Already committed."

# Step 3: Push to GitHub
echo "🚀 Pushing changes to GitHub main branch..."
git push origin main

# Step 4: Trigger Netlify build via build hook
echo "⚡ Triggering Netlify build via build hook..."
curl -X POST https://api.netlify.com/build_hooks/684b264d93f5f750cf78db92

echo "✅ Deployment automation completed successfully."
