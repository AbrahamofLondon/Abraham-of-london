@echo off
setlocal

REM --- CONFIGURATION ---
set "NODE_VERSION=18.18.2"
set "BUILD_HOOK_URL=https://api.netlify.com/build_hooks/YOUR-HOOK-ID"
set "GIT_COMMIT_MESSAGE=Automated build and deploy by Codex"
set "GITHUB_REMOTE=https://github.com/YOUR_USERNAME/YOUR_REPO.git"

REM --- ENV SETUP ---
echo Checking Node.js version...
node -v >nul 2>&1
IF ERRORLEVEL 1 (
    echo Node is not installed. Please install Node.js v%NODE_VERSION% and try again.
    pause
    exit /b
)

echo Installing dependencies...
IF EXIST package-lock.json (
    npm ci
) ELSE (
    npm install
)

REM --- BUILD PROJECT ---
echo Building project...
npm run build
IF ERRORLEVEL 1 (
    echo Build failed. Please check errors.
    pause
    exit /b
)

REM --- GIT OPERATIONS ---
echo Committing changes...
git add .
git commit -m "%GIT_COMMIT_MESSAGE%"
git push origin main

REM --- DEPLOY TO NETLIFY ---
echo Triggering Netlify build...
curl -X POST %BUILD_HOOK_URL%

echo.
echo ✅ Automation complete!
pause
