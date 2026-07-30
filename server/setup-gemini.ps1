# راه‌اندازی کلید Gemini بدون پاک کردن بقیه .env
# Usage: .\setup-gemini.ps1

Write-Host ""
Write-Host "=== فعال‌سازی Gemini برای ماکان ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. صفحه Google AI Studio باز می‌شود"
Write-Host "2. با حساب Google وارد شوید"
Write-Host "3. Create API Key بزنید و کلید را کپی کنید"
Write-Host ""

Start-Process "https://aistudio.google.com/apikey"

$apiKey = Read-Host "کلید Gemini را اینجا paste کنید"

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "کلید وارد نشد!" -ForegroundColor Red
    exit 1
}

$apiKey = $apiKey.Trim().Trim('"').Trim("'")
$envPath = Join-Path $PSScriptRoot ".env"

if (Test-Path $envPath) {
    $raw = Get-Content $envPath -Raw -Encoding UTF8
    if ($raw -match '(?m)^GEMINI_API_KEY=') {
        $raw = $raw -replace '(?m)^GEMINI_API_KEY=.*$', "GEMINI_API_KEY=$apiKey"
    } else {
        $raw = $raw.TrimEnd() + "`r`nGEMINI_API_KEY=$apiKey`r`n"
    }
    Set-Content -Path $envPath -Value $raw.TrimEnd() -Encoding UTF8
} else {
    @"
GEMINI_API_KEY=$apiKey
PORT=8080
GROQ_DISABLED=true
OLLAMA_DISABLED=true
JWT_SECRET=change-this-to-a-random-secret
ADMIN_PASSWORD=admin123
"@ | Set-Content -Path $envPath -Encoding UTF8
}

Write-Host ""
Write-Host "کلید ذخیره شد. سرور را ری‌استارت کنید:" -ForegroundColor Green
Write-Host "  cd server"
Write-Host "  npm run dev"
Write-Host ""
