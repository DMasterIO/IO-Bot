import dotenv from 'dotenv';
import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError.js';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.string().default('info'),
  TWITCH_CLIENT_ID: z.string().min(1),
  TWITCH_CLIENT_SECRET: z.string().min(1),
  TWITCH_ACCESS_TOKEN: z.string().min(1),
  TWITCH_REFRESH_TOKEN: z.string().optional(),
  TWITCH_TOKEN_EXPIRES_IN: z.coerce.number().optional().default(0),
  TWITCH_TOKEN_FILE: z.string().default('data/twitch-token.json'),
  COOLDOWN_CONFIG_FILE: z.string().default('config/cooldowns.json'),
  CUSTOM_COMMANDS_CONFIG_FILE: z.string().default('config/custom-commands.json'),
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
      clientSecret: env.TWITCH_CLIENT_SECRET,
      accessToken: env.TWITCH_ACCESS_TOKEN,
      refreshToken: env.TWITCH_REFRESH_TOKEN,
      tokenExpiresIn: env.TWITCH_TOKEN_EXPIRES_IN,
      tokenFile: env.TWITCH_TOKEN_FILE,
      channels: env.TWITCH_CHANNELS.split(',').map((item) => item.trim()),
      commandPrefix: env.TWITCH_COMMAND_PREFIX,
    },
    cooldown: {
      configFile: env.COOLDOWN_CONFIG_FILE,
    },
    customCommands: {
      configFile: env.CUSTOM_COMMANDS_CONFIG_FILE,
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
