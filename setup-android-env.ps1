# Set up Android development environment variables
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot"
$androidSdkRoot = "$env:USERPROFILE\android-sdk"
$androidCmdlineTools = "$androidSdkRoot\cmdline-tools\latest\bin"
$androidPlatformTools = "$androidSdkRoot\platform-tools"

# Add to current session
$env:ANDROID_SDK_ROOT = $androidSdkRoot
$env:Path += ";$androidCmdlineTools;$androidPlatformTools"

# Add permanently for the user
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $androidSdkRoot, "User")
[Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";$androidCmdlineTools;$androidPlatformTools", "User")

# Create a permanent environment variable
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', $env:JAVA_HOME, [System.EnvironmentVariableTarget]::User)

Write-Host "Android SDK environment variables have been set up. Please restart your terminal for changes to take effect." 