// Color utilities

// Adjust color brightness (positive = lighter, negative = darker)
export const adjustColor = (color, amount) => {
  // Handle hex colors
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = Math.min(255, Math.max(0, parseInt(hex.slice(0, 2), 16) + amount));
    const g = Math.min(255, Math.max(0, parseInt(hex.slice(2, 4), 16) + amount));
    const b = Math.min(255, Math.max(0, parseInt(hex.slice(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  // Handle rgb/rgba
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = Math.min(255, Math.max(0, parseInt(match[1]) + amount));
    const g = Math.min(255, Math.max(0, parseInt(match[2]) + amount));
    const b = Math.min(255, Math.max(0, parseInt(match[3]) + amount));
    return color.includes('rgba') ? color.replace(/rgba?\([^)]+/, `rgba(${r}, ${g}, ${b}`) : `rgb(${r}, ${g}, ${b})`;
  }
  return color;
};

// Parse color string to RGB components
export const parseColorToRGB = (color) => {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      return {
        r: parseInt(matches[0]),
        g: parseInt(matches[1]),
        b: parseInt(matches[2]),
      };
    }
  }
  return { r: 128, g: 128, b: 128 }; // Fallback to gray
};

// Convert RGB to RGBA string
export const rgbToRGBA = (r, g, b, a = 1) => `rgba(${r}, ${g}, ${b}, ${a})`;

// Hex to RGBA
export const hexToRGBA = (hex, alpha = 1) => {
  const { r, g, b } = parseColorToRGB(hex);
  return rgbToRGBA(r, g, b, alpha);
};
