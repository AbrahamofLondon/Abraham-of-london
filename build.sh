// build.sh
set -e

echo "🧹 Cleaning build cache..."
rm -rf .next .contentlayer node_modules/.cache

echo "📦 Installing dependencies..."
npm ci

echo "🏗️  Building Contentlayer..."
npm run contentlayer:build

echo "🔧 Building Next.js..."
NEXT_IGNORE_ESLINT=1 npm run build

echo "✅ Build completed successfully!"