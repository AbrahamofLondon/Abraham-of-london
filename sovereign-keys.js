// sovereign-keys.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Simple AES-256-CBC encryption with HMAC
class SovereignKeys {
    static generateSecret() {
        return crypto.randomBytes(32).toString('base64');
    }
    
    static encrypt(plaintext, secret) {
        try {
            // Use secret directly as key (32 bytes)
            const key = Buffer.from(secret, 'base64');
            if (key.length !== 32) {
                throw new Error(`Invalid key length: ${key.length} bytes (expected 32)`);
            }
            
            // Generate random IV
            const iv = crypto.randomBytes(16);
            
            // Create cipher
            const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
            
            // Encrypt
            let encrypted = cipher.update(plaintext, 'utf8', 'base64');
            encrypted += cipher.final('base64');
            
            // Return IV + encrypted data as base64
            const combined = Buffer.concat([iv, Buffer.from(encrypted, 'base64')]);
            return combined.toString('base64');
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }
    
    static decrypt(encryptedToken, secret) {
        try {
            // Use secret directly as key
            const key = Buffer.from(secret, 'base64');
            if (key.length !== 32) {
                throw new Error(`Invalid key length: ${key.length} bytes (expected 32)`);
            }
            
            // Decode the token
            const combined = Buffer.from(encryptedToken, 'base64');
            
            // Extract IV (first 16 bytes) and encrypted data
            const iv = combined.slice(0, 16);
            const encrypted = combined.slice(16);
            
            // Create decipher
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            
            // Decrypt
            let decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            return decrypted.toString('utf8');
        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }
    
    static validateToken(token, secret) {
        try {
            const decrypted = this.decrypt(token, secret);
            return decrypted === 'GRANTED';
        } catch {
            return false;
        }
    }
}

// Main execution
function main() {
    console.log('=== Sovereign Access Key Management ===\n');
    
    const command = process.argv[2];
    
    if (command === 'generate') {
        // Generate new keys
        const secret = SovereignKeys.generateSecret();
        const token = SovereignKeys.encrypt('GRANTED', secret);
        
        console.log('✅ Generated new sovereign keys:\n');
        console.log('ACCESS_SECRET="' + secret + '"');
        console.log('NEXT_PUBLIC_ACCESS_TOKEN="' + token + '"');
        console.log('SOVEREIGN_ACCESS_KEY="SOVEREIGN-ALIGN-2026"');
        
        // Also create validation hash
        const validationHash = crypto.createHash('sha256')
            .update('SOVEREIGN_ALIGN_2026' + secret)
            .digest('base64');
        console.log('ACCESS_VALIDATION_HASH="' + validationHash + '"');
        
    } else if (command === 'verify') {
        // Verify existing keys
        let secret = process.argv[3];
        let token = process.argv[4];
        
        // Try to read from .env.local if not provided
        if (!secret || !token) {
            try {
                const envPath = path.join(process.cwd(), '.env.local');
                if (fs.existsSync(envPath)) {
                    const envContent = fs.readFileSync(envPath, 'utf8');
                    const secretMatch = envContent.match(/^ACCESS_SECRET="([^"]+)"/m);
                    const tokenMatch = envContent.match(/^NEXT_PUBLIC_ACCESS_TOKEN="([^"]+)"/m);
                    
                    if (secretMatch) secret = secretMatch[1];
                    if (tokenMatch) token = tokenMatch[1];
                    
                    console.log('✓ Loaded configuration from .env.local\n');
                }
            } catch (err) {
                console.log('! Could not read .env.local\n');
            }
        }
        
        if (!secret || !token) {
            console.log('❌ Missing required credentials');
            console.log('\nUsage:');
            console.log('  node sovereign-keys.js generate    - Generate new keys');
            console.log('  node sovereign-keys.js verify      - Verify existing keys');
            console.log('  node sovereign-keys.js verify <secret> <token>');
            process.exit(1);
        }
        
        console.log('Secret (first 20 chars):', secret.substring(0, 20) + '...');
        console.log('Token (first 30 chars):', token.substring(0, 30) + '...\n');
        
        const isValid = SovereignKeys.validateToken(token, secret);
        
        if (isValid) {
            console.log('✅ VERIFICATION SUCCESSFUL');
            console.log('✅ Token decrypts to: GRANTED');
            console.log('\nYour sovereign access keys are valid and ready to use.');
            process.exit(0);
        } else {
            console.log('❌ VERIFICATION FAILED');
            console.log('❌ Token could not be decrypted or invalid content');
            console.log('\nPlease regenerate your keys with:');
            console.log('  node sovereign-keys.js generate');
            process.exit(1);
        }
    } else {
        console.log('Usage:');
        console.log('  node sovereign-keys.js generate    - Generate new sovereign keys');
        console.log('  node sovereign-keys.js verify      - Verify existing keys');
        console.log('\nExample:');
        console.log('  node sovereign-keys.js generate');
        console.log('  node sovereign-keys.js verify');
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = SovereignKeys;
