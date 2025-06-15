$javaPath = "C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot\bin"
$javaHome = "C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot"

# Add to current session
$env:Path += ";$javaPath"
$env:JAVA_HOME = $javaHome

# Add permanently for the user
[Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
[Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";$javaPath", "User")

Write-Host "Java environment variables have been set up. Please restart your terminal for changes to take effect." 