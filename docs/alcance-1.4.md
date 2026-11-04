# Alcance del starter 1.4

## Incluido
- Base de datos relacional multiempresa.
- Inspección con idempotencia por técnico y `clientMutationId`.
- Verificación de pertenencia de estación al tenant en la creación.
- Regla de autorización explícita de emisores de certificados como helper.
- App Android de referencia con Room y pantalla Compose inicial.

## Brechas conocidas antes de usar
- La autenticación real no está implementada. El guard del endpoint es un placeholder de desarrollo y no debe exponerse a Internet.
- Falta scoping de tenant en todos los endpoints (solo se aplica al alta de inspección).
- Falta secuencia transaccional para códigos de establecimientos/estaciones.
- CAPA, portal cliente, emisión PDF y evidencias son modelos/etapas pendientes de implementación funcional.
- El Worker Android aún no llama a API y la UI todavía no persiste en Room; se dejó arquitectura inicial, no flujo completo.
- Añadir pruebas unitarias, integración, migraciones, escaneo de dependencias y revisión de seguridad.
