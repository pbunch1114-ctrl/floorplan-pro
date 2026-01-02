// Roof types and pitches

export const ROOF_TYPES = {
  gable: { label: 'Gable', description: 'Two sloping sides meeting at ridge', icon: '⌂' },
  hip: { label: 'Hip', description: 'Slopes on all four sides', icon: '⌂' },
  shed: { label: 'Shed', description: 'Single sloping surface', icon: '/' },
  flat: { label: 'Flat', description: 'Level roof surface', icon: '▭' },
};

export const ROOF_PITCHES = {
  '3:12': { rise: 3, run: 12, label: '3:12 (14°)' },
  '4:12': { rise: 4, run: 12, label: '4:12 (18°)' },
  '5:12': { rise: 5, run: 12, label: '5:12 (23°)' },
  '6:12': { rise: 6, run: 12, label: '6:12 (27°)' },
  '8:12': { rise: 8, run: 12, label: '8:12 (34°)' },
  '10:12': { rise: 10, run: 12, label: '10:12 (40°)' },
  '12:12': { rise: 12, run: 12, label: '12:12 (45°)' },
};
