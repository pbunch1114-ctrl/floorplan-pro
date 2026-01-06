// Text, dimension, and visual styles

// Font styles for dimensions and text annotations
export const FONT_STYLES = {
  modern: {
    name: 'Modern',
    fontFamily: '"SF Mono", "Consolas", monospace',
    letterSpacing: '0',
    fontWeight: 'bold',
    textTransform: 'none',
  },
  cityBlueprint: {
    name: 'City Blueprint',
    fontFamily: '"Courier New", "Lucida Console", monospace',
    letterSpacing: '0.15em',
    fontWeight: 'normal',
    textTransform: 'uppercase',
    // City Blueprint style characteristics: uppercase, spaced, technical look
  },
  architectural: {
    name: 'Architectural',
    fontFamily: '"Arial Narrow", "Helvetica", sans-serif',
    letterSpacing: '0.05em',
    fontWeight: 'normal',
    textTransform: 'uppercase',
  },
  handLettered: {
    name: 'Hand Lettered',
    fontFamily: '"Comic Sans MS", "Segoe Script", cursive',
    letterSpacing: '0.02em',
    fontWeight: 'normal',
    textTransform: 'none',
  },
};

export const TEXT_STYLES = {
  label: { name: 'Label', fontSize: 14, fontWeight: 'bold', color: '#ffffff', background: 'rgba(0,0,0,0.6)' },
  note: { name: 'Note', fontSize: 11, fontWeight: 'normal', color: '#ffaa00', background: 'rgba(0,0,0,0.4)' },
  title: { name: 'Title', fontSize: 18, fontWeight: 'bold', color: '#00c8ff', background: 'none' },
  callout: { name: 'Callout', fontSize: 12, fontWeight: 'normal', color: '#ff6666', background: 'rgba(255,100,100,0.15)' },
  dimension: { name: 'Dimension', fontSize: 10, fontWeight: 'normal', color: '#00ffaa', background: 'none' },
};

export const DIMENSION_STYLES = {
  standard: { color: '#00c8ff', tickSize: 8, fontSize: 11, offset: 25 },
  compact: { color: '#ffaa00', tickSize: 6, fontSize: 9, offset: 18 },
  bold: { color: '#00ffaa', tickSize: 10, fontSize: 13, offset: 30 },
};

export const LINE_TYPES = {
  solid: { name: 'Solid', dash: [] },
  dashed: { name: 'Dashed', dash: [10, 5] },
  dotted: { name: 'Dotted', dash: [2, 4] },
  centerline: { name: 'Center', dash: [20, 5, 5, 5] },
  hidden: { name: 'Hidden', dash: [8, 4] },
  property: { name: 'Property', dash: [15, 5, 3, 5] },
};

export const HATCH_PATTERNS = {
  concrete: { name: 'Concrete', color: '#888888', type: 'dots' },
  gravel: { name: 'Gravel', color: '#999966', type: 'gravel' },
  grass: { name: 'Grass', color: '#66aa66', type: 'grass' },
  pavement: { name: 'Pavement', color: '#666666', type: 'diagonal' },
  water: { name: 'Water', color: '#4488cc', type: 'waves' },
  earth: { name: 'Earth', color: '#886644', type: 'earth' },
  brick: { name: 'Brick', color: '#aa6644', type: 'brick' },
  tile: { name: 'Tile', color: '#aaaaaa', type: 'tile' },
  wood: { name: 'Wood', color: '#aa8855', type: 'wood' },
  insulation: { name: 'Insulation', color: '#ffaacc', type: 'insulation' },
  sand: { name: 'Sand', color: '#ddcc88', type: 'stipple' },
  stone: { name: 'Stone', color: '#778899', type: 'stone' },
};
