# fix-line-endings.sh

echo "Converting line endings to LF..."

# Find all text files and convert to LF
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" -o -name "*.mdx" -o -name "*.yml" -o -name "*.yaml" | while read file; do
    if [ -f "$file" ]; then
        dos2unix "$file" 2>/dev/null || sed -i 's/\r$//' "$file"
        echo "Converted: $file"
    fi
done

echo "Line ending conversion complete!"