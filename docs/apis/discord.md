# Integracion Discord

## Libreria

Se utiliza `discord.js` v14.

## Variables de entorno

- `DISCORD_TOKEN`: Token del bot de Discord.
- `DISCORD_CLIENT_ID`: ID de aplicacion (reservado para features futuras).

## Estado actual

- Conexion basica opcional.
- Si `DISCORD_TOKEN` esta vacio, no se inicia Discord.

## Proximos pasos sugeridos

1. Registrar comandos slash (`/luz`, `/escena`, etc.).
2. Sincronizar eventos Twitch -> Discord (notificaciones).
3. Compartir capa de comandos con el router de Twitch.
