import { loadConfig } from '../core/config/env.js';
import { loadCooldownConfig } from '../core/config/cooldown-config.js';
import { loadCustomCommandsConfig } from '../core/config/custom-commands-config.js';
import { createLogger } from '../core/logger/logger.js';
import { CommandRegistry } from '../core/commands/CommandRegistry.js';
import { DatabaseManager } from '../core/db/Database.js';
import { HueApiClient } from '../components/hue/HueApiClient.js';
import { HueLightService } from '../components/hue/HueLightService.js';
import { LightCommand } from '../components/twitch/commands/LightCommand.js';
import { FunaCommand } from '../components/twitch/commands/FunaCommand.js';
import { TwitchBot } from '../components/twitch/TwitchBot.js';
import { DiscordBot } from '../components/discord/DiscordBot.js';
import { IdentityService } from '../core/services/IdentityService.js';
import { CooldownService } from '../core/services/CooldownService.js';
import { FunaService } from '../core/services/FunaService.js';
import { CustomCommandTemplateService } from '../core/services/CustomCommandTemplateService.js';
import { TwitchCustomCommand } from '../components/twitch/commands/TwitchCustomCommand.js';

export class Application {
  constructor() {
    this.config = loadConfig();
    this.logger = createLogger(this.config.logLevel);
    this.databaseManager = null;
    this.instances = [];
  }

  async start() {
    // Inicializar base de datos
    this.databaseManager = new DatabaseManager({
      dbPath: 'data/io-bot.db',
      logger: this.logger,
    });
    await this.databaseManager.initialize();
    const db = this.databaseManager.getDb();
    const cooldownConfig = loadCooldownConfig({
      filePath: this.config.cooldown.configFile,
      logger: this.logger,
    });
    const customCommandsConfig = loadCustomCommandsConfig({
      filePath: this.config.customCommands.configFile,
      logger: this.logger,
    });

    // Inicializar servicios de identidad, cooldown y funa
    const identityService = new IdentityService({
      db,
      logger: this.logger,
      similarityThreshold: 0.85,
    });

    const cooldownService = new CooldownService({
      db,
      logger: this.logger,
      cooldownConfig,
    });

    const funaService = new FunaService({
      db,
      logger: this.logger,
    });

    const customCommandTemplateService = new CustomCommandTemplateService();

    // Inicializar Hue
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

    // Registrar comandos
    const commandRegistry = new CommandRegistry({
      cooldownService,
      logger: this.logger,
    });
    commandRegistry.register(
      new LightCommand({
        hueLightService,
      }),
    );
    commandRegistry.register(
      new FunaCommand({
        identityService,
        funaService,
        logger: this.logger,
      }),
    );

    const twitchCustomCommands = customCommandsConfig.platforms?.twitch ?? {};

    for (const [commandName, definition] of Object.entries(twitchCustomCommands)) {
      if (!definition.enabled) {
        continue;
      }

      commandRegistry.register(
        new TwitchCustomCommand({
          name: commandName,
          aliases: definition.aliases ?? [],
          responseTemplate: definition.response,
          templateService: customCommandTemplateService,
        }),
      );
    }

    // Inicializar bots
    const twitchBot = new TwitchBot({
      clientId: this.config.twitch.clientId,
      clientSecret: this.config.twitch.clientSecret,
      accessToken: this.config.twitch.accessToken,
      refreshToken: this.config.twitch.refreshToken,
      tokenExpiresIn: this.config.twitch.tokenExpiresIn,
      tokenFile: this.config.twitch.tokenFile,
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
    if (this.instances.length > 0) {
      await Promise.all(this.instances.map((instance) => instance.stop()));
    }

    if (this.databaseManager) {
      await this.databaseManager.close();
    }

    this.logger.info('IO-Bot V2 detenido');
  }
}
