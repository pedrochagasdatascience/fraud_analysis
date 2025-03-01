# PowerShell script to find Node.js and add it to PATH

Write-Host "Searching for Node.js installation..." -ForegroundColor Cyan
Write-Host "This may take a few moments. Please be patient." -ForegroundColor Cyan
Write-Host ""

$nodejsPath = $null
$npmPath = $null

# Check common installation locations first
$commonPaths = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\nodejs\node.exe",
    "$env:ProgramFiles\nodejs\node.exe"
)

foreach ($path in $commonPaths) {
    if (Test-Path $path) {
        $nodejsPath = Split-Path -Parent $path
        Write-Host "Found Node.js at: $nodejsPath" -ForegroundColor Green
        break
    }
}

# If not found in common locations, search more broadly
if (-not $nodejsPath) {
    Write-Host "Searching in Program Files directories..." -ForegroundColor Yellow
    
    $searchDirs = @(
        "C:\Program Files",
        "C:\Program Files (x86)",
        "$env:LOCALAPPDATA\Programs",
        "$env:USERPROFILE"
    )
    
    foreach ($dir in $searchDirs) {
        if (Test-Path $dir) {
            Write-Host "Searching in $dir..." -ForegroundColor Yellow
            $nodeExe = Get-ChildItem -Path $dir -Filter "node.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
            
            if ($nodeExe) {
                $nodejsPath = $nodeExe.DirectoryName
                Write-Host "Found Node.js at: $nodejsPath" -ForegroundColor Green
                break
            }
        }
    }
}

# If still not found, ask for manual input
if (-not $nodejsPath) {
    Write-Host "Node.js installation not found automatically." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please enter the path where Node.js is installed:"
    Write-Host "(Example: C:\Program Files\nodejs)" -ForegroundColor Yellow
    
    $manualPath = Read-Host "Path"
    
    if (Test-Path "$manualPath\node.exe") {
        $nodejsPath = $manualPath
    } else {
        Write-Host "The specified path does not contain node.exe" -ForegroundColor Red
        Write-Host "Please make sure Node.js is installed correctly." -ForegroundColor Red
        exit 1
    }
}

# Check for npm
if (Test-Path "$nodejsPath\npm.cmd") {
    Write-Host "npm found at: $nodejsPath\npm.cmd" -ForegroundColor Green
} else {
    Write-Host "npm not found in the same directory as node.exe" -ForegroundColor Yellow
    
    # Check in AppData
    $appDataNpm = "$env:APPDATA\npm"
    if (Test-Path "$appDataNpm\npm.cmd") {
        Write-Host "Found npm at: $appDataNpm" -ForegroundColor Green
        $npmPath = $appDataNpm
    } else {
        Write-Host "Searching for npm..." -ForegroundColor Yellow
        $npmCmd = Get-ChildItem -Path (Split-Path -Parent $nodejsPath) -Filter "npm.cmd" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        
        if ($npmCmd) {
            $npmPath = $npmCmd.DirectoryName
            Write-Host "Found npm at: $npmPath" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "Adding Node.js to PATH for this session..." -ForegroundColor Cyan

# Add to PATH for this session
$env:Path = "$nodejsPath;$env:Path"
if ($npmPath) {
    $env:Path = "$npmPath;$env:Path"
}

# Test Node.js and npm
Write-Host ""
Write-Host "Testing Node.js and npm..." -ForegroundColor Cyan
Write-Host ""

try {
    $nodeVersion = node -v
    $npmVersion = npm -v
    
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Node.js and npm are now in your PATH for this session!" -ForegroundColor Green
    
    # Ask about permanent addition
    Write-Host ""
    $permanent = Read-Host "Would you like to add Node.js to your PATH permanently? (Y/N)"
    
    if ($permanent -eq "Y" -or $permanent -eq "y") {
        Write-Host ""
        Write-Host "Adding Node.js to PATH permanently..." -ForegroundColor Cyan
        
        # Add to system PATH permanently
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
        $newPath = "$nodejsPath;$currentPath"
        if ($npmPath) {
            $newPath = "$npmPath;$newPath"
        }
        
        [Environment]::SetEnvironmentVariable("PATH", $newPath, "Machine")
        
        Write-Host ""
        Write-Host "Node.js has been added to your system PATH." -ForegroundColor Green
        Write-Host "Please restart your PowerShell or Command Prompt for the changes to take effect." -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "Node.js has been added to PATH for this session only." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error: Node.js or npm is not accessible. Please check your installation." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 