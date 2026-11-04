# Sentinel MIP — Etapa 2.0: preparación de CI y entorno local

## Entrega
- Workflow CI para backend: instala dependencias, genera Prisma Client, ejecuta typecheck, Jest y build en GitHub Actions.
- Workflow CI para Android: prepara Java 21, Gradle 8.9 y Android SDK; compila APK debug y la publica como artifact de GitHub Actions.
- `docker-compose.dev.yml`: PostgreSQL 16 + API para desarrollo local. La API usa `prisma db push`; es solo para desarrollo, nunca producción.
- Dockerfile backend de desarrollo/validación.
- Se corrige el worker Android para limpiar la sesión si el reintento con el access token renovado vuelve a responder 401, evitando un bucle de reintentos con credenciales inválidas.
- Se conserva la prevalidación estática de la etapa 1.9.

## Qué sí se ejecutó en este entorno
- Se verificó integridad del ZIP de entrada.
- Se confirmó Java 21 y Node.js 22 disponibles.
- Se intentó `npm install --ignore-scripts --no-audit --no-fund`; falló porque no se pudo resolver `registry.npmjs.org` (DNS `EAI_AGAIN`).
- No hay Gradle, Android SDK, Docker, PostgreSQL ni `psql` disponibles en este entorno.
- No se pudo ejecutar TypeScript, Jest, build NestJS, Gradle ni compilar APK.
- El contenido de los workflows no se ha ejecutado en GitHub Actions; se entregan listos para que el repositorio los ejecute al recibir push/PR.

## Uso local
### Backend y PostgreSQL
Desde la carpeta que contiene `docker-compose.dev.yml`:
`docker compose -f docker-compose.dev.yml up --build`
API de desarrollo: `http://localhost:3000/api/health`.
El compose usa credenciales y secretos locales de ejemplo; reemplazarlos antes de cualquier uso compartido. `prisma db push` sincroniza el esquema de desarrollo y no sustituye una estrategia de migraciones para producción.

### CI remoto
1. Crear un repositorio Git y copiar a su raíz el contenido de `sentinel-mip-1.4-starter/`, incluyendo la carpeta `.github/`. Los workflows usan las rutas `backend/` y `android/`.
2. Hacer push a GitHub.
3. Consultar Actions. El workflow Android subirá `sentinel-mip-debug-apk` como artifact si compila correctamente.
4. El workflow backend publicará resultados de typecheck, Jest y Nest build.
5. Ejecutar aparte el smoke test de integración con una base migrada y usuario de prueba.

## Estado de aprobación
Esta etapa no es una compilación aprobada. La única comprobación automática realizada aquí sigue siendo estática. La APK debug solo se podrá descargar de GitHub Actions después de que el workflow remoto termine exitosamente. Para una APK release hacen falta configuración de firma y pruebas en dispositivo.
