// verify-sovereign-access.js
const crypto = require('crypto');

function decryptToken(encryptedToken, secret) {
    try {
        // Decode the base64 token
        const encryptedData = Buffer.from(encryptedToken, 'base64');
        
        // Extract IV (first 16 bytes) and encrypted content
        const iv = encryptedData.slice(0, 16);
        const encrypted = encryptedData.slice(16);
        
        // Derive key using PBKDF2
        const salt = Buffer.from('SovereignSalt', 'utf8');
        const key = crypto.pbkdf2Sync(secret, salt, 10000, 32, 'sha256');
        
        // Decrypt
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return decrypted.toString('utf8');
    } catch (error) {
        console.error('Decryption error:', error.message);
        return null;
    }
}

// Read from .env.local or use command line args
const fs = require('fs');
const path = require('path');

let secret, token;

// Try to read from .env.local
try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const secretMatch = envContent.match(/^ACCESS_SECRET="?([^"\n]+)"?/m);
        const tokenMatch = envContent.match(/^NEXT_PUBLIC_ACCESS_TOKEN="?([^"\n]+)"?/m);
        
        if (secretMatch) secret = secretMatch[1];
        if (tokenMatch) token = tokenMatch[1];
        
        console.log('✓ Loaded configuration from .env.local\n');
    }
} catch (err) {
    console.log('! Could not read .env.local, using command line arguments\n');
}

// Use command line args if .env.local didn't provide them
if (!secret && process.argv[2]) secret = process.argv[2];
if (!token && process.argv[3]) token = process.argv[3];

if (!secret || !token) {
    console.log('❌ Missing required credentials');
    console.log('\nUsage:');
    console.log('  node verify-sovereign-access.js');
    console.log('  or');
    console.log('  node verify-sovereign-access.js <ACCESS_SECRET> <NEXT_PUBLIC_ACCESS_TOKEN>');
    console.log('\nOr ensure .env.local contains:');
    console.log('  ACCESS_SECRET="..."');
    console.log('  NEXT_PUBLIC_ACCESS_TOKEN="..."');
    process.exit(1);
}

console.log('=== Sovereign Access Verification ===\n');
console.log('Secret (first 20 chars):', secret.substring(0, 20) + '...');
console.log('Token (first 30 chars):', token.substring(0, 30) + '...\n');

console.log('Attempting to decrypt token...\n');

const result = decryptToken(token, secret);

if (result === 'GRANTED') {
    console.log('✅ VERIFICATION SUCCESSFUL');
    console.log('✅ Access token is valid');
    console.log('✅ Encryption/decryption working correctly');
    console.log('\nYour sovereign access configuration is ready!');
    process.exit(0);
} else if (result) {
    console.log('❌ VERIFICATION FAILED');
    console.log(`❌ Decrypted content: "${result}" (expected "GRANTED")`);
    process.exit(1);
} else {
    console.log('❌ VERIFICATION FAILED');
    console.log('❌ Could not decrypt token');
    console.log('❌ Please check your ACCESS_SECRET and NEXT_PUBLIC_ACCESS_TOKEN');
    process.exit(1);
}
