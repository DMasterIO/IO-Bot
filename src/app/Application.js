import { loadConfig } from '../core/config/env.js';
import { createLogger } from '../core/logger/logger.js';
import { CommandRegistry } from '../core/commands/CommandRegistry.js';
import { HueApiClient } from '../components/hue/HueApiClient.js';
import { HueLightService } from '../components/hue/HueLightService.js';
import { LightCommand } from '../components/twitch/commands/LightCommand.js';
import { TwitchBot } from '../components/twitch/TwitchBot.js';
import { DiscordBot } from '../components/discord/DiscordBot.js';

export class Application {
  constructor() {
    this.config = loadConfig();
    this.logger = createLogger(this.config.logLevel);
    this.instances = [];
  }

  async start() {
    const hueApiClient = new HueApiClient({
      bridgeIp: this.config.hue.bridgeIp,
      appKey: this.config.hue.appKey,
      allowSelfSigned: this.config.hue.allowSelfSigned,
    });

    const hueLightService = new HueLightService({
      hueApiClient,
      defaultBrightness: this.config.hue.defaultBrightness,
      configuredLightIds: this.config.hue.lightIds,
      configuredGroupedLightIds: this.config.hue.groupedLightIds,
      logger: this.logger,
    });

    const commandRegistry = new CommandRegistry();
    commandRegistry.register(
      new LightCommand({
        hueLightService,
      }),
    );

    const twitchBot = new TwitchBot({
      clientId: this.config.twitch.clientId,
      accessToken: this.config.twitch.accessToken,
      channels: this.config.twitch.channels,
      commandPrefix: this.config.twitch.commandPrefix,
      commandRegistry,
      logger: this.logger,
    });

    const discordBot = new DiscordBot({
      token: this.config.discord.token,
      logger: this.logger,
    });

    this.instances = [twitchBot, discordBot];

    await Promise.all(this.instances.map((instance) => instance.start()));

    this.logger.info('IO-Bot V2 iniciado');
  }

  async stop() {
    if (this.instances.length === 0) {
      return;
    }

    await Promise.all(this.instances.map((instance) => instance.stop()));
    this.logger.info('IO-Bot V2 detenido');
  }
}
