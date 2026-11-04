# Sentinel MIP — Starter de integración 1.4

**Empresa:** FUMIZA Y MÁS  
**Producto:** Sentinel MIP  
**Entrega:** código fuente inicial integrado (backend + Android)  
**Estado:** scaffold funcional de desarrollo; no es una versión certificada ni lista para producción.

## Qué contiene
- `backend/`: API NestJS + Prisma + PostgreSQL con health check, modelo multiempresa, inspecciones idempotentes y permisos base.
- `android/`: proyecto Android Kotlin con Compose, Room, WorkManager y una pantalla inicial para registrar inspecciones en cola local.
- `docs/`: alcance, decisiones, ejecución y brechas pendientes.

## Qué sí se creó
- Estructura de repositorios y archivos fuente.
- Modelo inicial de tenants, usuarios, establecimientos, estaciones, inspecciones, CAPA y certificados.
- API inicial para registrar inspecciones con `clientMutationId`.
- Guard de roles y permiso explícito para emitir certificados.
- Cola local Android con Room y worker de sincronización de referencia.

## Qué NO se afirma
No se ejecutaron `npm install`, `npm run build`, migraciones contra un PostgreSQL real, Gradle build ni pruebas en dispositivo. No hay servidor, dominio, credenciales, firma APK ni APK listo. Los contratos y dependencias deben validarse y ajustarse antes de producción.

## Backend
Requisitos: Node.js 22+, PostgreSQL 16+.

1. Copiar `backend/.env.example` a `backend/.env` y cambiar los valores.
2. Crear la base de datos PostgreSQL.
3. Desde `backend/`:
   - `npm install`
   - `npx prisma generate`
   - `npx prisma migrate dev --name init`
   - `npm run start:dev`
4. Health: `GET /api/health`

La ruta `POST /api/inspections` espera un JWT válido y rol `TECHNICIAN` o superior. En este starter, el mecanismo de autenticación JWT se deja preparado como punto de integración; no se incluye alta/login de producción ni gestión segura de refresh tokens. Para pruebas locales se puede añadir un proveedor de identidad antes de habilitar endpoints protegidos.

## Android
Abrir `android/` en Android Studio (JDK 17, Android SDK 35). La aplicación es una base de interfaz y almacenamiento offline. La URL de API se configura en `app/build.gradle.kts` como `BuildConfig.API_BASE_URL` (cambiar por endpoint de staging).

## Próximas tareas obligatorias
1. Implementar autenticación completa (alta admin-only, recuperación admin-only, refresh rotation, revocación).
2. Implementar middleware de tenant scoping en TODAS las consultas y mutaciones.
3. Integrar carga privada de imágenes con validación MIME real, antivirus y URLs temporales.
4. Implementar módulos completos CAPA, portal, certificados PDF y expediente documental.
5. Probar idempotencia concurrente con restricción única y recuperación P2002.
6. Compilar backend y Android, ejecutar pruebas, revisar dependencias y análisis de seguridad.
7. Desplegar primero en staging; no usar datos reales hasta cerrar hallazgos.

## Política funcional preservada
- Solo administración crea cuentas y tramita recuperación de contraseñas.
- Certificados solo pueden emitirse por Alta Gerencia, Calidad, Gerencia de Operaciones y Gerencia de Mercadeo. El rol ADMIN por sí solo NO habilita emisión.
- Códigos de estación: `STA-0000001` correlativos en la implementación final.
- Fauna protegida o que requiera reubicación debe ir a un flujo especial, nunca registrarse como exterminio.


## Actualización 1.5
La carpeta `backend/src/auth` ahora contiene login JWT y guard; `backend/src/users` limita creación de cuentas y restablecimiento de contraseña a ADMIN. Android guarda inspecciones localmente en Room desde la pantalla principal. Consultar `docs/etapa-1.5.md` para limitaciones. No se ha compilado ni desplegado.


## Actualización 1.6
Se añadió conexión de login y sincronización Android–API con WorkManager, token cifrado localmente y aceptación de código visible de estación en el backend. Consultar `docs/etapa-1.6.md`. No se ha compilado ni probado contra servidor/dispositivo real.


## Etapa 1.7
Ver `docs/etapa-1.7.md` para refresh-token rotation, revocación de sesiones y corrección de resolución de códigos de estación.


## Etapa 1.8
Ver `docs/etapa-1.8.md` para integración Android de refresh token y pruebas automatizadas de referencia.


## Etapa 1.9
Ver `docs/etapa-1.9.md` y ejecutar `python3 tools/preflight.py` para prevalidación estática (no sustituye build ni pruebas funcionales).


## Etapa 2.0
Ver `docs/etapa-2.0.md`. Incluye workflows de CI y compose local de desarrollo; no equivale a build aprobado.


## Etapa 2.1
Ver `docs/etapa-2.1.md`. Incluye rotación transaccional de refresh tokens, tests unitarios y ajustes CI/Compose Kotlin 2.


## Etapa 2.2 — Guía de compilación
Leer `docs/guia-compilacion.md`. En Windows se incluyen `scripts/preflight.ps1`, `scripts/build-android.ps1` y `scripts/build-backend.ps1`.
