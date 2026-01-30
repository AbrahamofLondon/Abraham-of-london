# scripts/clean-build.sh
echo "🧹 Cleaning previous builds..."
rm -rf .next .contentlayer node_modules/.cache

echo "📦 Building content..."
contentlayer2 build

echo "🏗️ Building Next.js..."
next build

echo "✅ Build completed successfully!"