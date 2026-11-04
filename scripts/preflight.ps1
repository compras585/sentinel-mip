$ErrorActionPreference = "Stop"
Write-Host "== Sentinel MIP: prevalidacion ==" -ForegroundColor Cyan
python .\tools\preflight.py
if ($LASTEXITCODE -ne 0) { throw "La prevalidacion encontro errores." }
Write-Host "Prevalidacion terminada." -ForegroundColor Green
