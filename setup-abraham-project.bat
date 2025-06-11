@echo off
REM Create project folder and enter it
mkdir abraham-of-london
cd abraham-of-london

REM Initialize Git repository
git init

REM Create standard files
echo # Abraham of London Website > README.md
echo {} > package.json
echo node_modules/ > .gitignore

REM Optional: Create source folders
mkdir src
mkdir src\assets
mkdir src\styles
mkdir src\scripts
mkdir public
mkdir tests
mkdir .github
mkdir .github\workflows
mkdir docs

REM Initial commit setup
git add .
git commit -m "Initial project structure for Abraham of London website"

echo.
echo ✅ Setup complete. Now open this folder in VS Code or your editor.
pause
