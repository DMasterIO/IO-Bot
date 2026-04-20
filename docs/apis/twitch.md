# Integracion Twitch

## Libreria

Se utiliza `@twurple/chat` y `@twurple/auth` para conectarse al chat de Twitch con un token de bot.

## Variables de entorno

- `TWITCH_CLIENT_ID`: Client ID de tu app de Twitch.
- `TWITCH_ACCESS_TOKEN`: Access token OAuth del bot.
- `TWITCH_CHANNELS`: Lista de canales separados por coma.
- `TWITCH_COMMAND_PREFIX`: Prefijo de comandos (default `!`).

## Scopes recomendados

- `chat:read`
- `chat:edit`

## Flujo actual

1. Se conecta al chat de los canales configurados.
2. Se escuchan mensajes que empiezan con prefijo.
3. Se enruta el comando al `CommandRegistry`.
4. `!luz` delega en `HueLightService`.
