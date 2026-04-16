// Test script for the unified image resolver
const { resolveDocCoverImage, FALLBACK_IMAGES } = require('./lib/image-resolver');

console.log('Testing Unified Image Resolver\n');

// Test cases
const testCases = [
  {
    name: 'Blog with coverImage',
    doc: { coverImage: '/assets/images/blog/test.jpg', title: 'Test Blog' },
    expected: '/assets/images/blog/test.jpg'
  },
  {
    name: 'Blog with image field',
    doc: { image: '/assets/images/blog/another.jpg', title: 'Test Blog' },
    expected: '/assets/images/blog/another.jpg'
  },
  {
    name: 'Blog with object coverImage',
    doc: { coverImage: { src: '/assets/images/blog/object.jpg' }, title: 'Test Blog' },
    expected: '/assets/images/blog/object.jpg'
  },
  {
    name: 'Blog with no image (should use BLOG fallback)',
    doc: { title: 'Test Blog' },
    expected: FALLBACK_IMAGES.BLOG
  },
  {
    name: 'Book with coverImage',
    doc: { coverImage: '/assets/images/books/test.jpg', title: 'Test Book' },
    expected: '/assets/images/books/test.jpg'
  },
  {
    name: 'Book with no image (should use BOOK fallback)',
    doc: { title: 'Test Book' },
    expected: FALLBACK_IMAGES.BOOK
  },
  {
    name: 'Canon with coverImage',
    doc: { coverImage: '/assets/images/canon/test.jpg', title: 'Test Canon' },
    expected: '/assets/images/canon/test.jpg'
  },
  {
    name: 'Canon with no image (should use CANON fallback)',
    doc: { title: 'Test Canon' },
    expected: FALLBACK_IMAGES.CANON
  },
  {
    name: 'Remote URL (should be returned as-is)',
    doc: { coverImage: 'https://images.unsplash.com/photo-test', title: 'Test' },
    expected: 'https://images.unsplash.com/photo-test'
  },
  {
    name: 'Local path without leading slash (should be normalized)',
    doc: { coverImage: 'assets/images/test.jpg', title: 'Test' },
    expected: '/assets/images/test.jpg'
  }
];

// Run tests
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  
  try {
    const result = resolveDocCoverImage(testCase.doc, { 
      contentType: testCase.name.includes('Blog') ? 'BLOG' : 
                   testCase.name.includes('Book') ? 'BOOK' :
                   testCase.name.includes('Canon') ? 'CANON' : undefined
    });
    
    if (result === testCase.expected) {
      console.log(`  ✓ PASS: Got "${result}"`);
      passed++;
    } else {
      console.log(`  ✗ FAIL: Expected "${testCase.expected}", got "${result}"`);
      failed++;
    }
  } catch (error) {
    console.log(`  ✗ ERROR: ${error.message}`);
    failed++;
  }
  
  console.log('');
});

console.log(`\nSummary: ${passed} passed, ${failed} failed`);

// Test fallback images
console.log('\nFallback Images:');
Object.entries(FALLBACK_IMAGES).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});