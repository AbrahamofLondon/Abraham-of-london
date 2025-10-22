import os
import re

# --- Configuration ---
# Set the directory where your Next.js print pages are located
TARGET_DIR = "./pages/print"
# Define the project root for safety, change this if your script runs elsewhere
PROJECT_ROOT = "." 
# Define the fixes (Pattern to search for, Replacement string)
FIXES = [
    # 1. Remove the non-existent 'baseColor' prop (EmbossedBrandMark)
    (r'(\s*baseColor="transparent"\s*)', ''),
    # 2. Fix common unicode errors in JSX/HTML content
    (r'â€”', '—'),        # Em-dash
    (r'â€“', '–'),        # En-dash
    (r'â€™', "'"),        # Right single quote / Apostrophe
    (r'â€˜', "'"),        # Left single quote
    (r'â€œ', '"'),        # Left double quote
    (r'â€', '"'),        # Right double quote
    (r'Â©', '©'),        # Copyright symbol
    (r'â€¢', '•'),        # Bullet point
    (r'â€¦', '…'),        # Ellipsis
]
# File extensions to process
FILE_EXTENSIONS = ('.tsx', '.jsx')


def apply_fixes_to_file(filepath):
    """Applies all defined regex fixes to a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        
        # Apply all defined regex fixes
        for pattern, replacement in FIXES:
            # The 'baseColor' fix only needs to run once per component type, 
            # but using re.sub handles multiple occurrences robustly.
            content = re.sub(pattern, replacement, content)

        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed and updated: {filepath}")
            return True
        else:
            # print(f"➖ No changes needed: {filepath}")
            return False

    except FileNotFoundError:
        print(f"❌ Error: File not found at {filepath}")
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        
    return False


def run_comprehensive_fix():
    """Traverses the target directory and applies fixes to all relevant files."""
    
    if not os.path.isdir(TARGET_DIR):
        print(f"❌ Target directory not found: {TARGET_DIR}")
        return

    print(f"🚀 Starting script to fix files in: {TARGET_DIR}")
    files_processed = 0
    files_modified = 0

    for root, _, files in os.walk(TARGET_DIR):
        for filename in files:
            if filename.endswith(FILE_EXTENSIONS):
                filepath = os.path.join(root, filename)
                files_processed += 1
                if apply_fixes_to_file(filepath):
                    files_modified += 1

    print("\n-------------------------------------------")
    print(f"✨ Script complete.")
    print(f"Total files scanned: {files_processed}")
    print(f"Total files modified: {files_modified}")
    print("-------------------------------------------")


if __name__ == "__main__":
    run_comprehensive_fix()