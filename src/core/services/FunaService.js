export class FunaService {
  constructor({ db, logger }) {
    this.db = db;
    this.logger = logger;
  }

  /**
   * Registra un evento de funa: actor funea a target.
   */
  recordFunaEvent(actorIdentityId, targetUserId, platform, sourceMessageId = null) {
    const stmt = this.db.prepare(`
      INSERT INTO funa_events (actor_identity_id, target_user_id, platform, source_message_id, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(actorIdentityId, targetUserId, platform, sourceMessageId);

    this.logger?.info({
      actorIdentityId,
      targetUserId,
      platform,
    }, 'Evento de funa registrado');

    return result.lastInsertRowid;
  }

  /**
   * Obtiene el conteo de funas de un usuario.
   */
  getFunaCount(targetUserId) {
    const result = this.db
      .prepare('SELECT COUNT(*) as count FROM funa_events WHERE target_user_id = ?')
      .get(targetUserId);

    return result.count;
  }

  /**
   * Obtiene el histórico de funas de un usuario.
   * Retorna lista con información del actor, fecha, plataforma, etc.
   */
  getFunaHistory(targetUserId, limit = 10) {
    return this.db
      .prepare(`
        SELECT 
          fe.id,
          fe.created_at,
          fe.platform,
          i.username as actor_username,
          i.display_name as actor_display_name
        FROM funa_events fe
        JOIN identities i ON fe.actor_identity_id = i.id
        WHERE fe.target_user_id = ?
        ORDER BY fe.created_at DESC
        LIMIT ?
      `)
      .all(targetUserId, limit);
  }

  /**
   * Obtiene estadísticas de funas: quién más fune, quién es más funado, etc.
   */
  getFunaStats() {
    const mostFunedUsers = this.db
      .prepare(`
        SELECT 
          u.id,
          COUNT(*) as funa_count,
          GROUP_CONCAT(i.username) as usernames
        FROM funa_events fe
        JOIN users u ON fe.target_user_id = u.id
        JOIN identities i ON u.id = i.user_id
        GROUP BY u.id
        ORDER BY funa_count DESC
        LIMIT 10
      `)
      .all();

    const topFuners = this.db
      .prepare(`
        SELECT 
          i.id,
          i.username,
          i.display_name,
          COUNT(*) as funa_count
        FROM funa_events fe
        JOIN identities i ON fe.actor_identity_id = i.id
        GROUP BY i.id
        ORDER BY funa_count DESC
        LIMIT 10
      `)
      .all();

    return {
      mostFunedUsers,
      topFuners,
    };
  }

  /**
   * Limpia todos los eventos de funa (útil para testing).
   */
  clearAllEvents() {
    this.db.exec('DELETE FROM funa_events');
  }
}
