// fix-all-coverImage-paths.js
import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const contentDirs = ['posts', 'books'];

contentDirs.forEach(dirName => {
  const dirPath = path.join(__dirname, 'content', dirName);

  fs.readdir(dirPath, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${dirPath}`, err);
      return;
    }

    files
      .filter((file) => file.endsWith('.mdx'))
      .forEach((file) => {
        const filePath = path.join(dirPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        const updatedContent = content.replace(
          /coverImage:\s*["']\/images\/(.*?)["']/,
          `coverImage: "/assets/images/$1"`
        );

        if (updatedContent !== content) {
          fs.writeFileSync(filePath, updatedContent);
          console.log(`Å“¦ Updated path in: ${file}`);
        }
      });
  });
});
