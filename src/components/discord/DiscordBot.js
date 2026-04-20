import { Client, GatewayIntentBits } from 'discord.js';

export class DiscordBot {
  constructor({ token, logger }) {
    this.token = token;
    this.logger = logger;
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds],
    });
  }

  async start() {
    if (!this.token) {
      this.logger.info('DISCORD_TOKEN no configurado, omitiendo Discord');
      return;
    }

    this.client.once('ready', () => {
      this.logger.info({ botTag: this.client.user?.tag }, 'Bot de Discord conectado');
    });

    await this.client.login(this.token);
  }

  async stop() {
    this.client.destroy();
    this.logger.info('Bot de Discord detenido');
  }
}
