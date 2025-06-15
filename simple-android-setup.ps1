# Simple Android Development Environment Setup Script

Write-Host "Setting up Android Development Environment..." -ForegroundColor Green

# 1. Set up Java environment
$javaPath = "C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot\bin"
$javaHome = "C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot"

if (Test-Path $javaHome) {
    Write-Host "Setting up Java environment..." -ForegroundColor Yellow
    $env:Path += ";$javaPath"
    $env:JAVA_HOME = $javaHome
    Write-Host "Java environment configured." -ForegroundColor Green
} else {
    Write-Host "Java not found. Please install OpenJDK 17 first." -ForegroundColor Red
    exit 1
}

# 2. Clean up and create Android SDK directory
$androidSdkRoot = "$env:USERPROFILE\android-sdk"
Write-Host "Setting up Android SDK directory..." -ForegroundColor Yellow

if (Test-Path $androidSdkRoot) {
    Remove-Item -Path $androidSdkRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $androidSdkRoot -Force | Out-Null

# 3. Download Android Command Line Tools to temp directory
$tempDir = "$env:TEMP\android-setup"
$cmdlineToolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-10406996_latest.zip"
$zipPath = "$tempDir\cmdline-tools.zip"

if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Host "Downloading Android Command Line Tools..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $cmdlineToolsUrl -OutFile $zipPath -UseBasicParsing
    Write-Host "Download completed." -ForegroundColor Green
} catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    exit 1
}

# 4. Extract command line tools
Write-Host "Extracting command line tools..." -ForegroundColor Yellow
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $tempDir)
    
    # Create the correct directory structure
    New-Item -ItemType Directory -Path "$androidSdkRoot\cmdline-tools" -Force | Out-Null
    Move-Item -Path "$tempDir\cmdline-tools" -Destination "$androidSdkRoot\cmdline-tools\latest" -Force
    
    Write-Host "Extraction completed." -ForegroundColor Green
} catch {
    Write-Host "Extraction failed: $_" -ForegroundColor Red
    exit 1
}

# 5. Set up environment variables
$androidCmdlineTools = "$androidSdkRoot\cmdline-tools\latest\bin"
$androidPlatformTools = "$androidSdkRoot\platform-tools"

$env:ANDROID_SDK_ROOT = $androidSdkRoot
$env:Path += ";$androidCmdlineTools;$androidPlatformTools"

Write-Host "Environment variables configured." -ForegroundColor Green

# 6. Accept licenses and install SDK components
Write-Host "Installing Android SDK components..." -ForegroundColor Yellow

$sdkmanager = "$androidSdkRoot\cmdline-tools\latest\bin\sdkmanager.bat"

if (Test-Path $sdkmanager) {
    # Accept licenses
    Write-Host "Accepting SDK licenses..." -ForegroundColor Yellow
    echo "y" | & $sdkmanager --licenses 2>$null
    
    # Install components
    Write-Host "Installing SDK components..." -ForegroundColor Yellow
    & $sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0" "cmdline-tools;latest"
    
    Write-Host "SDK components installed." -ForegroundColor Green
} else {
    Write-Host "SDK Manager not found at: $sdkmanager" -ForegroundColor Red
    Write-Host "Checking directory structure..." -ForegroundColor Yellow
    Get-ChildItem -Path "$androidSdkRoot\cmdline-tools" -Recurse | Select-Object FullName
    exit 1
}

# 7. Verify ADB installation
$adb = "$androidSdkRoot\platform-tools\adb.exe"
if (Test-Path $adb) {
    Write-Host "ADB installed successfully." -ForegroundColor Green
    Write-Host "ADB location: $adb" -ForegroundColor Cyan
} else {
    Write-Host "ADB not found. Installation may have failed." -ForegroundColor Red
}

# Clean up temp directory
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "`nSetup completed!" -ForegroundColor Green
Write-Host "Please restart your terminal for environment variables to take effect." -ForegroundColor Yellow
Write-Host "`nTo use ADB:" -ForegroundColor Cyan
Write-Host "1. Connect your phone via USB" -ForegroundColor White
Write-Host "2. Enable Developer Options and USB Debugging on your phone" -ForegroundColor White
Write-Host "3. Run: adb devices" -ForegroundColor White
Write-Host "4. To install an APK: adb install path\to\your.apk" -ForegroundColor White 