// Paper sizes in pixels (at 96 DPI)
export const PAPER_SIZES = {
  'letter': { width: 1056, height: 816, name: '8.5" × 11"' },
  'legal': { width: 1344, height: 816, name: '8.5" × 14"' },
  'tabloid': { width: 1632, height: 1056, name: '11" × 17"' },
  'arch-d': { width: 3456, height: 2304, name: '24" × 36"' },
};

// Architectural scale factors
// Maps scale notation to a multiplier for converting model coordinates to paper coordinates
// Our model uses SCALE = 10/3 pixels per inch
export const SCALE_MAP = {
  '1/8" = 1\'': 0.125 * 96 / (12 * (10/3)),
  '1/4" = 1\'': 0.25 * 96 / (12 * (10/3)),
  '3/8" = 1\'': 0.375 * 96 / (12 * (10/3)),
  '1/2" = 1\'': 0.5 * 96 / (12 * (10/3)),
  '1" = 1\'': 1 * 96 / (12 * (10/3)),
};

// Default sheet template
export const createDefaultSheet = (id, floorId) => ({
  id,
  sheetNumber: 'A01',
  sheetTitle: 'Floor Plan',
  size: 'letter',
  orientation: 'landscape',
  scale: '1/4" = 1\'',
  viewport: { x: 0, y: 0, zoom: 0.5 },
  titleBlockTemplate: 'standard',
  showTitleBlock: true,
  floorId,
});
