# Guía práctica para compilar Sentinel MIP (Windows recomendado)

## Antes de empezar
- Windows 10/11 de 64 bits.
- Cuenta GitHub (repositorio privado).
- GitHub Desktop.
- Java JDK 21.
- Android Studio con Android SDK Platform 35 y Build Tools 35.
- Node.js 22 LTS.
- Gradle 8.9 (para compilar localmente).
- Docker Desktop solo si vas a levantar PostgreSQL/API localmente.
- Conexión a internet para descargar dependencias.

## Método sencillo: GitHub Actions (sin instalar el SDK Android local)
1. Descarga el ZIP de la etapa 2.2 y extráelo.
2. Abre la carpeta `sentinel-mip-1.4-starter`. Esa carpeta contiene el proyecto raíz.
3. Instala GitHub Desktop e inicia sesión.
4. En GitHub Desktop: **File > New repository**. En Local path selecciona la carpeta padre; usa `sentinel-mip` como nombre. Si ya tienes la carpeta extraída, puedes renombrarla `sentinel-mip` y seleccionar su ruta. No crees otra carpeta dentro.
5. Asegúrate de que dentro de la raíz estén `android`, `backend`, `docs`, `tools`, `docker-compose.dev.yml` y `.github`.
6. Crea el repositorio local. En la pestaña Changes escribe `Initial Sentinel MIP source`, pulsa **Commit to main** y después **Publish repository**.
7. En Publish repository marca **Keep this code private**.
8. Abre el repositorio en GitHub.com, pestaña **Actions**. Si GitHub pide habilitar Actions, actívalo.
9. Ejecuta los workflows `Android CI` y `Backend CI` (se ejecutan también con cada push/PR).
10. Abre cada ejecución. Solo si aparece estado verde **Success** se considera que ese job compiló correctamente.
11. En la ejecución Android, baja a **Artifacts** y descarga `sentinel-mip-debug-apk`. Extrae el ZIP y encontrarás `app-debug.apk`.

Si no aparece Actions:
- Verifica que la carpeta `.github/workflows` esté en la raíz del repositorio.
- Comprueba que los archivos `android.yml` y `backend.yml` estén dentro.
- Haz un cambio pequeño y un nuevo commit/push para disparar los workflows.

## Compilar Android localmente
1. Instala Android Studio, JDK 21, Android SDK Platform 35 y Build Tools 35.0.0.
2. Instala Gradle 8.9 y comprueba en PowerShell: `java -version`, `gradle --version`.
3. Abre PowerShell en la carpeta raíz del proyecto.
4. Ejecuta `.\scripts\preflight.ps1`.
5. Compila indicando la URL HTTPS real del backend:
   `.\scriptsuild-android.ps1 -ApiBaseUrl "https://TU-DOMINIO/api/"`
6. La APK debug debe quedar en:
   `androidppuild\outputspk\debugpp-debug.apk`

No uses `https://api.example.invalid/api/` para probar conexión: es un dominio reservado de ejemplo. La compilación puede completarse con ese valor, pero la app no conectará a un servidor real.

## Compilar backend localmente
1. Instala Node.js 22 y PostgreSQL 16 (o Docker Desktop).
2. Abre PowerShell en la raíz del proyecto y ejecuta:
   `docker compose -f docker-compose.dev.yml up --build`
3. La API de desarrollo quedará en `http://localhost:3000/api/health`.
4. Para validar el código de forma separada, ejecuta `.\scriptsuild-backend.ps1` desde PowerShell. Debes tener `DATABASE_URL` configurada en `backend/.env` para generar Prisma Client.
5. Para el entorno local Compose, las credenciales y secretos del archivo Compose son exclusivamente de desarrollo. Cámbialos antes de cualquier entorno compartido.

## Qué significa cada resultado
- `preflight 17/17`: revisión estática de archivos y configuración; no es compilación.
- `Backend CI Success`: TypeScript, pruebas Jest y build Nest completados según el workflow.
- `Android CI Success`: Gradle produjo la APK debug y el workflow subió el artifact.
- Prueba funcional: instalar APK en un teléfono/emulador, conectar a backend HTTPS real y probar login, guardar inspección offline, sincronizar, renovar sesión y cerrar sesión.
- Release: requiere firma Android controlada por FUMIZA Y MÁS y pruebas adicionales. No distribuyas una APK debug como versión final.

## Seguridad
- Nunca publiques `.env`, contraseñas, claves JWT ni keystore.
- El repositorio debe permanecer privado.
- No coloques credenciales reales en `gradle.properties`, scripts o commits.
- Para producción se necesita HTTPS válido, secretos robustos, migraciones de base de datos controladas, backups y configuración de servidor.
