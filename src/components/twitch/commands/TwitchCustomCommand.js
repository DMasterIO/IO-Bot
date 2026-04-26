export class TwitchCustomCommand {
  constructor({ name, aliases = [], responseTemplate, templateService, cooldown = null }) {
    this.name = name;
    this.aliases = aliases;
    this.responseTemplate = responseTemplate;
    this.templateService = templateService;
    this.cooldown = cooldown;
  }

  async execute(context) {
    return this.templateService.render(this.responseTemplate, context);
  }
}
