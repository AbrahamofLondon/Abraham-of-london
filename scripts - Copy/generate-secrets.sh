#!/bin/bash
set -e

echo "🔐 Generating secure secrets..."

# Check for openssl
if ! command -v openssl &> /dev/null; then
    echo "❌ openssl not found. Please install openssl first."
    exit 1
fi

# Generate secrets
INNER_CIRCLE_JWT_SECRET=$(openssl rand -hex 64)
ADMIN_API_KEY=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 64)
DATABASE_PASSWORD=$(openssl rand -base64 24)
REDIS_PASSWORD=$(openssl rand -hex 16)

# Create or update .env.local
ENV_FILE=".env.local"

if [ -f ".env.example" ]; then
    cp .env.example $ENV_FILE
else
    # Create basic template
    cat > $ENV_FILE << 'EOF'
# ============================================
# DATABASE CONFIGURATION
# ============================================
DATABASE_URL="postgresql://username:password@localhost:5432/inner_circle_db"

# ============================================
# JWT & SECURITY
# ============================================
INNER_CIRCLE_JWT_SECRET=""
JWT_SECRET=""
ADMIN_JWT_SECRET=""

# ============================================
# ADMIN ACCESS
# ============================================
ADMIN_API_KEY=""

# ============================================
# INNER CIRCLE CONFIGURATION
# ============================================
INNER_CIRCLE_KEY_EXPIRY_DAYS="90"

# ============================================
# CACHE CONFIGURATION
# ============================================
REDIS_URL="redis://localhost:6379"

# ============================================
# DEBUG & DEVELOPMENT
# ============================================
NODE_ENV="development"
EOF
fi

# Replace placeholders
sed -i.bak "s|INNER_CIRCLE_JWT_SECRET=\"\"|INNER_CIRCLE_JWT_SECRET=\"$INNER_CIRCLE_JWT_SECRET\"|g" $ENV_FILE
sed -i.bak "s|ADMIN_API_KEY=\"\"|ADMIN_API_KEY=\"$ADMIN_API_KEY\"|g" $ENV_FILE
sed -i.bak "s|JWT_SECRET=\"\"|JWT_SECRET=\"$JWT_SECRET\"|g" $ENV_FILE
sed -i.bak "s|DATABASE_PASSWORD=\"\"|DATABASE_PASSWORD=\"$DATABASE_PASSWORD\"|g" $ENV_FILE 2>/dev/null || true
sed -i.bak "s|REDIS_PASSWORD=\"\"|REDIS_PASSWORD=\"$REDIS_PASSWORD\"|g" $ENV_FILE 2>/dev/null || true

# Clean up backup file
rm -f $ENV_FILE.bak

echo "✅ Secrets generated in $ENV_FILE"
echo "⚠️  WARNING: Never commit $ENV_FILE to version control!"
echo ""
echo "Generated secrets (first 8 chars shown):"
echo "INNER_CIRCLE_JWT_SECRET: ${INNER_CIRCLE_JWT_SECRET:0:8}..."
echo "ADMIN_API_KEY: ${ADMIN_API_KEY:0:8}..."
echo "JWT_SECRET: ${JWT_SECRET:0:8}..."
echo "DATABASE_PASSWORD: ${DATABASE_PASSWORD:0:8}..."
echo "REDIS_PASSWORD: ${REDIS_PASSWORD:0:8}..."