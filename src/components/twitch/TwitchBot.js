import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { AppError } from '../../shared/errors/AppError.js';
import { TwitchTokenStore } from './TwitchTokenStore.js';

export class TwitchBot {
  constructor({
    clientId,
    clientSecret,
    accessToken,
    refreshToken,
    tokenExpiresIn,
    tokenFile,
    channels,
    commandPrefix,
    commandRegistry,
    logger,
  }) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiresIn = tokenExpiresIn;
    this.tokenStore = new TwitchTokenStore(tokenFile);
    this.channels = channels;
    this.commandPrefix = commandPrefix;
    this.commandRegistry = commandRegistry;
    this.logger = logger;
    this.chatClient = null;
  }

  async start() {
    const authProvider = await this.#createAuthProvider();

    this.chatClient = new ChatClient({
      authProvider,
      channels: this.channels,
    });

    this.chatClient.onMessage(async (channel, user, text, msg) => {
      await this.#onMessage(channel, user, text, msg);
    });

    await this.chatClient.connect();
    this.logger.info('Bot de Twitch conectado');
  }

  async stop() {
    if (!this.chatClient) {
      return;
    }

    await this.chatClient.quit();
    this.logger.info('Bot de Twitch desconectado');
  }

  async #createAuthProvider() {
    const persistedToken = await this.tokenStore.load();
    const bootstrapToken = persistedToken ?? {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken ?? null,
      expiresIn: this.tokenExpiresIn,
      obtainmentTimestamp: Date.now(),
    };

    if (!bootstrapToken.refreshToken) {
      throw new AppError(
        'TWITCH_REFRESH_TOKEN no configurado y no existe token persistido con refresh_token',
      );
    }

    const authProvider = new RefreshingAuthProvider({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });

    authProvider.onRefresh(async (_userId, token) => {
      await this.tokenStore.save(token);
      this.logger.info('Token de Twitch refrescado y persistido');
    });

    await authProvider.addUserForToken(bootstrapToken, ['chat']);

    return authProvider;
  }

  async #onMessage(channel, user, text, msg) {
    if (!text.startsWith(this.commandPrefix)) {
      return;
    }

    const payload = text.slice(this.commandPrefix.length).trim();
    const [commandName, ...args] = payload.split(/\s+/);

    if (!commandName) {
      return;
    }

    try {
      const userContext = {
        id: msg?.userInfo?.userId ?? user,
        username: user,
        displayName: msg?.userInfo?.displayName ?? user,
      };

      const result = await this.commandRegistry.execute(commandName.toLowerCase(), {
        platform: 'twitch',
        channel,
        user: userContext,
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
