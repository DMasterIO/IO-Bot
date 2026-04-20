# Integracion Philips Hue

## API usada

API v2 local: `https://<bridge-ip>/clip/v2/resource`.

## Variables de entorno

- `HUE_BRIDGE_IP`: IP local del bridge Hue.
- `HUE_APP_KEY`: Application key generada en el bridge.
- `HUE_LIGHT_IDS`: IDs de luces separadas por coma (opcional).
- `HUE_GROUPED_LIGHT_IDS`: IDs de recursos grouped_light separados por coma (opcional).
- `HUE_DEFAULT_BRIGHTNESS`: Brillo por defecto de 1 a 100.
- `HUE_ALLOW_SELF_SIGNED`: `true` para aceptar certificado self-signed.

## Crear `HUE_APP_KEY`

1. Presiona el boton fisico del bridge.
2. Ejecuta una peticion POST a `/api` para registrar una app.
3. Guarda el valor de `username`/application key en `HUE_APP_KEY`.

## Flujo actual

1. Obtiene luces desde `/resource/light` y grupos desde `/resource/grouped_light`.
2. Filtra por `HUE_LIGHT_IDS` y/o `HUE_GROUPED_LIGHT_IDS` si se configuraron.
3. Convierte color RGB a XY.
4. Actualiza cada recurso objetivo con color y brillo.
