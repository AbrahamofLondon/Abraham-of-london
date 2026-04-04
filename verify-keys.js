const crypto = require('crypto');

function decrypt(encrypted, secret) {
  const [ivBase64, encryptedBase64] = encrypted.split(':');
  const iv = Buffer.from(ivBase64, 'base64');
  const key = crypto.createHash('sha256').update(secret).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const secret = process.argv[2];
const token = process.argv[3];

try {
  const result = decrypt(token, secret);
  console.log('✓ Decryption successful:', result);
  if (result === 'GRANTED') {
    console.log('✓ Token validation PASSED');
    process.exit(0);
  } else {
    console.log('✗ Token validation FAILED: unexpected value');
    process.exit(1);
  }
} catch (error) {
  console.log('✗ Decryption failed:', error.message);
  process.exit(1);
}
