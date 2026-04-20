import { BASIC_COLOR_MAP } from './color-map.js';

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{6})$/;

const hexToRgb = (hexColor) => {
  const hex = hexColor.replace('#', '');

  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
};

export const resolveColorInput = (rawColorInput) => {
  if (!rawColorInput || typeof rawColorInput !== 'string') {
    return null;
  }

  const input = rawColorInput.trim().toLowerCase();

  if (HEX_COLOR_REGEX.test(input)) {
    return {
      name: input,
      hex: input,
      rgb: hexToRgb(input),
    };
  }

  const mappedHex = BASIC_COLOR_MAP[input];

  if (!mappedHex) {
    return null;
  }

  return {
    name: input,
    hex: mappedHex,
    rgb: hexToRgb(mappedHex),
  };
};
