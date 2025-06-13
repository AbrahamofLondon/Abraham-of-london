@echo off
cd /d "%~dp0"
echo Running Netlify auto-deploy from folder: %cd%
echo -----------------------------------------
call npm install
node deploy.js
echo.
echo ✅ Done. Check codex-log.txt for results.
pause