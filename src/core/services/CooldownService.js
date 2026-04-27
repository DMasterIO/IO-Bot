export class CooldownService {
  static DEFAULT_RULE = {
    enabled: false,
    seconds: 5,
    scope: 'user_channel',
  };

  static SUPPORTED_SCOPES = new Set(['user_channel', 'channel', 'user_global', 'global']);

  constructor({ db, logger, cooldownConfig = {} }) {
    this.db = db;
    this.logger = logger;

    this.cooldownConfig = {
      defaults: this.#normalizeRule(cooldownConfig.defaults),
      platforms: cooldownConfig.platforms ?? {},
    };
  }

  /**
   * Regla de cooldown para plataforma+comando.
   */
  getRule(platform, commandName) {
    const defaults = this.cooldownConfig.defaults;
    const rawRule = this.cooldownConfig.platforms?.[platform]?.[commandName];

    if (!rawRule) {
      return defaults;
    }

    return this.#normalizeRule(rawRule, defaults);
  }

  /**
   * Evalúa cooldown para un comando en un contexto específico.
   */
  evaluateCooldown({ commandName, platform, context, ruleOverride = null }) {
    const rule = ruleOverride
      ? this.#normalizeRule(ruleOverride, this.cooldownConfig.defaults)
      : this.getRule(platform, commandName);

    if (!rule.enabled) {
      return {
        enabled: false,
        onCooldown: false,
        remainingSeconds: 0,
        scopeKey: null,
        rule,
      };
    }

    const scopeKey = this.buildScopeKey({ platform, scope: rule.scope, context });
    const check = this.#checkCooldown(commandName, scopeKey, rule.seconds);

    return {
      enabled: true,
      onCooldown: check.onCooldown,
      remainingSeconds: check.remainingSeconds,
      scopeKey,
      rule,
    };
  }

  /**
   * Registra uso de comando desde contexto/plataforma.
   */
  recordCommandUsage({ commandName, platform, context, ruleOverride = null }) {
    const rule = ruleOverride
      ? this.#normalizeRule(ruleOverride, this.cooldownConfig.defaults)
      : this.getRule(platform, commandName);

    if (!rule.enabled) {
      return false;
    }

    const scopeKey = this.buildScopeKey({ platform, scope: rule.scope, context });
    this.#recordUsage(commandName, scopeKey);

    return true;
  }

  /**
   * Construye la clave de scope según estrategia.
   */
  buildScopeKey({ platform, scope, context }) {
    const channelId = context?.channel ?? context?.guildId ?? 'global-channel';
    const userId = context?.user?.id ?? context?.user?.username ?? 'anonymous-user';

    switch (scope) {
      case 'channel':
        return `${platform}:channel:${channelId}`;
      case 'user_global':
        return `${platform}:user:${userId}`;
      case 'global':
        return `${platform}:global`;
      case 'user_channel':
      default:
        return `${platform}:channel:${channelId}:user:${userId}`;
    }
  }

  #checkCooldown(commandName, scopeKey, cooldownDurationSeconds) {
    const cooldownDuration = cooldownDurationSeconds;
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

  #recordUsage(commandName, scopeKey) {
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

  #normalizeRule(rule = {}, baseRule = CooldownService.DEFAULT_RULE) {
    const normalized = {
      enabled: rule.enabled ?? baseRule.enabled,
      seconds: rule.seconds ?? baseRule.seconds,
      scope: rule.scope ?? baseRule.scope,
    };

    if (!CooldownService.SUPPORTED_SCOPES.has(normalized.scope)) {
      this.logger?.warn?.(
        { scope: normalized.scope },
        'Scope de cooldown no soportado. Se usara user_channel',
      );
      normalized.scope = 'user_channel';
    }

    if (!Number.isFinite(normalized.seconds) || normalized.seconds <= 0) {
      this.logger?.warn?.(
        { seconds: normalized.seconds },
        'Duracion de cooldown invalida. Se usara 5 segundos',
      );
      normalized.seconds = 5;
    }

    return normalized;
  }
}
