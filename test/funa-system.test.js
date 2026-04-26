import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { IdentityService } from '../src/core/services/IdentityService.js';
import { CooldownService } from '../src/core/services/CooldownService.js';
import { FunaService } from '../src/core/services/FunaService.js';

// Crear base de datos en memoria para tests
function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');

  // Ejecutar schema
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE identities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      platform_user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      display_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(platform, platform_user_id)
    );

    CREATE TABLE funa_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_identity_id INTEGER NOT NULL,
      target_user_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      source_message_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (actor_identity_id) REFERENCES identities(id),
      FOREIGN KEY (target_user_id) REFERENCES users(id)
    );

    CREATE TABLE command_cooldowns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command_name TEXT NOT NULL,
      scope_key TEXT NOT NULL,
      last_used_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(command_name, scope_key)
    );

    CREATE TABLE migrations (
      id INTEGER PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_identities_user_id ON identities(user_id);
    CREATE INDEX idx_identities_platform_user_id ON identities(platform, platform_user_id);
    CREATE INDEX idx_funa_events_target_user_id ON funa_events(target_user_id);
    CREATE INDEX idx_command_cooldowns_command_name ON command_cooldowns(command_name);
  `);

  return db;
}

describe('Funa System', () => {
  it('IdentityService: crear identidades y encontrar matches', () => {
    const db = createTestDb();
    const identityService = new IdentityService({ db });

    // Crear primera identidad
    const id1 = identityService.getOrCreateIdentity('twitch', 'user123', 'juanperez', 'Juan Perez');
    expect(id1.id).toBeDefined();
    expect(id1.username).toBe('juanperez');
    expect(id1.user_id).toBe(1);

    // Crear segunda identidad (nombre diferente pero similar)
    const id2 = identityService.getOrCreateIdentity('twitch', 'user456', 'juan_perez', 'Juan P.');
    // Debe hacer auto-match porque "juan_perez" es similar a "juanperez"
    expect(id2.user_id).toBe(1);

    // Crear tercera identidad (nombre completamente diferente)
    const id3 = identityService.getOrCreateIdentity('twitch', 'user789', 'pedrolopez', 'Pedro Lopez');
    expect(id3.user_id).not.toBe(1);

    db.close();
  });

  it('IdentityService: búsqueda de usuarios similares', () => {
    const db = createTestDb();
    const identityService = new IdentityService({ db, similarityThreshold: 0.75 });

    // Crear varias identidades
    identityService.getOrCreateIdentity('twitch', 'u1', 'alice', 'Alice');
    identityService.getOrCreateIdentity('twitch', 'u2', 'alex', 'Alex');
    identityService.getOrCreateIdentity('twitch', 'u3', 'bob', 'Bob');

    // Buscar similares a "alice"
    const matches = identityService.findSimilarUsers('alice');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches[0].username).toBe('alice');

    // Buscar similares a "alic" (debería encontrar alice)
    const fuzzyMatches = identityService.findSimilarUsers('alic');
    expect(fuzzyMatches.some((m) => m.username === 'alice')).toBe(true);

    db.close();
  });

  it('IdentityService: crea identidad pendiente para usuario no registrado', () => {
    const db = createTestDb();
    const identityService = new IdentityService({ db });

    const unresolved = identityService.getOrCreateUnresolvedIdentity('twitch', 'lcjury');

    expect(unresolved.user_id).toBeDefined();
    expect(unresolved.platform).toBe('twitch');
    expect(unresolved.platform_user_id).toBe('unresolved:lcjury');
    expect(unresolved.username).toBe('lcjury');

    // Segunda invocación debe devolver la misma identidad pendiente.
    const unresolvedAgain = identityService.getOrCreateUnresolvedIdentity('twitch', 'lcjury');
    expect(unresolvedAgain.id).toBe(unresolved.id);

    db.close();
  });

  it('CooldownService: gestión de cooldowns', () => {
    const db = createTestDb();
    const cooldownService = new CooldownService({ db });

    // Primer uso: no está en cooldown
    const check1 = cooldownService.checkCooldown('funa', 'channel123:global');
    expect(check1.onCooldown).toBe(false);

    // Registrar uso
    cooldownService.recordUsage('funa', 'channel123:global');

    // Segundo uso inmediato: debe estar en cooldown
    const check2 = cooldownService.checkCooldown('funa', 'channel123:global');
    expect(check2.onCooldown).toBe(true);
    expect(check2.remainingSeconds).toBeGreaterThan(0);
    expect(check2.remainingSeconds).toBeLessThanOrEqual(8); // funa tiene cooldown de 8s

    db.close();
  });

  it('FunaService: registro y conteo de funas', () => {
    const db = createTestDb();
    const identityService = new IdentityService({ db });
    const funaService = new FunaService({ db });

    // Crear identidades
    const actor = identityService.getOrCreateIdentity('twitch', 'actor1', 'attacker', 'Attacker');
    const target = identityService.getOrCreateIdentity('twitch', 'target1', 'victim', 'Victim');

    // Registrar funas
    funaService.recordFunaEvent(actor.id, target.user_id, 'twitch', 'msg1');
    funaService.recordFunaEvent(actor.id, target.user_id, 'twitch', 'msg2');

    // Verificar conteo
    const count = funaService.getFunaCount(target.user_id);
    expect(count).toBe(2);

    // Obtener historial
    const history = funaService.getFunaHistory(target.user_id);
    expect(history.length).toBe(2);
    expect(history[0].actor_username).toBe('attacker');

    db.close();
  });

  it('FunaService: estadísticas de funas', () => {
    const db = createTestDb();
    const identityService = new IdentityService({ db });
    const funaService = new FunaService({ db });

    // Crear usuarios
    const actor1 = identityService.getOrCreateIdentity('twitch', 'a1', 'alice', 'Alice');
    const target1 = identityService.getOrCreateIdentity('twitch', 't1', 'bob', 'Bob');
    const target2 = identityService.getOrCreateIdentity('twitch', 't2', 'charlie', 'Charlie');

    // Generar funas
    funaService.recordFunaEvent(actor1.id, target1.user_id, 'twitch', 'msg');
    funaService.recordFunaEvent(actor1.id, target1.user_id, 'twitch', 'msg');
    funaService.recordFunaEvent(actor1.id, target2.user_id, 'twitch', 'msg');

    // Obtener estadísticas
    const stats = funaService.getFunaStats();
    expect(stats.mostFunedUsers.length).toBeGreaterThan(0);
    expect(stats.topFuners.length).toBeGreaterThan(0);

    // Bob debe estar como más funado
    const bobStats = stats.mostFunedUsers.find((u) => u.usernames.includes('bob'));
    expect(bobStats.funa_count).toBe(2);

    db.close();
  });
});
