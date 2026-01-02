import { GRID_SIZE } from '../constants/grid';

// Grid snapping utilities
export const snapToGridSize = (value, gridSize) => Math.round(value / gridSize) * gridSize;
export const snapToGrid = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE;

// Distance calculation
export const distance = (p1, p2) => Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

// Unit conversions (higher precision - don't round)
export const pixelsToFeet = (pixels) => pixels / GRID_SIZE / 2;
export const feetToPixels = (feet) => parseFloat(feet) * GRID_SIZE * 2;
export const inchesToFeet = (inches) => inches / 12;
export const feetToInches = (feet) => parseFloat(feet) * 12;

// Generate unique ID
export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Parse feet-inches input with fraction support
// Accepts: "14'-6 1/2"", "14-6.5", "14' 6 3/4", "6 1/2"", "1/2"", "14.5", etc.
export const parseFeetInches = (input) => {
  if (typeof input === 'number') return input;
  let str = String(input).trim();

  // Normalize quote characters
  str = str.replace(/['']/g, "'").replace(/[""]/g, '"');

  // Helper to parse fraction
  const parseFraction = (fracStr) => {
    if (!fracStr) return 0;
    const fracMatch = fracStr.match(/(\d+)\/(\d+)/);
    if (fracMatch) {
      return parseInt(fracMatch[1], 10) / parseInt(fracMatch[2], 10);
    }
    return 0;
  };

  // Pattern: feet-inches fraction (e.g., "14'-6 1/2"")
  const feetInchesFracMatch = str.match(/^(\d+)[''\s\-]+(\d+)\s+(\d+\/\d+)[""]?$/);
  if (feetInchesFracMatch) {
    const feet = parseInt(feetInchesFracMatch[1], 10);
    const inches = parseInt(feetInchesFracMatch[2], 10);
    const frac = parseFraction(feetInchesFracMatch[3]);
    return feet + (inches + frac) / 12;
  }

  // Pattern: feet-inches decimal (e.g., "14'-6.5"")
  const feetInchesDecMatch = str.match(/^(\d+)[''\s\-]+(\d+\.?\d*)[""]?$/);
  if (feetInchesDecMatch) {
    const feet = parseInt(feetInchesDecMatch[1], 10);
    const inches = parseFloat(feetInchesDecMatch[2]);
    return feet + inches / 12;
  }

  // Pattern: just inches with fraction (e.g., "6 1/2"")
  const inchesFracMatch = str.match(/^(\d+)\s+(\d+\/\d+)[""]?$/);
  if (inchesFracMatch) {
    const inches = parseInt(inchesFracMatch[1], 10);
    const frac = parseFraction(inchesFracMatch[2]);
    return (inches + frac) / 12;
  }

  // Pattern: just fraction inches (e.g., "1/2"")
  const justFracMatch = str.match(/^(\d+\/\d+)[""]?$/);
  if (justFracMatch) {
    return parseFraction(justFracMatch[1]) / 12;
  }

  // Pattern: just feet (e.g., "14'" or "14")
  const justFeetMatch = str.match(/^(\d+\.?\d*)['']?$/);
  if (justFeetMatch) {
    return parseFloat(justFeetMatch[1]);
  }

  // Pattern: decimal feet
  const decimalMatch = str.match(/^(\d+\.?\d*)$/);
  if (decimalMatch) {
    return parseFloat(decimalMatch[1]);
  }

  return parseFloat(str) || 0;
};

// Format measurement based on units
export const formatMeasurement = (feet, units = 'imperial') => {
  if (units === 'metric') {
    const meters = feet * 0.3048;
    return meters < 1
      ? `${Math.round(meters * 100)} cm`
      : `${meters.toFixed(2)} m`;
  }

  // Imperial
  const wholeFeet = Math.floor(feet);
  const remainingInches = (feet - wholeFeet) * 12;
  const wholeInches = Math.floor(remainingInches);
  const fraction = remainingInches - wholeInches;

  // Convert fraction to nearest 1/16
  const sixteenths = Math.round(fraction * 16);
  let fracStr = '';
  if (sixteenths > 0 && sixteenths < 16) {
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const d = gcd(sixteenths, 16);
    fracStr = ` ${sixteenths / d}/${16 / d}`;
  }

  if (wholeFeet === 0) {
    return `${wholeInches}${fracStr}"`;
  }
  if (wholeInches === 0 && !fracStr) {
    return `${wholeFeet}'`;
  }
  return `${wholeFeet}'-${wholeInches}${fracStr}"`;
};
