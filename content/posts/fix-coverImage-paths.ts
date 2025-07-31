// fix-coverImage-paths.ts
import fs from 'fs';
import path from 'path';

const postsDir = path.join(__dirname, 'content', 'posts');

fs.readdir(postsDir, (err, files) => {
  if (err) throw err;

  files
    .filter((file) => file.endsWith('.mdx'))
    .forEach((file) => {
      const filePath = path.join(postsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      const updated = content.replace(
        /coverImage:\s*["']\/images\/blog\/(.*?)["']/,
        'coverImage: "/assets/images/$1"'
      );

      if (updated !== content) {
        fs.writeFileSync(filePath, updated);
        console.log(`✅ Updated: ${file}`);
      }
    });
});
