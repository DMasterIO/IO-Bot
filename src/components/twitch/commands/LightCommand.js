import { resolveColorInput } from '../../../shared/colors/color-parser.js';

const HELP_MESSAGE =
  'Uso: !luz <color>. Ejemplos: !luz azul, !luz rojo, !luz #0F336F';

export class LightCommand {
  constructor({ hueLightService }) {
    this.name = 'luz';
    this.aliases = ['light'];
    this.hueLightService = hueLightService;
  }

  async execute({ args }) {
    if (args.length === 0) {
      return HELP_MESSAGE;
    }

    const colorInput = args[0];
    const color = resolveColorInput(colorInput);

    if (!color) {
      return `Color invalido: ${colorInput}. ${HELP_MESSAGE}`;
    }

    await this.hueLightService.setColor(color);

    return `Luces actualizadas a ${color.name} (${color.hex}).`;
  }
}
