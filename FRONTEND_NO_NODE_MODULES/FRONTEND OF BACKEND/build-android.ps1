# Build Android APK Script
# This script builds the mobile app and then compiles the Android APK

Write-Host "Building mobile web app..." -ForegroundColor Cyan
bun run build:mobile

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Inject API URL into built index.html for mobile
Write-Host "Injecting API URL into built files..." -ForegroundColor Cyan
$apiUrl = $env:VITE_API_BASE_URL
if (-not $apiUrl) {
    # Try reading from .env file
    if (Test-Path ".env") {
        $envContent = Get-Content ".env" -Raw
        if ($envContent -match "VITE_API_BASE_URL=(.+)") {
            $apiUrl = $matches[1].Trim()
        }
    }
}

if ($apiUrl) {
    $indexHtmlPath = "dist/index.html"
    if (Test-Path $indexHtmlPath) {
        $content = Get-Content $indexHtmlPath -Raw
        # Replace both placeholder and any old IP addresses
        $content = $content -replace "%%API_URL%%", $apiUrl
        # Also replace any hardcoded old IPs (e.g., 192.168.1.8 -> new IP)
        if ($apiUrl -match "http://(\d+\.\d+\.\d+\.\d+):") {
            $newIp = $matches[1]
            $content = $content -replace "http://192\.168\.\d+\.\d+:8081", $apiUrl
        }
        Set-Content $indexHtmlPath -Value $content -NoNewline
        Write-Host "✅ Injected API URL: $apiUrl" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Warning: dist/index.html not found" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Warning: VITE_API_BASE_URL not set. Using placeholder." -ForegroundColor Yellow
}

Write-Host "Syncing Capacitor..." -ForegroundColor Cyan
bunx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "Capacitor sync failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Building Android APK..." -ForegroundColor Cyan
Set-Location android
.\gradlew.bat assembleDebug

if ($LASTEXITCODE -ne 0) {
    Write-Host "APK build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..
Write-Host "`n✅ APK build successful!" -ForegroundColor Green
Write-Host "APK location: android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Yellow


