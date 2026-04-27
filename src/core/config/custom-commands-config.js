import fs from 'node:fs';
import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError.js';

const commandSchema = z.object({
  enabled: z.boolean().default(true),
  response: z.string().min(1),
  aliases: z.array(z.string().min(1)).optional().default([]),
  cooldown: z
    .object({
      enabled: z.boolean().optional(),
      seconds: z.coerce.number().int().positive().max(3600).optional(),
      scope: z.enum(['user_channel', 'channel', 'user_global', 'global']).optional(),
    })
    .optional(),
});

const customCommandsConfigSchema = z.object({
  platforms: z.record(z.string(), z.record(z.string(), commandSchema)).default({}),
});

const fallbackConfig = {
  platforms: {},
};

export const loadCustomCommandsConfig = ({ filePath, logger }) => {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsedJson = JSON.parse(raw);
    const parsed = customCommandsConfigSchema.safeParse(parsedJson);

    if (!parsed.success) {
      throw new AppError('Archivo de custom commands invalido', {
        filePath,
        issues: parsed.error.issues,
      });
    }

    return {
      ...fallbackConfig,
      ...parsed.data,
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger?.warn({ filePath }, 'Archivo de custom commands no encontrado, usando fallback');
      return fallbackConfig;
    }

    if (error instanceof SyntaxError) {
      throw new AppError('JSON invalido en archivo de custom commands', {
        filePath,
        error: error.message,
      });
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('No se pudo cargar configuracion de custom commands', {
      filePath,
      error: error.message,
    });
  }
};
