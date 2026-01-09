// build.js - ContentLayer2 build script for Windows
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔨 Building with ContentLayer2...');

try {
    // Check if contentlayer2 is installed
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasContentlayer2 = packageJson.dependencies?.contentlayer2 || packageJson.devDependencies?.contentlayer2;
    
    if (!hasContentlayer2) {
        console.error('❌ contentlayer2 not found in package.json');
        console.log('Installing contentlayer2...');
        execSync('npm install contentlayer2', { stdio: 'inherit' });
    }
    
    // Clear cache
    const cacheDirs = ['.contentlayer', '.next/cache/contentlayer'];
    cacheDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
            console.log(`Cleared: ${dir}`);
        }
    });
    
    // Try to run contentlayer2 build
    console.log('Running build...');
    
    // Method 1: Try npx with contentlayer2
    try {
        execSync('npx contentlayer2 build', { stdio: 'inherit' });
    } catch (error1) {
        console.log('Method 1 failed, trying Method 2...');
        
        // Method 2: Direct node execution
        const { build } = require('contentlayer2');
        
        const configPath = path.resolve(process.cwd(), 'contentlayer.config.ts');
        if (!fs.existsSync(configPath)) {
            throw new Error(`Config not found: ${configPath}`);
        }
        
        console.log(`Using config: ${configPath}`);
        
        // This runs the build programmatically
        build({ configPath }).then(() => {
            console.log('✅ ContentLayer2 build successful!');
        }).catch(err => {
            console.error('❌ Build failed:', err.message);
            process.exit(1);
        });
    }
    
} catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
}
