import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class DatabaseManager {
  constructor({ dbPath = 'data/io-bot.db', logger } = {}) {
    this.dbPath = dbPath;
    this.logger = logger;
    this.db = null;
  }

  async initialize() {
    // Asegurar que el directorio existe
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Abrir conexión
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');

    // Ejecutar migraciones
    await this.#runMigrations();

    this.logger?.info(`Base de datos inicializada en ${this.dbPath}`);
  }

  async #runMigrations() {
    // Crear tabla de migraciones si no existe
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationsDir = path.join(__dirname, 'migrations');

    // Obtener archivos de migración
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.js'));

    for (const file of files) {
      const migrationName = path.basename(file, '.js');
      const alreadyRun = this.db
        .prepare('SELECT COUNT(*) as count FROM migrations WHERE name = ?')
        .get(migrationName);

      if (alreadyRun.count === 0) {
        const migrationPath = path.join(migrationsDir, file);
        const { default: migration } = await import(`file://${migrationPath}`);

        this.logger?.info(`Ejecutando migración: ${migrationName}`);
        migration(this.db);

        this.db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migrationName);
        this.logger?.info(`Migración completada: ${migrationName}`);
      }
    }
  }

  getDb() {
    if (!this.db) {
      throw new Error('Database no ha sido inicializada. Llama a initialize() primero.');
    }
    return this.db;
  }

  async close() {
    if (this.db) {
      this.db.close();
      this.logger?.info('Base de datos cerrada');
    }
  }
}
