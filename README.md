# IO-Bot V2

Backend Node.js modular para automatizaciones en vivo con integraciones a Twitch, Discord y Philips Hue.

## Requisitos

- Node.js 25.9.0 (o superior)
- npm 10+
- Bridge de Philips Hue en la misma red local
- Cuenta de Twitch para el bot

## Inicio rapido

```bash
npm install
cp .env.example .env
# Edita .env con tus credenciales (ver seccion Configuracion)
npm run dev
```

## Configuracion

### Twitch

| Variable | Descripcion |
|---|---|
| `TWITCH_CLIENT_ID` | Client ID de tu app en [dev.twitch.tv/console](https://dev.twitch.tv/console) → Register Your Application |
| `TWITCH_CLIENT_SECRET` | Client Secret de la misma app de Twitch |
| `TWITCH_ACCESS_TOKEN` | Access token inicial del bot |
| `TWITCH_REFRESH_TOKEN` | Refresh token inicial del bot (permite renovacion automatica) |
| `TWITCH_TOKEN_EXPIRES_IN` | Segundos de expiracion del token inicial. `0` fuerza refresh inmediato al iniciar |
| `TWITCH_TOKEN_FILE` | Ruta del archivo donde se persiste el token renovado (`data/twitch-token.json`) |
| `COOLDOWN_CONFIG_FILE` | Ruta del archivo JSON de cooldowns por plataforma/comando (`config/cooldowns.json`) |
| `TWITCH_CHANNELS` | Nombre(s) de tu canal sin `#`, separados por coma. Ej: `micanal` |
| `TWITCH_COMMAND_PREFIX` | Prefijo de comandos, por defecto `!` |

> Recomendado: usa un flujo que entregue `access_token` + `refresh_token`. Si solo tienes access token, el bot no podra renovarlo automaticamente cuando expire.

**Obtener `access_token` y `refresh_token` (Authorization Code):**

1. Abre este URL en tu navegador (reemplaza valores):

```text
https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=TU_CLIENT_ID&redirect_uri=http://localhost:3000&scope=chat:read+chat:edit
```

2. Autoriza la app y copia el parametro `code` del redirect.
3. Intercambia el `code` por tokens:

```bash
curl -X POST "https://id.twitch.tv/oauth2/token" \
  -d "client_id=TU_CLIENT_ID" \
  -d "client_secret=TU_CLIENT_SECRET" \
  -d "code=EL_CODE_DEL_REDIRECT" \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=http://localhost:3000"
```

4. Copia `access_token` a `TWITCH_ACCESS_TOKEN` y `refresh_token` a `TWITCH_REFRESH_TOKEN`.

### Philips Hue

| Variable | Descripcion |
|---|---|
| `HUE_BRIDGE_IP` | IP local del bridge. Busca en la app Hue → Settings → My Hue System → Bridge → IPv4, o visita `https://discovery.meethue.com/` |
| `HUE_APP_KEY` | Clave de aplicacion generada en el bridge (ver pasos abajo) |
| `HUE_LIGHT_IDS` | IDs de luces individuales a controlar separados por coma. Si se deja vacio y no hay grupos configurados, controla todas |
| `HUE_GROUPED_LIGHT_IDS` | IDs de `grouped_light` a controlar separados por coma. Ideal si quieres usar un grupo o zona ya armada en Hue |
| `HUE_DEFAULT_BRIGHTNESS` | Brillo de 1 a 100. Recomendado: `80` |
| `HUE_ALLOW_SELF_SIGNED` | `true` para aceptar el certificado self-signed del bridge local |

**Como obtener `HUE_APP_KEY`:**

1. Presiona el boton fisico del bridge Hue.
2. Dentro de los siguientes 30 segundos, ejecuta (reemplaza la IP):

```bash
curl -X POST https://192.168.1.10/api \
  -k \
  -H "Content-Type: application/json" \
  -d '{"devicetype":"io-bot#v2","generateclientkey":true}'
```

3. La respuesta incluye el campo `username`, ese valor es tu `HUE_APP_KEY`.

**Como obtener `HUE_LIGHT_IDS` (opcional):**

```bash
curl -k https://192.168.1.10/clip/v2/resource/light \
  -H "hue-application-key: TU_APP_KEY"
```

Cada elemento del array tiene un campo `id` (UUID). Copia los que quieras controlar.

**Como obtener `HUE_GROUPED_LIGHT_IDS` (opcional, recomendado si ya armaste grupos/zonas):**

```bash
curl -k https://192.168.1.10/clip/v2/resource/grouped_light \
  -H "hue-application-key: TU_APP_KEY"
```

Ese endpoint devuelve recursos `grouped_light`. Copia sus `id` en `HUE_GROUPED_LIGHT_IDS`.

### Que conviene usar

- Usa `HUE_LIGHT_IDS` si quieres controlar luces puntuales.
- Usa `HUE_GROUPED_LIGHT_IDS` si quieres controlar un grupo/zona ya armado en Hue.
- Si ambas variables estan vacias, el bot controla todas las luces detectadas.

### Discord (opcional)

| Variable | Descripcion |
|---|---|
| `DISCORD_TOKEN` | Token del bot en [discord.com/developers/applications](https://discord.com/developers/applications) → Bot → Reset Token |
| `DISCORD_CLIENT_ID` | Application ID de la misma app → OAuth2 |

> Si estas variables estan vacias el bot de Discord no se inicia, el resto del sistema funciona igual.

### Cooldowns por comando

La configuracion de cooldown esta centralizada en `config/cooldowns.json`.

Ejemplo:

```json
{
  "defaults": {
    "enabled": false,
    "seconds": 5,
    "scope": "user_channel"
  },
  "platforms": {
    "twitch": {
      "funa": {
        "enabled": true,
        "seconds": 8,
        "scope": "user_channel"
      },
      "luz": {
        "enabled": true,
        "seconds": 5,
        "scope": "user_channel"
      }
    },
    "discord": {}
  }
}
```

Scopes soportados:

- `user_channel`: mismo usuario en mismo canal
- `channel`: global por canal
- `user_global`: mismo usuario en toda la plataforma
- `global`: global por plataforma

## Feature inicial implementada

Comando en chat de Twitch:

- `!luz azul`
- `!luz rojo`
- `!luz #0F336F`

El comando cambia el color de las luces configuradas en Philips Hue usando la API v2.

## Scripts

- `npm run dev`: modo desarrollo con watch
- `npm start`: ejecucion normal
- `npm run lint`: validacion ESLint
- `npm run format`: validacion Prettier
- `npm run test`: pruebas unitarias

## Arquitectura

```text
src/
  app/                # Orquestacion de la aplicacion
  core/               # Configuracion, logging, utilidades transversales
  components/         # Integraciones e implementaciones por dominio
    twitch/
    discord/
    hue/
  shared/             # Helpers reutilizables entre componentes
```

## Documentacion

- [Indice de Documentacion](docs/README.md)
- [Arquitectura](docs/architecture.md)
- [Core Subsystems](docs/core-subsystems.md)
- [Subsistema de Cooldown](docs/cooldown-system.md)
- [Sistema de Funa](docs/funa-system.md)
- [Guia: Agregar Comandos](docs/development/add-command.md)
- [Buenas Practicas](docs/development/best-practices.md)

## Documentacion de APIs

- [Twitch](docs/apis/twitch.md)
- [Philips Hue](docs/apis/hue.md)
- [Discord](docs/apis/discord.md)

## Nota

`DISCORD_TOKEN` es opcional por ahora. Si no existe, el bot de Discord no se inicia.

## Features Implementadas

### ✅ `!luz <color>` (Twitch)
Cambiar el color de las luces Philips Hue.

### 🚧 `!funa <usuario>` (Twitch - en progreso)
Contador de funas por usuario con persistencia SQLite. Detalles en [docs/funa-system.md](docs/funa-system.md).

## TODO (Roadmap)

- **`!funa` (Twitch)** - EN PROGRESO
  - ✅ Sistema de persistencia SQLite con identidades canónicas.
  - ✅ Cooldown por plataforma/comando con estrategia configurable.
  - ✅ Matching automático de nombres y búsqueda de similares.
  - ⏳ Integración con Discord (reutilizará mismos servicios).
  - ⏳ Comando de admin para unificar identidades manuales.

- **Niveles de usuario**
  - Registrar cantidad de mensajes enviados por usuarios en Twitch y Discord.
  - Subir de nivel en base a cantidad de mensajes.
  - Considerar bonificadores de experiencia/subida para VIP y suscriptores.
  - En Discord, permitir excluir canales que no deben sumar niveles.
  - En Twitch y Discord, excluir mensajes que sean comandos (por ejemplo: `/play`, `!luz`, entre otros).

- **Dashboard de ranking de niveles**

- **Comando "preguntale a la IA"**
  - En Twitch, con comando personalizado de uso exclusivo para moderadores.
  - Ejemplo: `!ia que paso un dia como hoy en 1954`.
  - La pregunta debe enviarse a un LLM configurable (por ejemplo Gemini).
