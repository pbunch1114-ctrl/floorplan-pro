// Plumbing symbols library

export const PLUMBING_LIBRARY = [
  { id: 'water-heater', name: 'Water Heater', icon: '🔥', symbol: 'WH', size: 24 },
  { id: 'supply-hot', name: 'Hot Water Line', icon: '🔴', symbol: '─', lineType: 'hot' },
  { id: 'supply-cold', name: 'Cold Water Line', icon: '🔵', symbol: '─', lineType: 'cold' },
  { id: 'drain', name: 'Drain Line', icon: '⚫', symbol: '═', lineType: 'drain' },
  { id: 'vent', name: 'Vent Stack', icon: '🟤', symbol: '┃', lineType: 'vent' },
  { id: 'cleanout', name: 'Cleanout', icon: '🔧', symbol: 'CO', size: 12 },
  { id: 'shutoff', name: 'Shutoff Valve', icon: '🔴', symbol: '◆', size: 10 },
  { id: 'hose-bib', name: 'Hose Bib', icon: '🚿', symbol: 'HB', size: 12 },
  { id: 'floor-drain', name: 'Floor Drain', icon: '⬇️', symbol: '⊗', size: 14 },
  { id: 'sump-pump', name: 'Sump Pump', icon: '💧', symbol: 'SP', size: 20 },
];

export const PLUMBING_LINE_STYLES = {
  hot: { color: '#ff4444', dash: [], width: 2 },
  cold: { color: '#4444ff', dash: [], width: 2 },
  drain: { color: '#444444', dash: [], width: 3 },
  vent: { color: '#884400', dash: [8, 4], width: 2 },
};
