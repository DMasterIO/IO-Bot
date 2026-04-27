import fs from 'node:fs';
import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError.js';

const ruleSchema = z.object({
  enabled: z.boolean().optional(),
  seconds: z.coerce.number().int().positive().max(3600).optional(),
  scope: z.enum(['user_channel', 'channel', 'user_global', 'global']).optional(),
});

const cooldownConfigSchema = z.object({
  defaults: ruleSchema.optional(),
  platforms: z.record(z.string(), z.record(z.string(), ruleSchema)).default({}),
});

const fallbackConfig = {
  defaults: {
    enabled: false,
    seconds: 5,
    scope: 'user_channel',
  },
  platforms: {},
};

export const loadCooldownConfig = ({ filePath, logger }) => {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsedJson = JSON.parse(raw);
    const parsed = cooldownConfigSchema.safeParse(parsedJson);

    if (!parsed.success) {
      throw new AppError('Archivo de cooldowns invalido', {
        filePath,
        issues: parsed.error.issues,
      });
    }

    return {
      ...fallbackConfig,
      ...parsed.data,
      defaults: {
        ...fallbackConfig.defaults,
        ...(parsed.data.defaults ?? {}),
      },
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger?.warn({ filePath }, 'Archivo de cooldowns no encontrado, usando fallback');
      return fallbackConfig;
    }

    if (error instanceof SyntaxError) {
      throw new AppError('JSON invalido en archivo de cooldowns', {
        filePath,
        error: error.message,
      });
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('No se pudo cargar configuracion de cooldowns', {
      filePath,
      error: error.message,
    });
  }
};
