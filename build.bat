@echo off
REM build.bat - Windows CMD build script
REM Save this as build.bat in your project root

echo Setting build environment...
set CI=false
set NEXT_DISABLE_ESLINT=1
set NEXT_DISABLE_TYPECHECK=1
set NODE_ENV=production

echo Cleaning previous build...
if exist ".next" rmdir /s /q ".next"
if exist ".contentlayer" rmdir /s /q ".contentlayer"

echo Building Contentlayer...
call pnpm run content:build
if %errorlevel% neq 0 (
    echo Contentlayer build failed
    pause
    exit /b %errorlevel%
)

echo Building Next.js...
call next build
if %errorlevel% neq 0 (
    echo Next.js build failed
    pause
    exit /b %errorlevel%
)

echo Build complete!
pause