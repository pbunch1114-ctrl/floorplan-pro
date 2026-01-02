// Electrical symbols library

export const ELECTRICAL_LIBRARY = [
  // Outlets
  { id: 'outlet-standard', name: 'Standard Outlet', icon: '🔌', symbol: '⊡', category: 'outlet' },
  { id: 'outlet-gfci', name: 'GFCI Outlet', icon: '🔌', symbol: '⊡G', category: 'outlet' },
  { id: 'outlet-220v', name: '220V Outlet', icon: '⚡', symbol: '⊡⊡', category: 'outlet' },

  // Switches
  { id: 'switch-single', name: 'Single Switch', icon: '🔘', symbol: 'S', category: 'switch' },
  { id: 'switch-3way', name: '3-Way Switch', icon: '🔘', symbol: 'S3', category: 'switch' },
  { id: 'switch-dimmer', name: 'Dimmer Switch', icon: '🔆', symbol: 'SD', category: 'switch' },

  // Lights
  { id: 'light-ceiling', name: 'Ceiling Light', icon: '💡', symbol: '◯', category: 'light' },
  { id: 'light-recessed', name: 'Recessed Light', icon: '🔅', symbol: '⊙', category: 'light' },
  { id: 'light-pendant', name: 'Pendant Light', icon: '💡', symbol: '◎', category: 'light' },
  { id: 'light-fan', name: 'Ceiling Fan', icon: '🌀', symbol: '⊕', category: 'light' },

  // Safety
  { id: 'smoke-detector', name: 'Smoke Detector', icon: '🚨', symbol: 'SD', category: 'safety' },
  { id: 'co-detector', name: 'CO Detector', icon: '⚠️', symbol: 'CO', category: 'safety' },

  // Panels
  { id: 'panel-main', name: 'Main Panel', icon: '⚡', symbol: '▣', category: 'panel' },
  { id: 'panel-sub', name: 'Sub Panel', icon: '⚡', symbol: '▢', category: 'panel' },
];

export const ELECTRICAL_CATEGORIES = [
  { id: 'outlet', name: 'Outlets' },
  { id: 'switch', name: 'Switches' },
  { id: 'light', name: 'Lights' },
  { id: 'safety', name: 'Safety' },
  { id: 'panel', name: 'Panels' },
];
