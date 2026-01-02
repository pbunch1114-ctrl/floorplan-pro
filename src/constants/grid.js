// Grid and measurement constants
export const GRID_SIZE = 20; // Base grid size in pixels (6" at default scale)

export const GRID_OPTIONS = {
  '6"': { size: 20, label: '6 inches', divisor: 2 },
  '3"': { size: 10, label: '3 inches', divisor: 4 },
  '1"': { size: 3.333, label: '1 inch', divisor: 12 },
  'off': { size: 1, label: 'No snapping', divisor: 24 },
};

export const DEFAULT_WALL_HEIGHT = 96; // 8 feet in inches
