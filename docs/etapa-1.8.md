# Sentinel MIP — Etapa 1.8

## Cambios
- Android guarda access token y refresh token juntos en EncryptedSharedPreferences.
- Login procesa el par de tokens devuelto por el backend.
- El worker, al recibir HTTP 401 al sincronizar, intenta una renovación una sola vez y reintenta la misma inspección.
- Los tokens renovados se guardan juntos antes de reintentar.
- Si el refresh token es rechazado (401), se limpia la sesión; ante fallos transitorios de red/servidor se conserva la sesión y WorkManager reintenta.
- El botón Salir intenta revocar el refresh token en el backend y luego limpia el almacenamiento local.
- Versión Android actualizada a 1.8.0.
- Prueba unitaria de clasificación UUID/código de estación.
- Prueba de humo HTTP para health, login, rotación, rechazo de reutilización y logout.

## Ejecutar pruebas backend
Desde `backend/`:
1. `npm install`
2. `npm run prisma:generate`
3. `npm run typecheck`
4. `npm test`
5. Con PostgreSQL migrado y API en ejecución, definir `SENTINEL_API_BASE_URL`, `SENTINEL_TEST_EMAIL` y `SENTINEL_TEST_PASSWORD`; luego `npm run test:integration`.

## Android
Configurar `SENTINEL_API_BASE_URL` como propiedad Gradle con URL HTTPS terminada en `/api/`. El cleartext HTTP permanece deshabilitado en Android. Compilar con Android SDK/Gradle y probar en emulador o dispositivo físico; esos pasos no se han podido ejecutar en esta entrega.

## Consideraciones
- El worker renueva la sesión cuando una solicitud devuelve 401. La pantalla de inicio no incluye todavía una interfaz de renovación proactiva ni muestra detalles de expiración.
- El endpoint de logout se ejecuta como mejor esfuerzo: el dispositivo borra localmente los tokens incluso si no hay conexión; en ese caso el refresh token podría seguir válido en servidor hasta su expiración.
- Las pruebas añadidas son código fuente; no se afirma que hayan pasado. El smoke test requiere un usuario real habilitado y backend operativo.
- No se ha compilado Android/backend ni se ha conectado a una base de datos real.
