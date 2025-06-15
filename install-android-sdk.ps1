# Install Android SDK components
$sdkmanager = "$env:ANDROID_SDK_ROOT\cmdline-tools\latest\bin\sdkmanager.bat"

# Accept licenses
Write-Host "Accepting Android SDK licenses..."
& "C:\Users\viaco\android-sdk\cmdline-tools\latest\bin\sdkmanager.bat" --licenses

# Install required components
Write-Host "Installing Android SDK components..."
& "C:\Users\viaco\android-sdk\cmdline-tools\latest\bin\sdkmanager.bat" `
    "platform-tools" `
    "platforms;android-33" `
    "build-tools;33.0.0" `
    "cmdline-tools;latest"

Write-Host "Android SDK components have been installed." 