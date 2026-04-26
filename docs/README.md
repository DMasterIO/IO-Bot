# Documentación IO-Bot

Este índice organiza la documentación por intención de lectura para evitar duplicidad y facilitar mantenimiento.

## 1. Onboarding

- `README.md` (raíz): instalación, configuración base y ejecución.
- `docs/architecture.md`: visión de alto nivel y componentes.

## 2. Núcleo (Core)

- `docs/core-subsystems.md`: IdentityService, CommandRegistry, CooldownService, FunaService, DB y config.
- `docs/cooldown-system.md`: diseño, configuración y operación del cooldown.

## 3. Features

- `docs/funa-system.md`: documentación completa de la feature `!funa` (quickstart + arquitectura + troubleshooting).

## 4. Integraciones externas

- `docs/apis/twitch.md`
- `docs/apis/discord.md`
- `docs/apis/hue.md`

## 5. Desarrollo

- `docs/development/add-command.md`: guía paso a paso para agregar comandos nuevos.
- `docs/development/best-practices.md`: convenciones técnicas y prácticas recomendadas.
- `docs/development/feature-doc-template.md`: plantilla base para documentar nuevas features.

## Convenciones de documentación

- Una feature = un archivo de referencia principal (evitar quickstart duplicado).
- Separar documentación conceptual (arquitectura) de documentación operativa (how-to).
- Mantener ejemplos ejecutables y rutas reales del proyecto.
- Actualizar tests/documentación en el mismo PR cuando cambie comportamiento.
