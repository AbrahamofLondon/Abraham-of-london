// scripts/check-libreoffice.js
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkLibreOffice() {
    console.log('🔍 Checking for LibreOffice...');
    
    // Common paths to check (Windows)
    const commonPaths = [
        'soffice',
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
        'libreoffice',
        '/usr/bin/libreoffice',
        '/Applications/LibreOffice.app/Contents/MacOS/soffice'
    ];
    
    for (const path of commonPaths) {
        try {
            const command = `"${path}" --version`;
            const { stdout, stderr } = await execAsync(command, { timeout: 5000 });
            
            const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
            const version = versionMatch ? versionMatch[1] : 'unknown';
            
            console.log(`✅ LibreOffice found at: ${path}`);
            console.log(`📦 Version: ${version}`);
            
            // Test PDF conversion capability
            console.log(`🔄 Testing PDF conversion capability...`);
            
            return { 
                available: true, 
                path, 
                version,
                platform: process.platform
            };
            
        } catch (error) {
            // Path not found or LibreOffice not working
            continue;
        }
    }
    
    console.log('❌ LibreOffice not found or not working');
    console.log('💡 Installation options:');
    console.log('   • Windows: https://www.libreoffice.org/download/download/');
    console.log('   • macOS: brew install libreoffice');
    console.log('   • Linux: sudo apt install libreoffice');
    
    return { available: false };
}

checkLibreOffice().then(result => {
    if (result.available) {
        console.log('\n🎉 LibreOffice is ready for PDF generation!');
        console.log('💡 Use with: --use-libreoffice --libreoffice-path "' + result.path + '"');
    } else {
        console.log('\n⚠️  PDF generation will use built-in pdf-lib instead');
    }
    process.exit(result.available ? 0 : 1);
}).catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
