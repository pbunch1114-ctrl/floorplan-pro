// Window types

export const WINDOW_TYPES = [
  { id: 'single-hung', name: 'Single Hung', defaultWidth: 36, defaultHeight: 48, icon: '⬆️', description: 'Bottom sash moves' },
  { id: 'double-hung', name: 'Double Hung', defaultWidth: 36, defaultHeight: 54, icon: '↕️', description: 'Both sashes move' },
  { id: 'casement', name: 'Casement', defaultWidth: 24, defaultHeight: 48, icon: '↪️', description: 'Hinged, cranks out' },
  { id: 'sliding', name: 'Sliding', defaultWidth: 48, defaultHeight: 36, icon: '↔️', description: 'Horizontal slide' },
  { id: 'fixed', name: 'Fixed/Picture', defaultWidth: 60, defaultHeight: 48, icon: '🖼️', description: 'Does not open' },
  { id: 'awning', name: 'Awning', defaultWidth: 36, defaultHeight: 24, icon: '⤴️', description: 'Hinged at top' },
  { id: 'bay', name: 'Bay Window', defaultWidth: 72, defaultHeight: 54, icon: '🪟', description: '3-panel angled' },
  { id: 'bow', name: 'Bow Window', defaultWidth: 84, defaultHeight: 54, icon: '🪟', description: 'Curved multi-panel' },
  { id: 'skylight', name: 'Skylight', defaultWidth: 24, defaultHeight: 48, icon: '☀️', description: 'Roof window' },
];
