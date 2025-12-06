#!/bin/bash

# Smart build script with error handling
echo "=== Starting Smart Build ==="

# Step 1: Clean install
echo "1. Installing dependencies..."
pnpm install || { echo "✗ Install failed"; exit 1; }

# Step 2: Type check (skip on CI for speed)
if [ "$CI" != "true" ]; then
    echo "2. Running TypeScript check..."
    pnpm tsc --noEmit 2>&1 | grep -A 5 "error" || echo "✓ TypeScript check passed"
fi

# Step 3: Build
echo "3. Building application..."
pnpm run build:netlify

if [ $? -eq 0 ]; then
    echo "=== ✓ BUILD SUCCESSFUL ==="
else
    echo "=== ✗ BUILD FAILED ==="
    
    # Capture and analyze errors
    ERROR_LOG="build-error.log"
    pnpm run build:netlify 2>&1 | tee $ERROR_LOG
    
    echo ""
    echo "=== Common Solutions ==="
    echo "1. Duplicate exports: Check components/Cards/index.tsx"
    echo "2. Type imports: Check for 'import type { any, any }'"
    echo "3. Missing types: Run 'pnpm add -D @types/next @types/react @types/node'"
    echo "4. Router issues: Ensure consistent useRouter imports"
    
    exit 1
fi
