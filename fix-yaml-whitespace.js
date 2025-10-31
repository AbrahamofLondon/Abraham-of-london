// fix-yaml-whitespace.js

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

// Define the directory where your content files live
const contentDir = path.join(__dirname, "content");
// Define the file extensions to process
const extensions = [".md", ".mdx"];

console.log("--- Content Frontmatter Cleanup Script ---");

// Recursive function to get all files in a directory
function getFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else if (extensions.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  }
  return files;
}

// Function to process a single file
function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // Use gray-matter to parse the frontmatter
  const file = matter(content);

  if (file.data && Object.keys(file.data).length > 0) {
    // Re-stringify the frontmatter data to eliminate whitespace issues
    // We ensure all string values are trimmed before writing them back
    const newFrontmatterData = {};
    for (const key in file.data) {
      let value = file.data[key];
      if (typeof value === "string") {
        // Trim trailing and leading whitespace from string values
        value = value.trim();
      }
      newFrontmatterData[key] = value;
    }

    // Reconstruct the file with the cleaned frontmatter
    const newContent = matter.stringify(file.content, newFrontmatterData, {
      // Set delimiters for frontmatter block (necessary for Contentlayer compatibility)
      delimiters: "---",
    });

    // Check if content changed before writing
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      console.log(
        `✅ Fixed frontmatter whitespace: ${path.basename(filePath)}`,
      );
      return true;
    }
  }
  return false;
}

try {
  const allFiles = getFiles(contentDir);
  let filesFixedCount = 0;

  for (const filePath of allFiles) {
    if (processFile(filePath)) {
      filesFixedCount++;
    }
  }

  if (filesFixedCount > 0) {
    console.log(
      `\n Successfully fixed whitespace in ${filesFixedCount} files.`,
    );
    console.log("Run 'npm run build' now to check for other errors.");
  } else {
    console.log("\n No frontmatter changes were needed.");
  }
} catch (error) {
  console.error(
    `\n❌ An error occurred during file processing: ${error.message}`,
  );
}

console.log("--------------------------------------");
