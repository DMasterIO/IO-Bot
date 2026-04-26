# Guía Rápida: Sistema de Funa

## Requisitos
- Node.js 25.9.0+
- Twitch bot token configurado en `.env`
- Variables requeridas: `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_ACCESS_TOKEN`, `TWITCH_REFRESH_TOKEN`

## Instalación
```bash
npm install  # Instala better-sqlite3 y dependencias
```

## Ejecutar Tests
```bash
npm test              # Suite completa
npm test -- test/funa-system.test.js  # Solo tests de funa
npm test -- test/cooldown-system.test.js  # Suite dedicada de cooldowns
```

## Ejecutar el Bot
```bash
npm run dev   # Modo development con watch
npm start     # Ejecución normal
```

## Base de Datos
- **Ubicación**: `data/io-bot.db` (se crea automáticamente)
- **Migraciones**: Se ejecutan automáticamente al startup
- **Schema**: 5 tablas + 6 índices. Ver `src/core/db/migrations/001_initial_schema.js`

## Comando en Twitch
```
!funa <usuario>
```

**Ejemplo en chat**:
```
Usuario: !funa juanperez
Bot: juanperez ha sido funado 5 veces 😅
```

## Cooldowns
- `!funa`: 8 segundos por usuario (scope por usuario+canal)
- El cooldown aplica si la misma persona intenta invocar el comando repetidamente en ese rango
- Si intenta en cooldown: `"Espera 8s antes de volver a usar !funa."`

## Unificación de Identidades
El sistema auto-matchea usuarios similares:
- `juanperez` + `juan_perez` → mismo usuario (similitud > 0.85)
- `juanperez` + `juancito` → usuarios diferentes (sin match claro)

## Próximas Extensiones (No Implementadas)
1. Discord: reutilizar mismos servicios
2. Admin commands: `!finduser`, `!mergeuser`
3. Niveles: sistema de XP por mensajes

## Troubleshooting

**Error: "no such column"**
- Borrar `data/io-bot.db` y reiniciar (recrea schema)

**Error: "UNIQUE constraint failed"**
- Identidad duplicada, revisar identidades en DB

**Tests fallando**
- Correr `npm run lint` para validar sintaxis
- Verificar `node --version` es 25.9.0+

## Debugging
```bash
# Ver logs en memoria
npm run dev 2>&1 | grep -i "funa\|identity\|cooldown"

# Inspeccionar BD directamente
sqlite3 data/io-bot.db ".schema"
```

## Archivos Clave
- `src/core/services/IdentityService.js` - Matching de usuarios
- `src/core/services/CooldownService.js` - Control de cooldowns  
- `src/core/services/FunaService.js` - Eventos y conteos
- `src/components/twitch/commands/FunaCommand.js` - Comando Twitch
- `test/funa-system.test.js` - Tests
