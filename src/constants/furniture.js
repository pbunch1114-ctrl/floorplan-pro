// Furniture library

export const FURNITURE_LIBRARY = [
  // Bedroom
  { id: 'bed-king', name: 'King Bed', category: 'bedroom', width: 80, height: 76, icon: '🛏️', shape: 'bed' },
  { id: 'bed-queen', name: 'Queen Bed', category: 'bedroom', width: 60, height: 80, icon: '🛏️', shape: 'bed' },
  { id: 'bed-twin', name: 'Twin Bed', category: 'bedroom', width: 38, height: 75, icon: '🛏️', shape: 'bed' },
  { id: 'dresser', name: 'Dresser', category: 'bedroom', width: 60, height: 20, icon: '🗄️', shape: 'cabinet' },
  { id: 'nightstand', name: 'Nightstand', category: 'bedroom', width: 24, height: 24, icon: '🪑', shape: 'cabinet' },

  // Living Room
  { id: 'sofa-3', name: '3-Seat Sofa', category: 'living', width: 84, height: 36, icon: '🛋️', shape: 'sofa' },
  { id: 'sofa-2', name: 'Loveseat', category: 'living', width: 60, height: 36, icon: '🛋️', shape: 'sofa' },
  { id: 'armchair', name: 'Armchair', category: 'living', width: 36, height: 34, icon: '🪑', shape: 'chair' },
  { id: 'coffee-table', name: 'Coffee Table', category: 'living', width: 48, height: 24, icon: '🪵', shape: 'table' },
  { id: 'tv-stand', name: 'TV Stand', category: 'living', width: 60, height: 18, icon: '📺', shape: 'cabinet' },

  // Dining
  { id: 'dining-table-6', name: 'Dining Table (6)', category: 'dining', width: 72, height: 42, icon: '🪑', shape: 'table' },
  { id: 'dining-table-4', name: 'Dining Table (4)', category: 'dining', width: 48, height: 36, icon: '🪑', shape: 'table' },
  { id: 'dining-chair', name: 'Dining Chair', category: 'dining', width: 18, height: 18, icon: '🪑', shape: 'chair' },

  // Kitchen
  { id: 'fridge', name: 'Refrigerator', category: 'kitchen', width: 36, height: 30, icon: '🧊', shape: 'appliance' },
  { id: 'stove', name: 'Stove/Oven', category: 'kitchen', width: 30, height: 26, icon: '🍳', shape: 'stove' },
  { id: 'sink-kitchen', name: 'Kitchen Sink', category: 'kitchen', width: 33, height: 22, icon: '🚰', shape: 'sink' },
  { id: 'dishwasher', name: 'Dishwasher', category: 'kitchen', width: 24, height: 24, icon: '🫧', shape: 'appliance' },
  { id: 'counter-24', name: 'Counter 24"', category: 'kitchen', width: 24, height: 25, icon: '🔲', shape: 'counter' },
  { id: 'counter-36', name: 'Counter 36"', category: 'kitchen', width: 36, height: 25, icon: '🔲', shape: 'counter' },
  { id: 'counter-48', name: 'Counter 48"', category: 'kitchen', width: 48, height: 25, icon: '🔲', shape: 'counter' },
  { id: 'counter-60', name: 'Counter 60"', category: 'kitchen', width: 60, height: 25, icon: '🔲', shape: 'counter' },
  { id: 'counter-72', name: 'Counter 72"', category: 'kitchen', width: 72, height: 25, icon: '🔲', shape: 'counter' },
  { id: 'counter-corner', name: 'Corner Counter', category: 'kitchen', width: 36, height: 36, icon: '🔲', shape: 'counter-corner' },
  { id: 'island-small', name: 'Island (Small)', category: 'kitchen', width: 48, height: 30, icon: '🔲', shape: 'island' },
  { id: 'island-large', name: 'Island (Large)', category: 'kitchen', width: 72, height: 42, icon: '🔲', shape: 'island' },

  // Bathroom
  { id: 'toilet', name: 'Toilet', category: 'bathroom', width: 18, height: 28, icon: '🚽', shape: 'toilet' },
  { id: 'bathtub', name: 'Bathtub', category: 'bathroom', width: 60, height: 32, icon: '🛁', shape: 'tub' },
  { id: 'shower', name: 'Shower', category: 'bathroom', width: 36, height: 36, icon: '🚿', shape: 'shower' },
  { id: 'sink-bath', name: 'Bathroom Sink', category: 'bathroom', width: 24, height: 20, icon: '🚰', shape: 'sink' },

  // Office
  { id: 'desk', name: 'Desk', category: 'office', width: 60, height: 30, icon: '🖥️', shape: 'table' },
  { id: 'office-chair', name: 'Office Chair', category: 'office', width: 24, height: 24, icon: '🪑', shape: 'chair' },
  { id: 'bookshelf', name: 'Bookshelf', category: 'office', width: 36, height: 12, icon: '📚', shape: 'cabinet' },

  // Utility
  { id: 'washer', name: 'Washer', category: 'utility', width: 27, height: 27, icon: '🫧', shape: 'appliance' },
  { id: 'dryer', name: 'Dryer', category: 'utility', width: 27, height: 27, icon: '💨', shape: 'appliance' },
];

export const FURNITURE_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'bedroom', name: 'Bedroom' },
  { id: 'living', name: 'Living' },
  { id: 'dining', name: 'Dining' },
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'bathroom', name: 'Bathroom' },
  { id: 'office', name: 'Office' },
  { id: 'utility', name: 'Utility' },
];
