@echo off
echo This script will add Node.js to your PATH environment variable.
echo You need to know the location where Node.js is installed.
echo.

set /p NODEJS_PATH="Enter the Node.js installation path (e.g., C:\Program Files\nodejs): "

if not exist "%NODEJS_PATH%\node.exe" (
    echo ERROR: node.exe not found in the specified directory.
    echo Please make sure you entered the correct path.
    goto :end
)

:: Add to PATH for current session
set "PATH=%NODEJS_PATH%;%PATH%"
echo Node.js added to PATH for this session.

:: Test if it works
echo.
echo Testing Node.js...
node -v
if %ERRORLEVEL% NEQ 0 (
    echo Failed to run node. Please check your installation.
    goto :end
)

echo.
echo Testing npm...
npm -v
if %ERRORLEVEL% NEQ 0 (
    echo Failed to run npm. Please check your installation.
    goto :end
)

echo.
echo Node.js is working correctly in this session.
echo.

echo Would you like to add Node.js to PATH permanently? (Y/N)
set /p PERMANENT="Your choice: "

if /i "%PERMANENT%"=="Y" (
    echo.
    echo Adding Node.js to system PATH permanently...
    setx PATH "%NODEJS_PATH%;%PATH%" /M
    
    echo.
    echo Node.js has been added to your system PATH.
    echo Please restart your command prompt for the changes to take effect.
) else (
    echo.
    echo Node.js is only added to PATH for this session.
)

:end
echo.
echo Press any key to exit...
pause > nul 