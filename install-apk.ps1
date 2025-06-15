# APK Installation Script for Android Devices
param(
    [Parameter(Mandatory=$true)]
    [string]$ApkPath
)

$adb = "$env:USERPROFILE\android-sdk\platform-tools\adb.exe"

Write-Host "Android APK Installer" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green

# Check if ADB exists
if (-not (Test-Path $adb)) {
    Write-Host "Error: ADB not found at $adb" -ForegroundColor Red
    Write-Host "Please run the Android setup script first." -ForegroundColor Yellow
    exit 1
}

# Check if APK file exists
if (-not (Test-Path $ApkPath)) {
    Write-Host "Error: APK file not found at $ApkPath" -ForegroundColor Red
    exit 1
}

# Check for connected devices
Write-Host "Checking for connected devices..." -ForegroundColor Yellow
$devices = & $adb devices
Write-Host $devices

if ($devices -match "device$") {
    Write-Host "Device found! Installing APK..." -ForegroundColor Green
    
    # Install the APK
    Write-Host "Installing: $ApkPath" -ForegroundColor Cyan
    & $adb install $ApkPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "APK installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Installation failed. Check the error messages above." -ForegroundColor Red
    }
} else {
    Write-Host "No device found. Please:" -ForegroundColor Red
    Write-Host "1. Connect your phone via USB" -ForegroundColor White
    Write-Host "2. Enable Developer Options on your phone:" -ForegroundColor White
    Write-Host "   - Go to Settings > About phone" -ForegroundColor Gray
    Write-Host "   - Tap 'Build number' 7 times" -ForegroundColor Gray
    Write-Host "3. Enable USB Debugging:" -ForegroundColor White
    Write-Host "   - Go to Settings > Developer options" -ForegroundColor Gray
    Write-Host "   - Turn on 'USB debugging'" -ForegroundColor Gray
    Write-Host "4. Accept the USB debugging prompt on your phone" -ForegroundColor White
}

Write-Host "`nUsage: .\install-apk.ps1 -ApkPath 'path\to\your\app.apk'" -ForegroundColor Cyan 