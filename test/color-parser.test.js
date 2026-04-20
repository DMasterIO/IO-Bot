import { describe, expect, it } from 'vitest';
import { resolveColorInput } from '../src/shared/colors/color-parser.js';

describe('resolveColorInput', () => {
  it('resuelve un color basico en espanol', () => {
    const result = resolveColorInput('azul');

    expect(result).toMatchObject({
      name: 'azul',
      hex: '#0000ff',
      rgb: { r: 0, g: 0, b: 255 },
    });
  });

  it('resuelve un color hexadecimal valido', () => {
    const result = resolveColorInput('#0F336F');

    expect(result).toMatchObject({
      name: '#0f336f',
      hex: '#0f336f',
      rgb: { r: 15, g: 51, b: 111 },
    });
  });

  it('retorna null para valores invalidos', () => {
    expect(resolveColorInput('magenta-neon')).toBeNull();
    expect(resolveColorInput('#fff')).toBeNull();
    expect(resolveColorInput('')).toBeNull();
  });
});

