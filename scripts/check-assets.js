const fs = require('fs');
const path = require('path');

const assetDirs = [
  'assets',
  path.join('aol-site', 'assets'),
  path.join('aol-site', 'src', 'assets'),
];

const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.mp3', '.wav', '.ogg', '.mp4'];

function findAssets(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(findAssets(fullPath));
    } else if (assetExtensions.includes(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  let assets = [];
  for (const dir of assetDirs) {
    assets = assets.concat(findAssets(dir));
  }

  if (assets.length === 0) {
    console.log('No asset files found.');
    return;
  }

  let hasIssue = false;
  for (const file of assets) {
    const { size } = fs.statSync(file);
    const lower = path.basename(file).toLowerCase();
    if (size === 0 || lower.includes('placeholder') || lower.includes('sample')) {
      console.warn(`Potential placeholder or empty file: ${file}`);
      hasIssue = true;
    }
  }

  if (hasIssue) {
    console.error('Asset check completed with warnings. Please replace placeholders with real assets.');
    process.exitCode = 1;
  } else {
    console.log('All assets look valid.');
  }
}

main();
