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

      if (randomExpression.startsWith('when ')) {
        return this.#randomWhen(randomExpression.slice('when '.length), context);
      }

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

  #randomWhen(whenExpression, context) {
    const trimmed = String(whenExpression).trim();
    const rangeMatch = /^(\d+-\d+)\s+([\s\S]+)$/.exec(trimmed);

    if (!rangeMatch) {
      return '';
    }

    const rangeToken = rangeMatch[1];
    const rulesExpression = rangeMatch[2];

    if (!/^\d+-\d+$/.test(rangeToken)) {
      return '';
    }

    const [minRaw, maxRaw] = rangeToken.split('-');
    const min = Number(minRaw);
    const max = Number(maxRaw);

    if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
      return '';
    }

    const randomValue = this.#randomInt(min, max);
    const parsedRules = this.#parseWhenRules(rulesExpression);

    for (const rule of parsedRules.rules) {
      if (this.#matchesRule(randomValue, rule.operator, rule.compareTo)) {
        return this.#resolveWhenOutcome(rule.outcomeExpression, context);
      }
    }

    return this.#resolveWhenOutcome(parsedRules.fallbackExpression, context);
  }

  #parseWhenRules(rulesExpression) {
    const rules = [];
    let fallbackExpression = '';
    let index = 0;
    const source = String(rulesExpression);

    while (index < source.length) {
      index = this.#skipWhitespaces(source, index);

      if (index >= source.length) {
        break;
      }

      if (source.slice(index).startsWith('else')) {
        const afterElse = index + 4;

        if (afterElse === source.length || /\s/.test(source[afterElse])) {
          fallbackExpression = source.slice(afterElse).trim();
          break;
        }
      }

      const conditionMatch = /^(>=|<=|>|<|=|!=)\s*(-?\d+)\s*/.exec(source.slice(index));

      if (!conditionMatch) {
        break;
      }

      const operator = conditionMatch[1];
      const compareTo = Number(conditionMatch[2]);
      index += conditionMatch[0].length;

      const nextMarkerIndex = this.#findNextWhenMarker(source, index);
      const outcomeExpression = source.slice(index, nextMarkerIndex).trim();

      if (outcomeExpression) {
        rules.push({
          operator,
          compareTo,
          outcomeExpression,
        });
      }

      index = nextMarkerIndex;
    }

    return {
      rules,
      fallbackExpression,
    };
  }

  #findNextWhenMarker(source, fromIndex) {
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let parenthesisDepth = 0;

    for (let i = fromIndex; i < source.length; i += 1) {
      const char = source[i];

      if (!inDoubleQuote && char === "'") {
        inSingleQuote = !inSingleQuote;
        continue;
      }

      if (!inSingleQuote && char === '"') {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }

      if (inSingleQuote || inDoubleQuote) {
        continue;
      }

      if (char === '(') {
        parenthesisDepth += 1;
        continue;
      }

      if (char === ')') {
        parenthesisDepth = Math.max(0, parenthesisDepth - 1);
        continue;
      }

      if (parenthesisDepth > 0) {
        continue;
      }

      if (source.slice(i).startsWith('else')) {
        const afterElse = i + 4;

        if (afterElse === source.length || /\s/.test(source[afterElse])) {
          return i;
        }
      }

      if (/^(>=|<=|>|<|=|!=)\s*-?\d+/.test(source.slice(i))) {
        return i;
      }
    }

    return source.length;
  }

  #resolveWhenOutcome(rawOutcomeExpression, context) {
    const outcomeExpression = String(rawOutcomeExpression ?? '').trim();

    if (!outcomeExpression) {
      return '';
    }

    const singleQuoted = /^'([\s\S]*)'$/.exec(outcomeExpression);
    if (singleQuoted) {
      return singleQuoted[1];
    }

    const doubleQuoted = /^"([\s\S]*)"$/.exec(outcomeExpression);
    if (doubleQuoted) {
      return doubleQuoted[1];
    }

    return this.#evaluate(outcomeExpression, context);
  }

  #skipWhitespaces(source, index) {
    let current = index;

    while (current < source.length && /\s/.test(source[current])) {
      current += 1;
    }

    return current;
  }

  #matchesRule(value, operator, compareTo) {
    switch (operator) {
      case '>':
        return value > compareTo;
      case '>=':
        return value >= compareTo;
      case '<':
        return value < compareTo;
      case '<=':
        return value <= compareTo;
      case '=':
        return value === compareTo;
      case '!=':
        return value !== compareTo;
      default:
        return false;
    }
  }
}
