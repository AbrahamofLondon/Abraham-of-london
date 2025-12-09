// scripts/test-content.js
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

async function testBooks() {
  const booksDir = path.join(process.cwd(), 'content/books');
  
  try {
    const files = fs.readdirSync(booksDir);
    console.log(`Found ${files.length} book files`);
    
    for (const file of files) {
      const slug = file.replace(/\.mdx$/, '');
      console.log(`\nTesting: ${slug}`);
      
      const filePath = path.join(booksDir, file);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);
      
      console.log('Title:', data.title);
      console.log('Type:', data.type);
      console.log('Status:', data.status || 'not set');
      console.log('Draft:', data.draft || false);
      
      // Check required fields
      const required = ['title', 'slug', 'author', 'date', 'type'];
      const missing = required.filter(field => !data[field]);
      
      if (missing.length > 0) {
        console.error(`❌ Missing fields: ${missing.join(', ')}`);
      } else {
        console.log('✅ All required fields present');
      }
    }
  } catch (error) {
    console.error('Error reading books directory:', error);
  }
}

testBooks();