const { allShorts } = require('contentlayer/generated');
console.log('✅ SUCCESS! Found', allShorts.length, 'shorts');
console.log('First short:', allShorts[0]?.title || 'No shorts found');
