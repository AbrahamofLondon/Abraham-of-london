@echo off
echo 🧩 Creating offline node_modules bundle...

REM Confirm package-lock.json exists
if not exist package-lock.json (
  echo ❌ Error: package-lock.json not found. Run "npm install" first.
  pause
  exit /b
)

REM Check if tar exists
tar --version >nul 2>&1
if errorlevel 1 (
  echo ❌ Error: tar is not installed or not on PATH.
  echo 👉 Install it via Git Bash or WSL, or manually use 7-Zip to create tar.gz.
  pause
  exit /b
)

REM Create archive
tar -czf offline-node-modules.tar.gz node_modules package-lock.json

echo ✅ offline-node-modules.tar.gz created successfully.
pause
