import dotenv from 'dotenv';
import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError.js';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.string().default('info'),
  TWITCH_CLIENT_ID: z.string().min(1),
  TWITCH_ACCESS_TOKEN: z.string().min(1),
  TWITCH_CHANNELS: z.string().min(1),
  TWITCH_COMMAND_PREFIX: z.string().default('!'),
  DISCORD_TOKEN: z.string().optional(),
  DISCORD_CLIENT_ID: z.string().optional(),
  HUE_BRIDGE_IP: z.string().min(1),
  HUE_APP_KEY: z.string().min(1),
  HUE_LIGHT_IDS: z.string().optional(),
  HUE_GROUPED_LIGHT_IDS: z.string().optional(),
  HUE_DEFAULT_BRIGHTNESS: z.coerce.number().min(1).max(100).default(80),
  HUE_ALLOW_SELF_SIGNED: z
    .string()
    .optional()
    .transform((value) => value !== 'false'),
});

export const loadConfig = () => {
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    throw new AppError('Variables de entorno invalidas', {
      issues: parsed.error.issues,
    });
  }

  const env = parsed.data;

  return {
    nodeEnv: env.NODE_ENV,
    logLevel: env.LOG_LEVEL,
    twitch: {
      clientId: env.TWITCH_CLIENT_ID,
      accessToken: env.TWITCH_ACCESS_TOKEN,
      channels: env.TWITCH_CHANNELS.split(',').map((item) => item.trim()),
      commandPrefix: env.TWITCH_COMMAND_PREFIX,
    },
    discord: {
      token: env.DISCORD_TOKEN,
      clientId: env.DISCORD_CLIENT_ID,
    },
    hue: {
      bridgeIp: env.HUE_BRIDGE_IP,
      appKey: env.HUE_APP_KEY,
      lightIds: env.HUE_LIGHT_IDS
        ? env.HUE_LIGHT_IDS.split(',').map((item) => item.trim())
        : [],
      groupedLightIds: env.HUE_GROUPED_LIGHT_IDS
        ? env.HUE_GROUPED_LIGHT_IDS.split(',').map((item) => item.trim())
        : [],
      defaultBrightness: env.HUE_DEFAULT_BRIGHTNESS,
      allowSelfSigned: env.HUE_ALLOW_SELF_SIGNED,
    },
  };
};
