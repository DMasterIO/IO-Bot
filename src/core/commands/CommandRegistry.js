export class CommandRegistry {
  constructor() {
    this.commands = new Map();
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

    const message = await command.execute(context);

    return {
      handled: true,
      message,
    };
  }
}
