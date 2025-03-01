@echo off
setlocal enabledelayedexpansion

echo Searching for Node.js installation...
echo This may take a few minutes. Please be patient.
echo.

set "NODEJS_PATH="

:: Check common installation locations first
if exist "C:\Program Files\nodejs\node.exe" (
    set "NODEJS_PATH=C:\Program Files\nodejs"
    goto :found
)

if exist "C:\Program Files (x86)\nodejs\node.exe" (
    set "NODEJS_PATH=C:\Program Files (x86)\nodejs"
    goto :found
)

if exist "%APPDATA%\npm\npm.cmd" (
    set "NPM_PATH=%APPDATA%\npm"
)

:: Search in program files and other likely locations
for %%d in (
    "C:\Program Files"
    "C:\Program Files (x86)"
    "%LOCALAPPDATA%\Programs"
    "%USERPROFILE%"
) do (
    echo Searching in %%d...
    for /f "delims=" %%f in ('dir /b /s "%%d\node.exe" 2^>nul') do (
        echo Found: %%f
        set "NODEJS_PATH=%%~dpf"
        goto :found
    )
)

:notfound
echo Node.js installation not found automatically.
echo.
echo Please enter the path where Node.js is installed:
echo (Example: C:\Program Files\nodejs)
set /p NODEJS_PATH="Path: "

if not exist "!NODEJS_PATH!\node.exe" (
    echo The specified path does not contain node.exe
    echo Please make sure you entered the correct path.
    goto :notfound
)

:found
echo.
echo Node.js found at: !NODEJS_PATH!

:: Check if npm exists
if exist "!NODEJS_PATH!\npm.cmd" (
    echo npm found at: !NODEJS_PATH!\npm.cmd
) else (
    echo npm not found in the same directory as node.exe
    if defined NPM_PATH (
        echo but found npm at: !NPM_PATH!
    ) else (
        echo Searching for npm...
        for /f "delims=" %%f in ('dir /b /s "!NODEJS_PATH!\..\npm.cmd" 2^>nul') do (
            echo Found npm at: %%f
            set "NPM_PATH=%%~dpf"
        )
    )
)

echo.
echo Adding Node.js to PATH for this session...

set "PATH=!NODEJS_PATH!;%PATH%"
if defined NPM_PATH (
    set "PATH=!NPM_PATH!;%PATH%"
)

echo.
echo Testing Node.js and npm...
echo.

node -v
npm -v

echo.
if %ERRORLEVEL% NEQ 0 (
    echo Node.js or npm is not accessible. Please check your installation.
) else (
    echo Node.js and npm are now in your PATH for this session!
    echo.
    echo Would you like to add Node.js to your PATH permanently? (Y/N)
    set /p PERMANENT="Your choice: "
    
    if /i "!PERMANENT!"=="Y" (
        echo.
        echo Adding Node.js to PATH permanently...
        setx PATH "!NODEJS_PATH!;%PATH%" /M
        if defined NPM_PATH (
            setx PATH "!NPM_PATH!;%PATH%" /M
        )
        echo.
        echo Node.js has been added to your system PATH.
        echo Please restart your command prompt or PowerShell for the changes to take effect.
    ) else (
        echo.
        echo Node.js has been added to PATH for this session only.
    )
)

echo.
echo Press any key to continue...
pause > nul
endlocal 