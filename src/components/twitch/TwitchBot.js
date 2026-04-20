import { StaticAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';

export class TwitchBot {
  constructor({ clientId, accessToken, channels, commandPrefix, commandRegistry, logger }) {
    this.commandPrefix = commandPrefix;
    this.commandRegistry = commandRegistry;
    this.logger = logger;

    const authProvider = new StaticAuthProvider(clientId, accessToken);

    this.chatClient = new ChatClient({
      authProvider,
      channels,
    });
  }

  async start() {
    this.chatClient.onMessage(async (channel, user, text) => {
      await this.#onMessage(channel, user, text);
    });

    await this.chatClient.connect();
    this.logger.info('Bot de Twitch conectado');
  }

  async stop() {
    await this.chatClient.quit();
    this.logger.info('Bot de Twitch desconectado');
  }

  async #onMessage(channel, user, text) {
    if (!text.startsWith(this.commandPrefix)) {
      return;
    }

    const payload = text.slice(this.commandPrefix.length).trim();
    const [commandName, ...args] = payload.split(/\s+/);

    if (!commandName) {
      return;
    }

    try {
      const result = await this.commandRegistry.execute(commandName.toLowerCase(), {
        channel,
        user,
        text,
        args,
      });

      if (result.handled && result.message) {
        await this.chatClient.say(channel, result.message);
      }
    } catch (error) {
      this.logger.error(
        {
          commandName,
          user,
          error: error.message,
        },
        'Error ejecutando comando de Twitch',
      );
      await this.chatClient.say(channel, 'No pude ejecutar ese comando en este momento.');
    }
  }
}
