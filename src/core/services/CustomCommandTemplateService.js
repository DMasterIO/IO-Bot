export class CustomCommandTemplateService {
  render(template, context = {}) {
    if (!template || typeof template !== 'string') {
      return '';
    }

    return template
      .replace(/\$\{([^}]+)\}/g, (_match, expression) => this.#evaluate(expression, context))
      .replace(/\$\(([^)]+)\)/g, (_match, expression) => this.#evaluate(expression, context));
  }

  #evaluate(rawExpression, context) {
    const expression = String(rawExpression).trim();

    if (!expression) {
      return '';
    }

    if (expression === 'user') {
      return context?.user?.displayName ?? context?.user?.username ?? 'usuario';
    }

    if (expression === 'channel') {
      return context?.channel ?? '';
    }

    if (expression === 'args') {
      return Array.isArray(context?.args) ? context.args.join(' ') : '';
    }

    if (expression.startsWith('arg.')) {
      const index = Number(expression.slice(4));

      if (Number.isInteger(index) && index >= 0) {
        return context?.args?.[index] ?? '';
      }

      return '';
    }

    if (expression.startsWith('random.pick')) {
      return this.#randomPick(expression);
    }

    if (expression.startsWith('random.')) {
      const randomExpression = expression.slice('random.'.length);

      if (randomExpression === 'chatter') {
        return this.#randomChatter(context);
      }

      if (/^\d+-\d+$/.test(randomExpression)) {
        const [minRaw, maxRaw] = randomExpression.split('-');
        const min = Number(minRaw);
        const max = Number(maxRaw);

        if (Number.isFinite(min) && Number.isFinite(max) && max >= min) {
          return String(this.#randomInt(min, max));
        }
      }
    }

    return '';
  }

  #randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  #randomChatter(context) {
    const chatters = Array.isArray(context?.chatters) ? context.chatters.filter(Boolean) : [];

    if (chatters.length === 0) {
      return context?.user?.displayName ?? context?.user?.username ?? 'chat';
    }

    return chatters[this.#randomInt(0, chatters.length - 1)];
  }

  #randomPick(expression) {
    const picks = [];
    const pickRegex = /'([^']*)'|"([^"]*)"/g;
    let match;

    while ((match = pickRegex.exec(expression)) !== null) {
      picks.push(match[1] ?? match[2] ?? '');
    }

    if (picks.length === 0) {
      return '';
    }

    return picks[this.#randomInt(0, picks.length - 1)];
  }
}
