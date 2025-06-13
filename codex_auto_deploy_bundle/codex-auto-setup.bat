@echo off
setlocal

REM ===== CONFIGURATION =====
set "NODE_VERSION=18.18.0"
set "BUILD_HOOK_URL=https://api.netlify.com/build_hooks/684c730862a2c482c589aa5e"
set "GIT_COMMIT_MESSAGE=Automated build and deploy by Codex"
set "GITHUB_REMOTE=https://github.com/YOUR_USERNAME/YOUR_REPO.git"
set "LOG_FILE=codex-log.txt"

REM ===== CHECK ENVIRONMENT =====
echo [INFO] Checking Node.js installation...
node -v >nul 2>&1
IF ERRORLEVEL 1 (
    echo [ERROR] Node.js is not installed. Required version: %NODE_VERSION%
    pause
    exit /b
)

REM ===== INSTALL DEPENDENCIES =====
echo [INFO] Installing dependencies...
IF EXIST package-lock.json (
    npm ci
) ELSE (
    npm install
)

REM ===== BUILD PROJECT =====
echo [INFO] Building project...
npm run build
IF ERRORLEVEL 1 (
    echo [ERROR] Build failed. See project errors.
    echo [%date% %time%] Build failed >> %LOG_FILE%
    pause
    exit /b
)

REM ===== GIT OPERATIONS =====
echo [INFO] Committing and pushing to GitHub...
git add .
git commit -m "%GIT_COMMIT_MESSAGE%" >nul 2>&1
IF ERRORLEVEL 1 (
    echo [WARN] No changes to commit or commit failed.
) ELSE (
    git push origin main
    IF ERRORLEVEL 1 (
        echo [ERROR] Git push failed. Check credentials or network.
        echo [%date% %time%] Git push failed >> %LOG_FILE%
        pause
        exit /b
    )
)

REM ===== NETLIFY DEPLOY =====
echo [INFO] Triggering Netlify build...
curl -s -o nul -w "Status: %%{http_code}\n" -X POST %BUILD_HOOK_URL%
IF ERRORLEVEL 1 (
    echo [ERROR] Failed to trigger Netlify build.
    echo [%date% %time%] Netlify hook failed >> %LOG_FILE%
    pause
    exit /b
)

REM ===== SUCCESS LOG =====
echo [INFO] Automation complete!
echo [%date% %time%] Build and deploy successful >> %LOG_FILE%

exit /b
