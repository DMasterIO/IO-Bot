import { describe, expect, it, vi } from 'vitest';
import Database from 'better-sqlite3';
import { CommandRegistry } from '../src/core/commands/CommandRegistry.js';
import { CooldownService } from '../src/core/services/CooldownService.js';
import { LightCommand } from '../src/components/twitch/commands/LightCommand.js';

function createTestDb() {
  const db = new Database(':memory:');

  db.exec(`
    CREATE TABLE command_cooldowns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command_name TEXT NOT NULL,
      scope_key TEXT NOT NULL,
      last_used_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(command_name, scope_key)
    );
  `);

  return db;
}

describe('Cooldown System', () => {
  it('aplica cooldown por usuario+canal cuando la regla lo define', async () => {
    const db = createTestDb();
    const cooldownService = new CooldownService({
      db,
      cooldownConfig: {
        defaults: { enabled: false, seconds: 5, scope: 'user_channel' },
        platforms: {
          twitch: {
            ping: { enabled: true, seconds: 60, scope: 'user_channel' },
          },
        },
      },
    });

    const commandRegistry = new CommandRegistry({ cooldownService });
    commandRegistry.register({
      name: 'ping',
      async execute() {
        return 'pong';
      },
    });

    const first = await commandRegistry.execute('ping', {
      platform: 'twitch',
      channel: '#canal',
      user: { id: 'u1', username: 'user1' },
      args: [],
    });

    const secondSameUser = await commandRegistry.execute('ping', {
      platform: 'twitch',
      channel: '#canal',
      user: { id: 'u1', username: 'user1' },
      args: [],
    });

    const thirdDifferentUser = await commandRegistry.execute('ping', {
      platform: 'twitch',
      channel: '#canal',
      user: { id: 'u2', username: 'user2' },
      args: [],
    });

    expect(first.message).toBe('pong');
    expect(secondSameUser.message).toContain('Espera');
    expect(thirdDifferentUser.message).toBe('pong');

    db.close();
  });

  it('permite definir estrategia channel para cooldown global por canal', async () => {
    const db = createTestDb();
    const cooldownService = new CooldownService({
      db,
      cooldownConfig: {
        defaults: { enabled: false, seconds: 5, scope: 'user_channel' },
        platforms: {
          twitch: {
            ping: { enabled: true, seconds: 60, scope: 'channel' },
          },
        },
      },
    });

    const commandRegistry = new CommandRegistry({ cooldownService });
    commandRegistry.register({
      name: 'ping',
      async execute() {
        return 'pong';
      },
    });

    const first = await commandRegistry.execute('ping', {
      platform: 'twitch',
      channel: '#canal',
      user: { id: 'u1', username: 'user1' },
      args: [],
    });

    const secondDifferentUser = await commandRegistry.execute('ping', {
      platform: 'twitch',
      channel: '#canal',
      user: { id: 'u2', username: 'user2' },
      args: [],
    });

    expect(first.message).toBe('pong');
    expect(secondDifferentUser.message).toContain('Espera');

    db.close();
  });

  it('no aplica cooldown cuando la regla está desactivada', async () => {
    const db = createTestDb();
    const cooldownService = new CooldownService({
      db,
      cooldownConfig: {
        defaults: { enabled: false, seconds: 5, scope: 'user_channel' },
        platforms: { twitch: {} },
      },
    });

    const commandRegistry = new CommandRegistry({ cooldownService });
    commandRegistry.register({
      name: 'ping',
      async execute() {
        return 'pong';
      },
    });

    const first = await commandRegistry.execute('ping', {
      platform: 'twitch',
      channel: '#canal',
      user: { id: 'u1', username: 'user1' },
      args: [],
    });

    const second = await commandRegistry.execute('ping', {
      platform: 'twitch',
      channel: '#canal',
      user: { id: 'u1', username: 'user1' },
      args: [],
    });

    expect(first.message).toBe('pong');
    expect(second.message).toBe('pong');

    db.close();
  });

  it('aplica cooldown al comando luz via middleware', async () => {
    const db = createTestDb();
    const cooldownService = new CooldownService({
      db,
      cooldownConfig: {
        defaults: { enabled: false, seconds: 5, scope: 'user_channel' },
        platforms: {
          twitch: {
            luz: { enabled: true, seconds: 60, scope: 'user_channel' },
          },
        },
      },
    });

    const hueLightService = {
      setColor: vi.fn().mockResolvedValue(undefined),
    };

    const commandRegistry = new CommandRegistry({ cooldownService });
    commandRegistry.register(new LightCommand({ hueLightService }));

    const first = await commandRegistry.execute('luz', {
      platform: 'twitch',
      channel: '#canal',
      user: { id: 'u1', username: 'user1' },
      args: ['azul'],
    });

    const second = await commandRegistry.execute('luz', {
      platform: 'twitch',
      channel: '#canal',
      user: { id: 'u1', username: 'user1' },
      args: ['azul'],
    });

    expect(first.message).toContain('Luces actualizadas');
    expect(second.message).toContain('Espera');
    expect(hueLightService.setColor).toHaveBeenCalledTimes(1);

    db.close();
  });

  it('prioriza cooldown definido en el comando sobre config global', async () => {
    const db = createTestDb();
    const cooldownService = new CooldownService({
      db,
      cooldownConfig: {
        defaults: { enabled: false, seconds: 5, scope: 'user_channel' },
        platforms: {
          twitch: {
            meme: { enabled: false, seconds: 5, scope: 'user_channel' },
          },
        },
      },
    });

    const commandRegistry = new CommandRegistry({ cooldownService });
    commandRegistry.register({
      name: 'meme',
      cooldown: { enabled: true, seconds: 60, scope: 'user_channel' },
      async execute() {
        return 'ok';
      },
    });

    const first = await commandRegistry.execute('meme', {
      platform: 'twitch',
      channel: '#canal',
      user: { id: 'u1', username: 'user1' },
      args: [],
    });

    const second = await commandRegistry.execute('meme', {
      platform: 'twitch',
      channel: '#canal',
      user: { id: 'u1', username: 'user1' },
      args: [],
    });

    expect(first.message).toBe('ok');
    expect(second.message).toContain('Espera');

    db.close();
  });
});
