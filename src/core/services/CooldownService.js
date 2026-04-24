export class CooldownService {
  // Configuración de cooldowns por comando (en segundos)
  static DEFAULT_COOLDOWNS = {
    luz: 5,
    funa: 8,
    ia: 20,
  };

  constructor({ db, logger, cooldownConfig = {} }) {
    this.db = db;
    this.logger = logger;
    this.cooldownConfig = {
      ...CooldownService.DEFAULT_COOLDOWNS,
      ...cooldownConfig,
    };
  }

  /**
   * Obtiene el cooldown configurado para un comando.
   */
  getCooldownDuration(commandName) {
    return this.cooldownConfig[commandName] || 5; // Default 5 segundos
  }

  /**
   * Chequea si un comando está en cooldown.
   * Retorna { onCooldown: boolean, remainingSeconds: number }
   */
  checkCooldown(commandName, scopeKey) {
    const cooldownDuration = this.getCooldownDuration(commandName);
    const now = Date.now();

    const record = this.db
      .prepare('SELECT last_used_at FROM command_cooldowns WHERE command_name = ? AND scope_key = ?')
      .get(commandName, scopeKey);

    if (!record) {
      return {
        onCooldown: false,
        remainingSeconds: 0,
      };
    }

    const lastUsedTime = Number(record.last_used_at);
    const elapsedSeconds = (now - lastUsedTime) / 1000;
    const remainingSeconds = Math.max(0, cooldownDuration - elapsedSeconds);

    return {
      onCooldown: remainingSeconds > 0,
      remainingSeconds: Math.ceil(remainingSeconds),
    };
  }

  /**
   * Registra el uso de un comando (actualiza timestamp de last_used_at).
   */
  recordUsage(commandName, scopeKey) {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO command_cooldowns (command_name, scope_key, last_used_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(command_name, scope_key) 
      DO UPDATE SET last_used_at = ?, updated_at = ?
    `);

    stmt.run(commandName, scopeKey, now, now, now, now, now);
  }

  /**
   * Limpia cooldown de un comando para un scope (útil para testing o override).
   */
  clearCooldown(commandName, scopeKey) {
    this.db
      .prepare('DELETE FROM command_cooldowns WHERE command_name = ? AND scope_key = ?')
      .run(commandName, scopeKey);
  }

  /**
   * Limpia todos los cooldowns (útil para reset completo).
   */
  clearAllCooldowns() {
    this.db.exec('DELETE FROM command_cooldowns');
  }
}
