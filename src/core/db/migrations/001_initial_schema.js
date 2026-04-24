export default function (db) {
  // Tabla de usuarios canónicos
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de identidades (usuario de Twitch/Discord vinculado a un user_id)
  db.exec(`
    CREATE TABLE IF NOT EXISTS identities (
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
    )
  `);

  // Tabla de eventos de funa
  db.exec(`
    CREATE TABLE IF NOT EXISTS funa_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_identity_id INTEGER NOT NULL,
      target_user_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      source_message_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (actor_identity_id) REFERENCES identities(id),
      FOREIGN KEY (target_user_id) REFERENCES users(id)
    )
  `);

  // Tabla de cooldowns de comandos
  db.exec(`
    CREATE TABLE IF NOT EXISTS command_cooldowns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command_name TEXT NOT NULL,
      scope_key TEXT NOT NULL,
      last_used_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(command_name, scope_key)
    )
  `);

  // Tabla de auditoría de merges de identidades
  db.exec(`
    CREATE TABLE IF NOT EXISTS identity_merges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_user_id INTEGER NOT NULL,
      target_user_id INTEGER NOT NULL,
      merged_by TEXT,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_user_id) REFERENCES users(id),
      FOREIGN KEY (target_user_id) REFERENCES users(id)
    )
  `);

  // Crear índices para queries frecuentes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_identities_user_id ON identities(user_id);
    CREATE INDEX IF NOT EXISTS idx_identities_platform_user_id ON identities(platform, platform_user_id);
    CREATE INDEX IF NOT EXISTS idx_funa_events_target_user_id ON funa_events(target_user_id);
    CREATE INDEX IF NOT EXISTS idx_funa_events_actor_identity_id ON funa_events(actor_identity_id);
    CREATE INDEX IF NOT EXISTS idx_funa_events_created_at ON funa_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_command_cooldowns_command_name ON command_cooldowns(command_name);
  `);
}
