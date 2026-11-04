# Sentinel MIP — Etapa 2.1: endurecimiento de autenticación y CI

## Correcciones realizadas
- Rotación de refresh token ahora revoca el token anterior y guarda el reemplazo dentro de una misma transacción Prisma. Si la escritura del reemplazo falla, la transacción revierte la revocación.
- Se conserva la actualización condicional `updateMany`; dos solicitudes concurrentes no pueden consumir exitosamente el mismo refresh token.
- Se agregan pruebas unitarias para rotación exitosa, token de uso incorrecto, replay y fallo de transacción.
- Se corrige la configuración de Compose para Kotlin 2.0.21 aplicando `org.jetbrains.kotlin.plugin.compose` en raíz y módulo Android.
- El workflow Android instala explícitamente Android platform 35 y build-tools 35.0.0 antes de compilar.
- Se mantiene el workflow CI de backend y el entorno Docker Compose de desarrollo.
- El worker Android elimina sesión si el segundo envío tras renovar vuelve a responder 401, evitando mantener credenciales inválidas.
- Prevalidación estática ampliada: 17/17 comprobaciones PASS. Los dos workflows YAML fueron parseados correctamente.

## Intento de build ejecutado aquí
Se intentó instalar dependencias con:
`npm install --ignore-scripts --no-audit --no-fund --fetch-retries=0 --fetch-timeout=45000`
El registro npm no pudo resolverse (`EAI_AGAIN registry.npmjs.org`). No hay Gradle, Android SDK, Docker ni PostgreSQL disponibles en el entorno.
Por ello no fue posible ejecutar `npm run typecheck`, Jest, `npm run build`, Gradle ni producir APK. No se afirma que compile.

## Ejecutar la validación real
1. Copiar el contenido de esta carpeta a un repositorio GitHub.
2. Hacer push; los workflows `.github/workflows/backend.yml` y `android.yml` ejecutarán los jobs.
3. Revisar el resultado de ambos jobs en GitHub Actions.
4. Si Android CI termina en verde, descargar el artifact `sentinel-mip-debug-apk`.
5. Si backend CI termina en verde, ejecutar además el smoke test contra PostgreSQL y usuario de QA, ya que el workflow unitario no sustituye la prueba HTTP real.

## Resultado
- Preflight estático: 17/17 PASS.
- Sintaxis YAML: ambos workflows parseados.
- Integridad ZIP: verificada.
- Compilación funcional: pendiente de CI/entorno externo.
- APK debug: no generada.
- APK release firmada y pruebas en dispositivo: pendientes.
