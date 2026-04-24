# Sistema de Funa

## Descripción

El sistema de funa permite que usuarios ejecuten el comando `!funa <usuario>` en Twitch para "funar" (mencionar de forma jocosa) a otros usuarios. El bot mantiene un contador de cuántas veces cada usuario ha sido funado.

## Características

### 1. Unificación de Identidades
- El bot mantiene un modelo canónico de usuario (`users`) vinculado a identidades en diferentes plataformas (`identities`).
- **Matching automático**: Cuando se detecta por primera vez un usuario, el sistema intenta hacer auto-match con usuarios similares en base a:
  - Normalización de nombre (minúsculas, sin caracteres especiales, sin números al final).
  - Similitud Levenshtein con umbral configurablemente (default 0.85).
- **Match seguro**: Solo se auto-merge si hay exactamente un candidato por encima del umbral.
- **Duplicados permitidos**: Si hay ambigüedad, se crea un nuevo usuario. Luego se pueden unificar manualmente.

### 2. Cooldown por Comando
- Cada comando tiene un cooldown configurable (ej: `funa` tiene 8 segundos).
- El cooldown es **por canal y global** (no por usuario), para evitar spam grupal.
- Si se intenta usar un comando en cooldown, el bot responde: `"Espera un poco, acaban de usar esto. Intenta en Xs."`
- Configuración de cooldowns en `CooldownService.DEFAULT_COOLDOWNS`.

### 3. Persistencia en SQLite
- Base de datos robusta y ligera sin requerimientos de servidor externo.
- Schema con migraciones automáticas al iniciar.
- Preparada para escalar a niveles, dashboard y otras features.

## Uso

### Comando Básico

```
!funa <usuario>
```

**Ejemplo:**
```
!funa juanperez
```

**Respuesta:**
```
juanperez ha sido funado 5 veces 😅
```

## Arquitectura

### Tablas Principales

#### `users`
- ID canónico de usuario en el sistema.
- Se crea automáticamente para cada usuario único encontrado.

#### `identities`
- Mapeo entre plataforma + platform_user_id → user_id canónico.
- Ejemplo: `(platform='twitch', platform_user_id='123456', user_id=1)`.
- Almacena nombre de usuario y display name para trazabilidad.

#### `funa_events`
- Registro histórico de cada evento de funa.
- Campos: actor (identidad), target (usuario), plataforma, timestamp.

#### `command_cooldowns`
- Control de cooldowns por comando y scope (ej: `command=funa, scope=channel#twitch:global`).
- Almacena `last_used_at` en milisegundos desde epoch.

### Servicios

#### `IdentityService`
```javascript
// Obtener o crear identidad automáticamente
const identity = identityService.getOrCreateIdentity(
  'twitch', 
  platformUserId,
  username,
  displayName
);

// Buscar usuarios similares
const matches = identityService.findSimilarUsers('juanperez');

// Unificar usuarios (merge manual)
identityService.mergeUsers(sourceUserId, targetUserId, mergedBy, reason);
```

#### `CooldownService`
```javascript
// Verificar si comando está en cooldown
const check = cooldownService.checkCooldown('funa', 'channel#twitch:global');
if (check.onCooldown) {
  console.log(`Espera ${check.remainingSeconds}s`);
}

// Registrar uso de comando
cooldownService.recordUsage('funa', 'channel#twitch:global');
```

#### `FunaService`
```javascript
// Registrar un evento de funa
funaService.recordFunaEvent(actorIdentityId, targetUserId, 'twitch');

// Obtener conteo de funas de un usuario
const count = funaService.getFunaCount(userId);

// Obtener historial
const history = funaService.getFunaHistory(userId, limit=10);

// Estadísticas globales
const stats = funaService.getFunaStats(); // { mostFunedUsers, topFuners }
```

### Comando para Twitch

#### `FunaCommand`
```javascript
new FunaCommand({
  identityService,
  cooldownService,
  funaService,
  logger
})
```

Flujo:
1. Usuario ejecuta `!funa <target>`.
2. Se verifica cooldown global del canal.
3. Se obtiene/crea identidad del actor.
4. Se busca usuario target por nombre (similar o exacto).
5. Se registra evento en DB.
6. Se retorna mensaje con conteo actualizado.

## Configuración

### Variables de Entorno
- `DB_PATH`: Ruta de la base de datos (default: `data/io-bot.db`).
- Cooldowns personalizados pueden configurarse en `CooldownService` constructor.

### Threshold de Similitud
El umbral de matching automático es configurable por defecto a `0.85` (escala 0-1):
- `0.90+`: muy estricto, casi solo nombres iguales.
- `0.85`: recomendado para capturar typos y variantes (juan vs juan_).
- `0.75+`: más permisivo, captura más matches pero con riesgo de falsos positivos.

## Extensión a Discord

El diseño está pensado para reutilizar los mismos servicios en Discord:

```javascript
// En DiscordBot, igual que en TwitchBot:
const discordFunaCommand = new FunaCommand({
  identityService, // compartido
  cooldownService, // compartido
  funaService,    // compartido
  logger
});

// Al recibir mensajes en Discord:
identityService.getOrCreateIdentity('discord', userId, username, displayName);
// La identidad se unificará automáticamente si hay match con Twitch.
```

## Roadmap Futuro

- Modificadores de experiencia para VIP/suscriptores.
- Dashboard de ranking con gráficos.
- Sistema de niveles basado en contadores.
- Integración con IA para respuestas dinámicas.
- Match manual vía comando de admin.

## Testing

Ejecutar tests del sistema de funa:
```bash
npm test -- test/funa-system.test.js
```

Tests cubiertos:
- Creación y matching automático de identidades.
- Búsqueda de usuarios similares.
- Gestión de cooldowns.
- Registro y conteo de eventos de funa.
- Estadísticas globales.
