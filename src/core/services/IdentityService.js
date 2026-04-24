import { levenshteinDistance } from '../../shared/string-utils.js';

export class IdentityService {
  constructor({ db, logger, similarityThreshold = 0.85 }) {
    this.db = db;
    this.logger = logger;
    this.similarityThreshold = similarityThreshold;
  }

  /**
   * Obtiene o crea una identidad para un usuario de plataforma.
   * Intenta hacer match automático con usuarios existentes si el nombre es similar.
   */
  getOrCreateIdentity(platform, platformUserId, username, displayName) {
    // Buscar identidad existente
    const existing = this.db
      .prepare('SELECT * FROM identities WHERE platform = ? AND platform_user_id = ?')
      .get(platform, platformUserId);

    if (existing) {
      return existing;
    }

    // No existe, intentar matching automático
    const normalizedUsername = this.#normalizeUsername(username);
    const candidates = this.#findCandidateMatches(normalizedUsername);

    let targetUserId;

    if (candidates.length === 1 && candidates[0].similarity >= this.similarityThreshold) {
      // Match automático seguro
      targetUserId = candidates[0].user_id;
      this.logger?.info({
        platform,
        platformUserId,
        username,
        targetUserId,
        similarity: candidates[0].similarity,
      }, 'Auto-matching de identidad');
    } else {
      // Sin match claro, crear nuevo usuario
      const newUser = this.db.prepare('INSERT INTO users (created_at, updated_at) VALUES (CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').run();
      targetUserId = newUser.lastInsertRowid;
    }

    // Crear identidad
    const stmt = this.db.prepare(`
      INSERT INTO identities (user_id, platform, platform_user_id, username, display_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    stmt.run(targetUserId, platform, platformUserId, username, displayName || username);

    const identity = this.db
      .prepare('SELECT * FROM identities WHERE platform = ? AND platform_user_id = ?')
      .get(platform, platformUserId);

    return identity;
  }

  /**
   * Crea (o recupera) una identidad "pendiente" basada solo en username.
   * Sirve cuando el usuario target no se ha visto aun en chat y no tenemos userId real.
   */
  getOrCreateUnresolvedIdentity(platform, username) {
    const normalized = this.#normalizeUsername(username);

    if (!normalized) {
      throw new Error('Username invalido para crear identidad pendiente');
    }

    const unresolvedPlatformUserId = `unresolved:${normalized}`;
    return this.getOrCreateIdentity(platform, unresolvedPlatformUserId, username, username);
  }

  /**
   * Encuentra usuarios similares a un nombre dado.
   * Devuelve lista de candidates con score de similitud.
   */
  findSimilarUsers(username) {
    const normalized = this.#normalizeUsername(username);
    const allIdentities = this.db
      .prepare('SELECT DISTINCT user_id, username FROM identities ORDER BY user_id')
      .all();

    const candidates = [];

    for (const identity of allIdentities) {
      const normalizedExisting = this.#normalizeUsername(identity.username);
      const similarity = this.#calculateSimilarity(normalized, normalizedExisting);

      if (similarity >= this.similarityThreshold) {
        candidates.push({
          user_id: identity.user_id,
          username: identity.username,
          similarity,
        });
      }
    }

    return candidates.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Merge manual: une source_user_id con target_user_id.
   * Todas las identidades de source apuntan a target, y source es marcado como merged.
   */
  mergeUsers(sourceUserId, targetUserId, mergedBy = 'system', reason = '') {
    if (sourceUserId === targetUserId) {
      throw new Error('No se puede mergear un usuario consigo mismo');
    }

    // Reasignar identidades de source a target
    const stmt = this.db.prepare('UPDATE identities SET user_id = ? WHERE user_id = ?');
    stmt.run(targetUserId, sourceUserId);

    // Registrar merge en auditoría
    this.db
      .prepare('INSERT INTO identity_merges (source_user_id, target_user_id, merged_by, reason, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)')
      .run(sourceUserId, targetUserId, mergedBy, reason);

    this.logger?.info({
      sourceUserId,
      targetUserId,
      mergedBy,
      reason,
    }, 'Identidades unificadas');
  }

  /**
   * Obtiene todas las identidades de un usuario.
   */
  getIdentitiesByUserId(userId) {
    return this.db
      .prepare('SELECT * FROM identities WHERE user_id = ? ORDER BY platform, created_at')
      .all(userId);
  }

  /**
   * Obtiene información completa de un usuario incluyendo todas sus identidades.
   */
  getUserWithIdentities(userId) {
    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      return null;
    }

    const identities = this.getIdentitiesByUserId(userId);

    return {
      ...user,
      identities,
    };
  }

  /**
   * Normaliza un nombre de usuario: minúsculas, sin caracteres especiales, etc.
   */
  #normalizeUsername(username) {
    const safeUsername = typeof username === 'string' ? username : '';

    return safeUsername
      .toLowerCase()
      .trim()
      .replace(/[_.-]/g, '')
      .replace(/\d+$/, ''); // Remove trailing digits
  }

  /**
   * Encuentra candidatos potenciales para match.
   */
  #findCandidateMatches(normalizedUsername) {
    const allIdentities = this.db
      .prepare('SELECT DISTINCT user_id, username FROM identities')
      .all();

    const candidates = [];

    for (const identity of allIdentities) {
      const normalized = this.#normalizeUsername(identity.username);
      const similarity = this.#calculateSimilarity(normalizedUsername, normalized);

      candidates.push({
        user_id: identity.user_id,
        username: identity.username,
        similarity,
      });
    }

    return candidates.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Calcula similitud Levenshtein normalizada (0-1).
   */
  #calculateSimilarity(str1, str2) {
    if (str1 === str2) {
      return 1;
    }

    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) {
      return 1;
    }

    const distance = levenshteinDistance(str1, str2);
    return 1 - distance / maxLen;
  }
}
