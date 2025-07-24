#!/bin/bash

# === Codex Full Auto Setup Script ===
# Purpose: Setup environment, build project, trigger deploy
# Compatible: macOS/Linux/Git Bash on Windows

# --- Configurable ---
ENV_FILE=".env"
ENV_EXAMPLE=".env.example"
DEPLOY_HOOK_URL="https://api.netlify.com/build_hooks/YOUR-HOOK-ID" # Replace with actual hook ID
REPO_URL="https://github.com/YOUR_USERNAME/YOUR_REPO.git"          # Optional: your GitHub repo

# --- Step 1: Environment Setup ---
echo "[1/5] Checking environment file..."
if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$ENV_EXAMPLE" ]; then
        echo "Creating .env from .env.example..."
        cp "$ENV_EXAMPLE" "$ENV_FILE"
    else
        echo "No .env or .env.example found. Creating .env with placeholders..."
        echo "# Auto-generated .env\nPORT=3000\nAPI_URL=https://api.example.com" > "$ENV_FILE"
    fi
else
    echo ".env exists. Skipping creation."
fi

# --- Step 2: Dependency Installation ---
echo "[2/5] Installing dependencies..."
if [ -d "node_modules" ]; then
    echo "node_modules found. Skipping install."
else
    if [ -f package-lock.json ]; then
        echo "Running npm ci..."
        npm ci || echo "npm ci failed, trying npm install..." && npm install
    else
        echo "Running npm install..."
        npm install
    fi
fi

# --- Step 3: Build Project ---
echo "[3/5] Building project..."
npm run build || {
    echo "Build failed!";
    exit 1;
}

# --- Step 4: Git Sync (Optional) ---
echo "[4/5] Syncing to GitHub..."
git add . && \
    git commit -m "Automated setup and build" && \
    git push origin main || echo "Git push skipped or failed"

# --- Step 5: Trigger Netlify/Webhook Deploy ---
echo "[5/5] Triggering deployment via webhook..."
curl -X POST -d '{}' "$DEPLOY_HOOK_URL" && \
    echo "✅ Deploy triggered!" || \
    echo "❌ Failed to trigger deploy. Check webhook URL."

# --- Done ---
echo "\n🎯 Project setup and deployment complete!"
