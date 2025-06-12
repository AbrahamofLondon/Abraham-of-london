@echo off
REM Create a compressed archive of node_modules and package-lock.json
echo Bundling node_modules and package-lock.json into offline-node-modules.tar.gz...

tar -czf offline-node-modules.tar.gz node_modules package-lock.json

echo ✅ Done! You can now use offline-node-modules.tar.gz in your GitHub repo or CI pipeline.
pause
