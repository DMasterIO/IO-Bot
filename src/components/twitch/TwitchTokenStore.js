import fs from 'node:fs/promises';
import path from 'node:path';

export class TwitchTokenStore {
  constructor(tokenFilePath) {
    this.tokenFilePath = path.resolve(process.cwd(), tokenFilePath);
  }

  async load() {
    try {
      const payload = await fs.readFile(this.tokenFilePath, 'utf-8');

      return JSON.parse(payload);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }

      throw error;
    }
  }

  async save(tokenData) {
    await fs.mkdir(path.dirname(this.tokenFilePath), { recursive: true });
    await fs.writeFile(this.tokenFilePath, `${JSON.stringify(tokenData, null, 2)}\n`, 'utf-8');
  }
}