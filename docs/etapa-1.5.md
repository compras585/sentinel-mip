# Etapa 1.5 — Autenticación, permisos y persistencia offline local

## Implementado en el código fuente
- Login backend con contraseña bcryptjs y JWT de acceso de 15 minutos.
- Guard JWT real; se eliminó el guard de desarrollo que fabricaba un usuario.
- Alta de usuarios y restablecimiento de contraseña restringidos al rol ADMIN.
- Scoping de tenant al crear inspecciones.
- Manejo de carrera P2002 para idempotencia de inspecciones.
- Endpoint de certificados bloqueado por rol emisor permitido; la generación PDF sigue pendiente.
- Android: pantalla de registro que persiste inspecciones en Room con clientMutationId estable y contador de cola.

## Pendiente y limitaciones
- No hay bootstrap de primer ADMIN; se debe crear por procedimiento seguro/seed revisado antes de iniciar sesión.
- No se implementó refresh token, revocación ni cambio obligatorio de contraseña temporal.
- JWT requiere `JWT_ACCESS_SECRET` seguro y rotación operativa.
- Endpoint certificado devuelve NOT_IMPLEMENTED tras autorización: no emite PDF.
- Worker de Android no sincroniza todavía; devuelve retry para no borrar datos.
- No se ha compilado ni ejecutado con PostgreSQL/Android SDK en este entorno.
- Se debe completar scoping multi-tenant en cada endpoint nuevo, pruebas unitarias/integración, y test de acceso cruzado.
