# Integracion Twitch

## Libreria

Se utiliza `@twurple/chat` y `@twurple/auth` para conectarse al chat de Twitch con un token de bot.

## Variables de entorno

- `TWITCH_CLIENT_ID`: Client ID de tu app de Twitch.
- `TWITCH_CLIENT_SECRET`: Client secret de tu app de Twitch.
- `TWITCH_ACCESS_TOKEN`: Access token OAuth inicial del bot.
- `TWITCH_REFRESH_TOKEN`: Refresh token OAuth inicial del bot.
- `TWITCH_TOKEN_EXPIRES_IN`: Segundos de expiracion del token inicial.
- `TWITCH_TOKEN_FILE`: Ruta del archivo local donde se persiste el token renovado.
- `TWITCH_CHANNELS`: Lista de canales separados por coma.
- `TWITCH_COMMAND_PREFIX`: Prefijo de comandos (default `!`).

## Scopes recomendados

- `chat:read`
- `chat:edit`

## Flujo actual

1. El bot inicializa `RefreshingAuthProvider` con `client_id` y `client_secret`.
2. Carga token persistido desde `TWITCH_TOKEN_FILE` (o usa el inicial desde `.env`).
3. Cuando Twitch exige renovacion, refresca automaticamente y persiste el nuevo token.
4. Se conecta al chat de los canales configurados.
5. Se escuchan mensajes que empiezan con prefijo.
6. Se enruta el comando al `CommandRegistry`.
7. `!luz` delega en `HueLightService`.
