
# scripts/build.sh - Simple build script for Netlify
echo "Setting build environment..."
export CI=false
export NEXT_DISABLE_ESLINT=1
export NEXT_DISABLE_TYPECHECK=1
export NODE_ENV=production

echo "Building Contentlayer..."
contentlayer2 build

echo "Building Next.js..."
next build

echo "Build complete!"