
// scripts/generate-admin-key.sh

echo "🔒 Generating Inner Circle Admin Key"
echo "===================================="
echo ""
echo "Run this command to generate a secure admin key:"
echo ""
echo "openssl rand -hex 32"
echo ""
echo "Or use this Node.js command:"
echo "node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
echo ""
echo "Example output:"
echo "INNER_CIRCLE_ADMIN_KEY=4f7b3a9c8d2e1f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2"