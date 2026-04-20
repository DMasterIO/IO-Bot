const normalize = (value) => {
  const normalized = value / 255;

  return normalized > 0.04045
    ? ((normalized + 0.055) / 1.055) ** 2.4
    : normalized / 12.92;
};

// RGB to XY conversion adapted for Philips Hue gamut handling.
export const rgbToXy = ({ r, g, b }) => {
  const red = normalize(r);
  const green = normalize(g);
  const blue = normalize(b);

  const x = red * 0.649926 + green * 0.103455 + blue * 0.197109;
  const y = red * 0.234327 + green * 0.743075 + blue * 0.022598;
  const z = red * 0 + green * 0.053077 + blue * 1.035763;

  const sum = x + y + z;

  if (sum === 0) {
    return { x: 0.3127, y: 0.329 };
  }

  return {
    x: Number((x / sum).toFixed(4)),
    y: Number((y / sum).toFixed(4)),
  };
};
