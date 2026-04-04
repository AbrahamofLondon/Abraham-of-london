const crypto = require('crypto');

// AES-256-CBC encryption
function encrypt(text, secret) {
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return iv.toString('base64') + ':' + encrypted;
}

// Generate a token
const secret = process.argv[2] || 'your-256-bit-secret-key-here';
const plaintext = 'GRANTED';
const encrypted = encrypt(plaintext, secret);

console.log('\n=== Sovereign Access Configuration ===\n');
console.log(`ACCESS_SECRET="${secret}"`);
console.log(`NEXT_PUBLIC_ACCESS_TOKEN="${encrypted}"`);
console.log('\n=== Store these in your .env.local file ===\n');