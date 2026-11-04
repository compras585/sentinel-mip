# Sentinel MIP — Etapa 1.9: prevalidación reproducible

## Qué se entrega
- `tools/preflight.py`: auditoría estática de 11 condiciones clave del backend, migración, auth, estaciones, integración Android y URL HTTPS.
- Android ahora exige `SENTINEL_API_BASE_URL` con esquema HTTPS y barra final. El valor por defecto es un dominio reservado de ejemplo: no es un servidor real. Configurar la URL real antes de compilar.
- Versión de aplicación actualizada a 1.9.0.
- Esta etapa registra el estado real del entorno de validación y los pasos para completar el build.

## Resultado ejecutado en este entorno
- Prevalidación estática: **11/11 PASS**.
- Integridad del ZIP: verificada al empaquetar.
- Java 21 y Node.js 22 disponibles.
- Gradle no está instalado y no hay Gradle Wrapper en el starter.
- PostgreSQL/`psql` no está disponible.
- `npm install --ignore-scripts --no-audit --no-fund` excedió el límite de tiempo de ejecución; por eso no se pudieron ejecutar TypeScript/Jest ni compilar NestJS.
- No se pudo compilar Android ni generar APK: falta Gradle/Android SDK y configuración de firma/dispositivo.
- Por tanto, **no es un build aprobado**. Los 11 PASS son verificaciones estáticas del contenido, no pruebas funcionales.

## Pasos de validación en equipo de desarrollo
### Backend
1. Instalar Node.js LTS y PostgreSQL.
2. Copiar `backend/.env.example` a `.env`; generar secretos aleatorios diferentes para `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`.
3. Ejecutar `npm ci` (cuando exista lockfile) o `npm install`.
4. Ejecutar `npx prisma migrate deploy` en entorno controlado y `npm run prisma:generate`.
5. Ejecutar `npm run typecheck`, `npm test` y `npm run build`.
6. Iniciar la API y ejecutar `npm run test:integration` con `SENTINEL_TEST_EMAIL`, `SENTINEL_TEST_PASSWORD` y `SENTINEL_API_BASE_URL`.

### Android
1. Instalar Android Studio/SDK y Gradle compatible con Android Gradle Plugin 8.7.3 (Gradle 8.9).
2. Generar wrapper desde `android/` con `gradle wrapper --gradle-version 8.9`.
3. Configurar `SENTINEL_API_BASE_URL` en `android/gradle.properties` con HTTPS real, por ejemplo `SENTINEL_API_BASE_URL=https://api.tudominio.example/api/`.
4. Ejecutar `./gradlew :app:assembleDebug` y probar login, guardado offline, sync, expiración/renovación, logout y modo sin red.
5. Generar APK release firmado únicamente con keystore custodiado por la empresa.

## Riesgos pendientes
- Falta validar compatibilidad real de dependencias y compilar fuentes Kotlin/TypeScript.
- El cliente Android actual solo renueva tokens durante sincronización; no existe renovación proactiva en primer plano.
- No hay pruebas instrumentadas Android ni pruebas de integración contra PostgreSQL real.
- El dominio por defecto es deliberadamente inválido para impedir que se confunda con una API disponible.
