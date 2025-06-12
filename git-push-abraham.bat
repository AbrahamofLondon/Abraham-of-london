@echo off
:: Batch Script: Push project files to GitHub from abraham-of-london folder

echo.
echo ==========================
echo   Abraham Git Push Tool
echo ==========================
echo.

:: Move into the project folder
cd abraham-of-london

:: Check if git is initialized
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo Git is not initialized in this folder. Running git init...
    git init
)

:: Set main as default branch (safe override)
git branch -M main
