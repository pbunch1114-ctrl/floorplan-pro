// Wall types and construction details

export const WALL_THICKNESS_OPTIONS = {
  interior: { thickness: 6, label: 'Int 2×4', fullLabel: 'Interior 2×4', defaultHeight: 96, stud: '2x4' },
  exterior: { thickness: 10, label: 'Ext 2×6', fullLabel: 'Exterior 2×6', defaultHeight: 96, stud: '2x6' },
  partition: { thickness: 4, label: 'Partition', fullLabel: 'Partition', defaultHeight: 84, stud: '2x4' },
  'half-wall': { thickness: 6, label: 'Half', fullLabel: 'Half Wall', defaultHeight: 42, stud: '2x4' },
  'interior-2x6': { thickness: 8, label: 'Int 2×6', fullLabel: 'Interior 2×6', defaultHeight: 96, stud: '2x6' },
  'exterior-2x4': { thickness: 8, label: 'Ext 2×4', fullLabel: 'Exterior 2×4', defaultHeight: 96, stud: '2x4' },
};

// Wall construction layers (from outside/left to inside/right)
export const WALL_LAYERS = {
  'exterior': {
    layers: [
      { name: 'Siding', thickness: 1.2, color: '#8B7355', pattern: 'siding' },
      { name: 'House Wrap', thickness: 0.2, color: '#f0f0f0', pattern: 'solid' },
      { name: 'Sheathing', thickness: 0.8, color: '#C4A574', pattern: 'plywood' },
      { name: 'Insulation', thickness: 5.0, color: '#FFD1DC', pattern: 'insulation' },
      { name: 'Vapor Barrier', thickness: 0.2, color: '#87CEEB', pattern: 'solid' },
      { name: 'Drywall', thickness: 0.6, color: '#E8E4DF', pattern: 'solid' },
    ],
    studs: { spacing: 16, width: 1.5, depth: 5.5, color: '#DEB887' }
  },
  'exterior-2x4': {
    layers: [
      { name: 'Siding', thickness: 1.0, color: '#8B7355', pattern: 'siding' },
      { name: 'House Wrap', thickness: 0.2, color: '#f0f0f0', pattern: 'solid' },
      { name: 'Sheathing', thickness: 0.6, color: '#C4A574', pattern: 'plywood' },
      { name: 'Insulation', thickness: 3.2, color: '#FFD1DC', pattern: 'insulation' },
      { name: 'Vapor Barrier', thickness: 0.2, color: '#87CEEB', pattern: 'solid' },
      { name: 'Drywall', thickness: 0.6, color: '#E8E4DF', pattern: 'solid' },
    ],
    studs: { spacing: 16, width: 1.5, depth: 3.5, color: '#DEB887' }
  },
  'interior': {
    layers: [
      { name: 'Drywall', thickness: 0.6, color: '#E8E4DF', pattern: 'solid' },
      { name: 'Stud Cavity', thickness: 3.3, color: '#2a2a2a', pattern: 'cavity' },
      { name: 'Drywall', thickness: 0.6, color: '#E8E4DF', pattern: 'solid' },
    ],
    studs: { spacing: 16, width: 1.5, depth: 3.5, color: '#DEB887' }
  },
  'interior-2x6': {
    layers: [
      { name: 'Drywall', thickness: 0.6, color: '#E8E4DF', pattern: 'solid' },
      { name: 'Stud Cavity', thickness: 5.3, color: '#2a2a2a', pattern: 'cavity' },
      { name: 'Drywall', thickness: 0.6, color: '#E8E4DF', pattern: 'solid' },
    ],
    studs: { spacing: 16, width: 1.5, depth: 5.5, color: '#DEB887' }
  },
  'partition': {
    layers: [
      { name: 'Drywall', thickness: 0.5, color: '#E8E4DF', pattern: 'solid' },
      { name: 'Stud Cavity', thickness: 2.5, color: '#2a2a2a', pattern: 'cavity' },
      { name: 'Drywall', thickness: 0.5, color: '#E8E4DF', pattern: 'solid' },
    ],
    studs: { spacing: 24, width: 1.5, depth: 2.5, color: '#DEB887' }
  },
  'half-wall': {
    layers: [
      { name: 'Drywall', thickness: 0.6, color: '#E8E4DF', pattern: 'solid' },
      { name: 'Stud Cavity', thickness: 3.3, color: '#2a2a2a', pattern: 'cavity' },
      { name: 'Drywall', thickness: 0.6, color: '#E8E4DF', pattern: 'solid' },
    ],
    studs: { spacing: 16, width: 1.5, depth: 3.5, color: '#DEB887' }
  },
};

export const WALL_DETAIL_LEVELS = {
  simple: { label: 'Simple', description: 'Solid fill' },
  architectural: { label: 'Architectural', description: 'Clean B&W drafting' },
  standard: { label: 'Standard', description: 'Layer outlines' },
  detailed: { label: 'Detailed', description: 'Full construction' },
};
