export class CommandRegistry {
  constructor({ cooldownService, logger } = {}) {
    this.commands = new Map();
    this.cooldownService = cooldownService;
    this.logger = logger;
  }

  register(command) {
    this.commands.set(command.name, command);

    if (command.aliases) {
      for (const alias of command.aliases) {
        this.commands.set(alias, command);
      }
    }
  }

  async execute(name, context) {
    const command = this.commands.get(name);

    if (!command) {
      return {
        handled: false,
        message: null,
      };
    }

    const cooldownEvaluation = this.cooldownService?.evaluateCooldown({
      commandName: command.name,
      platform: context?.platform,
      context,
      ruleOverride: command.cooldown ?? null,
    });

    if (cooldownEvaluation?.enabled && cooldownEvaluation.onCooldown) {
      return {
        handled: true,
        message: `Espera ${cooldownEvaluation.remainingSeconds}s antes de volver a usar !${command.name}.`,
      };
    }

    const message = await command.execute(context);

    if (cooldownEvaluation?.enabled) {
      this.cooldownService.recordCommandUsage({
        commandName: command.name,
        platform: context?.platform,
        context,
        ruleOverride: command.cooldown ?? null,
      });
    }

    return {
      handled: true,
      message,
    };
  }
}
