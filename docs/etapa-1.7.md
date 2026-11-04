# Sentinel MIP — Etapa 1.7

## Cambios incluidos
- Renovación de sesión con refresh token JWT de 7 días y access token de 15 minutos.
- Rotación de refresh tokens: cada token se invalida al renovarse; el hash SHA-256 se almacena en PostgreSQL, nunca el token en claro.
- Endpoint de cierre de sesión que revoca el refresh token presentado.
- Restablecimiento administrativo de contraseña revoca las sesiones de renovación activas del usuario.
- Corrección de búsqueda de estación: el identificador se interpreta como UUID o como código (p. ej. STA-0000001), evitando enviar códigos no UUID a una columna UUID de Prisma.
- Modelo Prisma RefreshSession e índice para consulta/revocación.

## Endpoints
- `POST /api/auth/login` — email/password; devuelve accessToken y refreshToken.
- `POST /api/auth/refresh` — `{ "refreshToken": "..." }`; revoca el token anterior y devuelve un par nuevo.
- `POST /api/auth/logout` — `{ "refreshToken": "..." }`; revoca la sesión de renovación.
- `POST /api/inspections` — acepta stationKey UUID o código correlativo, sujeto al tenant del usuario.

## Configuración y migración
1. Configurar `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` con secretos aleatorios distintos de al menos 32 bytes.
2. Ejecutar `npm install`.
3. Ejecutar `npx prisma migrate dev --name refresh_sessions` en desarrollo (o generar/aplicar migración controlada en producción).
4. Ejecutar `npm run prisma:generate`, `npm run typecheck` y `npm run build`.
5. En Android, persistir el refreshToken cifrado, llamar `/auth/refresh` al recibir 401 por expiración y reemplazar ambos tokens de forma atómica. La app Android 1.6 aún no integra esta rotación; en esta etapa se entrega contrato y backend.

## Límites y seguridad
- La revocación se basa en refresh tokens; un access token JWT ya emitido puede seguir válido hasta 15 minutos. Para revocación inmediata de access tokens se necesita lista de bloqueo/versionado de sesión.
- La rotación actual es de un solo uso mediante actualización condicional. Si falla la emisión del nuevo par después de revocar el anterior, el usuario deberá iniciar sesión otra vez.
- El endpoint logout es idempotente; una petición con token inválido no expone datos de sesión.
- La migración no está aplicada a una base de datos real. Este paquete no se ha compilado ni probado contra PostgreSQL ni dispositivo Android.
