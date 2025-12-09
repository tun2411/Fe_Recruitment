@echo off
echo ========================================
echo Fixing @angular-devkit/build-angular
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Removing node_modules and package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f /q package-lock.json
echo Done.
echo.

echo Step 2: Cleaning npm cache...
call npm cache clean --force
echo Done.
echo.

echo Step 3: Installing dependencies...
call npm install --legacy-peer-deps
echo Done.
echo.

echo Step 4: Verifying installation...
if exist "node_modules\@angular-devkit\build-angular\package.json" (
    echo SUCCESS: @angular-devkit/build-angular is installed!
) else (
    echo ERROR: @angular-devkit/build-angular is NOT installed!
    echo Attempting to install it directly...
    call npm install @angular-devkit/build-angular@20.0.0 --save-dev --legacy-peer-deps
)

echo.
echo ========================================
echo Done! Please try running 'npm start' again.
echo ========================================
pause
