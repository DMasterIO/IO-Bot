export class TwitchCustomCommand {
  constructor({ name, aliases = [], responseTemplate, templateService }) {
    this.name = name;
    this.aliases = aliases;
    this.responseTemplate = responseTemplate;
    this.templateService = templateService;
  }

  async execute(context) {
    return this.templateService.render(this.responseTemplate, context);
  }
}
