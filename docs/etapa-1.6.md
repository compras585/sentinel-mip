# Etapa 1.6 — Conexión Android–API

## Implementado en el código fuente
- Endpoint de inspecciones acepta `stationKey` como UUID o código de estación.
- Verificación de que la estación pertenece al tenant del usuario autenticado.
- Idempotencia con `clientMutationId` y recuperación ante colisión P2002.
- Android: login contra `/api/auth/login`.
- Token de acceso guardado mediante EncryptedSharedPreferences.
- Cola Room procesada por WorkManager cuando hay conectividad.
- Envío autenticado a `/api/inspections`; elimina cada registro solo tras respuesta exitosa.
- Rechazo de token 401 limpia la sesión; otros errores conservan la cola y reintentan.

## Configuración
En `android/`, establecer `SENTINEL_API_BASE_URL` como propiedad Gradle, por ejemplo:
`./gradlew assembleDebug -PSENTINEL_API_BASE_URL=https://staging.tu-dominio/api/`
La URL debe terminar en `/api/`. No habilitar HTTP en producción. El emulador Android puede usar `http://10.0.2.2:3000/api/` solo si se configura cleartext de desarrollo explícitamente; esta entrega mantiene cleartext deshabilitado.

## Pruebas pendientes
- No se ejecutó Gradle ni build NestJS en este entorno.
- No se conectó a PostgreSQL real.
- No se probó login con usuarios reales.
- No se verificó Worker en dispositivo ni conectividad intermitente.
- No se implementó refresh token; al expirar el JWT, el usuario debe iniciar sesión de nuevo.
- La app necesita HTTPS o configuración de red local controlada para pruebas.
- Revisar que la instalación de EncryptedSharedPreferences alpha sea compatible con el Android Gradle Plugin seleccionado.
