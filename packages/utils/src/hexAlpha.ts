export const hexAlpha = (hex: string, alpha: number): string => {
  const cleanHex = hex.replace('#', '');
  const intColor = parseInt(cleanHex, 16);
  const r = (intColor >> 16) & 255;
  const g = (intColor >> 8) & 255;
  const b = intColor & 255;
  const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255);

  return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
};
