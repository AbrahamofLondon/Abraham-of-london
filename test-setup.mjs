// test-setup.mjs - Updated version
import { allShorts } from './.contentlayer/generated/index.mjs'; // Changed from 'contentlayer/generated'

console.log('✅ Configuration test successful!');
console.log(`Found ${allShorts.length} shorts`);
console.log('First short:', allShorts[0]?.title || 'No shorts found');