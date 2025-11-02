#!/bin/bash

# --- Configuration ---
COMMIT_MESSAGE="feat: Refactor and clean up build scripts and print routes"
POST_COMMIT_COMMAND="npm run build" # <-- CHANGE THIS to the actual command you need to run

echo "Starting Git operations..."

# 1. Add all modified and untracked files
echo "Staging all modified and untracked files..."
git add -A

# Check if there's anything to commit
if git diff --cached --quiet; then
    echo "No changes detected after staging. Skipping commit."
else
    # 2. Commit the staged changes
    echo "Committing changes with message: \"$COMMIT_MESSAGE\""
    git commit -m "$COMMIT_MESSAGE"
    
    # Check commit status
    if [ $? -eq 0 ]; then
        echo "✅ Commit successful."
    else
        echo "❌ Git commit failed. Exiting."
        exit 1
    fi
fi

# 3. Run the post-commit command
echo "----------------------------------------"
echo "Running post-commit command: $POST_COMMIT_COMMAND"
$POST_COMMIT_COMMAND

if [ $? -eq 0 ]; then
    echo "✅ Command finished successfully."
else
    echo "❌ Command failed. Check output above."
    exit 1
fi