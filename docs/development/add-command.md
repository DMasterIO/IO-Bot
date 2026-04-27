# Guía: Agregar un Comando Nuevo

Esta guía define el flujo estándar para agregar comandos de chat (Twitch/Discord) de forma coherente con la arquitectura actual.

## Resumen del flujo

1. Implementar clase de comando en `src/components/<plataforma>/commands`.
2. Registrar el comando en `src/app/Application.js`.
3. Definir regla de cooldown en `config/cooldowns.json` si corresponde.
4. Añadir/actualizar tests.
5. Documentar comportamiento y ejemplos de uso.

## 1) Crear el comando

Ejemplo para Twitch:

- Archivo: `src/components/twitch/commands/PingCommand.js`

```js
export class PingCommand {
  constructor() {
    this.name = 'ping';
    this.aliases = ['p'];
  }

  async execute() {
    return 'pong';
  }
}
```

Recomendaciones:

- Exponer `name` obligatorio.
- Usar `aliases` solo cuando aporten valor real.
- Mantener `execute(context)` con salida simple (`string`) y sin side effects innecesarios.

## 2) Registrar el comando

En `src/app/Application.js`, registrar en el `CommandRegistry`:

```js
commandRegistry.register(new PingCommand());
```

## 3) Configurar cooldown

Agregar regla en `config/cooldowns.json`:

```json
{
  "platforms": {
    "twitch": {
      "ping": {
        "enabled": true,
        "seconds": 5,
        "scope": "user_channel"
      }
    }
  }
}
```

Scopes disponibles:

- `user_channel`
- `channel`
- `user_global`
- `global`

## 4) Tests mínimos esperados

- Test de unidad del comando (respuesta base y validaciones).
- Test de integración con `CommandRegistry` cuando use cooldown.
- Test de borde para inputs inválidos.

Referencia de suite de cooldown:

```bash
npm test -- test/cooldown-system.test.js
```

## 5) Documentación mínima por comando

Agregar al menos:

- Sintaxis: `!comando <args>`.
- Ejemplo real de entrada/salida.
- Restricciones (cooldown, permisos, límites).
- Dependencias externas (si aplica).

Plantilla recomendada:

- `docs/development/feature-doc-template.md`

Referencia de implementación basada en configuración:

- `docs/custom-commands-system.md`

## Checklist de PR

- [ ] Comando implementado y registrado.
- [ ] Cooldown configurado (o justificación de no usarlo).
- [ ] Tests agregados/actualizados.
- [ ] Documentación actualizada.
- [ ] Mensajes de error comprensibles para chat.
