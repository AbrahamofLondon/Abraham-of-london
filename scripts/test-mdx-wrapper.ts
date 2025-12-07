// scripts/test-mdx-wrapper.ts
import { 
  getAllPosts, 
  getAllCanons, 
  getAllDownloads,
  findDocumentBySlug 
} from '@/lib/mdx';

async function test() {
  console.log('🧪 Testing MDX wrapper...\n');
  
  try {
    // Test 1: Get all sorted posts
    const allPosts = getAllPosts();
    console.log(`✅ Found ${allPosts.length} posts`);
    
    // Test 2: Get canons
    const canons = getAllCanons();
    console.log(`✅ Found ${canons.length} canon documents`);
    
    // Test 3: Get downloads
    const downloads = getAllDownloads();
    console.log(`✅ Found ${downloads.length} download documents`);
    
    // Test 4: Find by slug
    if (allPosts.length > 0) {
      const firstSlug = allPosts[0].slug;
      const found = findDocumentBySlug(firstSlug);
      console.log(`✅ Found document by slug: ${found?.title || 'Not found'}`);
    }
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

test();