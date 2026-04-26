import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCustomCommandsConfig } from '../src/core/config/custom-commands-config.js';

describe('loadCustomCommandsConfig', () => {
  it('retorna fallback cuando el archivo no existe', () => {
    const result = loadCustomCommandsConfig({
      filePath: '/tmp/no-existe-custom-commands.json',
      logger: { warn: () => {} },
    });

    expect(result).toEqual({ platforms: {} });
  });

  it('carga config válida y aplica defaults del schema', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'custom-commands-'));
    const filePath = path.join(tmpDir, 'commands.json');

    fs.writeFileSync(filePath, JSON.stringify({
      platforms: {
        twitch: {
          meme: {
            response: 'hola ${user}',
          },
        },
      },
    }), 'utf8');

    const result = loadCustomCommandsConfig({
      filePath,
      logger: { warn: () => {} },
    });

    expect(result.platforms.twitch.meme.response).toBe('hola ${user}');
    expect(result.platforms.twitch.meme.enabled).toBe(true);
    expect(result.platforms.twitch.meme.aliases).toEqual([]);
  });
});
