# Buenas Prácticas del Proyecto

## Arquitectura y diseño

- Mantener separación clara entre:
  - `components`: adaptación a plataformas/APIs.
  - `core/services`: reglas de negocio reutilizables.
  - `core/commands`: orquestación/middleware de comandos.
- Evitar lógica de negocio pesada en bots/adaptadores.
- Preferir configuración declarativa sobre condicionales hardcodeados.

## Comandos

- Un comando debe resolver una responsabilidad clara.
- Validar inputs temprano y responder mensajes útiles para usuario final.
- Reutilizar servicios core antes de crear lógica duplicada.
- Si un comando requiere control de frecuencia, usar `config/cooldowns.json`.

## Persistencia

- Cambios de esquema siempre vía migraciones.
- Mantener consultas simples y con índices cuando la tabla crezca.
- Evitar writes redundantes en loops de alto tráfico.

## Testing

- Agregar tests cuando cambia comportamiento observable.
- Priorizar casos de borde en comandos expuestos a chat.
- Mantener suites separadas por dominio (`funa`, `cooldown`, `hue`, etc.).

## Documentación

- Una feature debe tener un único documento de referencia principal.
- Los quickstarts deben vivir dentro del documento principal o derivar a él.
- No duplicar secciones de configuración entre archivos.

## Convención de commits

- Commits separados por funcionalidad, cada uno con valor propio.
- El historial debe contar la evolución real del feature.
- Si se detecta un error en una rama no mergeada, corregir con `fixup/squash/rebase` en el commit de origen.

## Flujo de PR y herramientas

- Crear/gestionar PRs con `gh` CLI.
- Antes de push:
  - correr tests relevantes
  - revisar documentación afectada
  - validar que el commit sea coherente y autocontenible
