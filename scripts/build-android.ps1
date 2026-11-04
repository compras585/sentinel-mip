param(
  [Parameter(Mandatory=$true)]
  [string]$ApiBaseUrl
)
$ErrorActionPreference = "Stop"
if (-not $ApiBaseUrl.StartsWith("https://")) { throw "La URL de API debe usar HTTPS." }
if (-not $ApiBaseUrl.EndsWith("/")) { throw "La URL debe terminar en /api/." }
Push-Location (Join-Path $PSScriptRoot "..\android")
try {
  gradle :app:assembleDebug "-PSENTINEL_API_BASE_URL=$ApiBaseUrl"
  if ($LASTEXITCODE -ne 0) { throw "Gradle fallo al compilar Android." }
  $apk = Join-Path (Get-Location) "app\build\outputs\apk\debug\app-debug.apk"
  if (-not (Test-Path $apk)) { throw "Gradle termino sin encontrar app-debug.apk." }
  Write-Host "APK generada: $apk" -ForegroundColor Green
} finally { Pop-Location }
