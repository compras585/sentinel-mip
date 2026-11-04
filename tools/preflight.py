#!/usr/bin/env python3
"""Static preflight checks for Sentinel MIP; does not replace real builds/tests."""
from pathlib import Path
import json, re, sys
ROOT = Path(__file__).resolve().parents[1]
checks = []
def check(name, condition, detail):
    checks.append((name, bool(condition), detail))
backend = ROOT / "backend"
android = ROOT / "android"
pkg = json.loads((backend / "package.json").read_text())
schema = (backend / "prisma/schema.prisma").read_text()
migration = (backend / "prisma/migrations/20261104000000_refresh_sessions/migration.sql").read_text()
auth = (backend / "src/auth/auth.service.ts").read_text()
controller = (backend / "src/auth/auth.controller.ts").read_text()
inspections = (backend / "src/inspections/inspections.service.ts").read_text()
android_src = (android / "app/src/main/java/com/fumizaymas/sentinelmip/MainActivity.kt").read_text()
gradle = (android / "app/build.gradle.kts").read_text()
check("scripts backend", all(k in pkg["scripts"] for k in ("build","typecheck","test","test:integration")), "build/typecheck/test/test:integration")
check("refresh model y FK", "model RefreshSession" in schema and 'references: [id], onDelete: Cascade' in schema, "Prisma model + relación User")
check("migración refresh", all(x in migration for x in ('"RefreshSession"','"tokenHash"','"RefreshSession_userId_fkey"')), "tabla, hash único y FK")
check("endpoints auth", all(f"@Post('{x}')" in controller for x in ("login","refresh","logout")), "login/refresh/logout")
check("rotación de refresh", "updateMany" in auth and "tokenHash" in auth and "tokenUse" in auth, "hash almacenado y revocación condicional")
check("reset invalida sesiones", "refreshSession.updateMany" in (backend/"src/users/users.service.ts").read_text(), "revocación al restablecer contraseña")
check("stationKey seguro", "isStationUuid(dto.stationKey)" in inspections and "station-key.spec.ts" in str(list((backend/"src/inspections").glob("*.spec.ts"))), "UUID/código y prueba unitaria")
check("Android persiste ambos tokens", all(x in android_src for x in ("REFRESH_KEY","received.refresh","pair.refresh")), "access + refresh cifrados")
check("Android refresh ante 401", "SentinelApi.refresh(refresh)" in android_src and "UnauthorizedSyncException" in android_src, "renovación desde worker")
check("HTTPS obligatorio", 'startsWith("https://")' in gradle and 'endsWith("/")' in gradle, "validación URL base")
check("smoke test HTTP", (backend/"test/integration-smoke.cjs").exists(), "prueba de login/rotación/replay/logout")
check("workflow backend CI", (ROOT/".github/workflows/backend.yml").exists(), "typecheck/Jest/Nest build en GitHub Actions")
check("workflow Android CI", (ROOT/".github/workflows/android.yml").exists(), "Gradle 8.9 + Android SDK + APK debug artifact")
check("compose local", (ROOT/"docker-compose.dev.yml").exists(), "PostgreSQL + API para desarrollo")
app_gradle = (android/"app/build.gradle.kts").read_text()
root_gradle = (android/"build.gradle.kts").read_text()
check("Compose Compiler Kotlin 2", 'id("org.jetbrains.kotlin.plugin.compose")' in app_gradle and 'id("org.jetbrains.kotlin.plugin.compose") version "2.0.21"' in root_gradle, "plugin de Compose para Kotlin 2.0.21")
check("test de rotación transaccional", (backend/"src/auth/auth.service.spec.ts").exists() and "$transaction" in (backend/"src/auth/auth.service.ts").read_text(), "pruebas de replay y rotación atómica")
check("Android CI instala SDK 35", 'sdkmanager "platforms;android-35" "build-tools;35.0.0"' in (ROOT/".github/workflows/android.yml").read_text(), "instalación explícita de platform/build tools")
check("guía de compilación", (ROOT/"docs/guia-compilacion.md").exists(), "pasos GitHub Actions y Windows")
check("scripts PowerShell", all((ROOT/"scripts"/f).exists() for f in ("preflight.ps1","build-android.ps1","build-backend.ps1")), "preflight y build scripts Windows")
check("Docker build con DATABASE_URL", "ENV DATABASE_URL=" in (backend/"Dockerfile").read_text(), "Prisma generate durante Docker build")
for name, ok, detail in checks:
    print(("PASS" if ok else "FAIL") + " | " + name + " | " + detail)
print(f"RESULTADO: {sum(ok for _,ok,_ in checks)}/{len(checks)} verificaciones estáticas")
sys.exit(0 if all(ok for _,ok,_ in checks) else 1)
