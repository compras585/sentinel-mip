$ErrorActionPreference = "Stop"
Push-Location (Join-Path $PSScriptRoot "..\backend")
try {
  npm install
  if ($LASTEXITCODE -ne 0) { throw "npm install fallo." }
  npm run prisma:generate
  if ($LASTEXITCODE -ne 0) { throw "Prisma generate fallo." }
  npm run typecheck
  if ($LASTEXITCODE -ne 0) { throw "TypeScript typecheck fallo." }
  npm test
  if ($LASTEXITCODE -ne 0) { throw "Jest fallo." }
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Nest build fallo." }
  Write-Host "Backend compilado correctamente." -ForegroundColor Green
} finally { Pop-Location }
