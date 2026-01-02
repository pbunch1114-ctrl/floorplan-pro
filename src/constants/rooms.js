// Room presets and porch types

export const ROOM_PRESETS = [
  { name: 'Living Room', color: 'rgba(100, 200, 255, 0.15)' },
  { name: 'Bedroom', color: 'rgba(200, 150, 255, 0.15)' },
  { name: 'Kitchen', color: 'rgba(255, 200, 100, 0.15)' },
  { name: 'Bathroom', color: 'rgba(100, 255, 200, 0.15)' },
  { name: 'Dining Room', color: 'rgba(255, 150, 150, 0.15)' },
  { name: 'Office', color: 'rgba(150, 200, 150, 0.15)' },
  { name: 'Closet', color: 'rgba(200, 200, 200, 0.15)' },
  { name: 'Hallway', color: 'rgba(180, 180, 220, 0.15)' },
  { name: 'Garage', color: 'rgba(150, 150, 150, 0.15)' },
  { name: 'Laundry', color: 'rgba(150, 220, 255, 0.15)' },
];

export const PORCH_TYPES = {
  open: { name: 'Open Porch', color: 'rgba(139, 119, 101, 0.3)', hasRoof: true, hasScreens: false },
  screened: { name: 'Screened Porch', color: 'rgba(139, 119, 101, 0.4)', hasRoof: true, hasScreens: true },
  covered: { name: 'Covered Patio', color: 'rgba(120, 100, 80, 0.3)', hasRoof: true, hasScreens: false },
  deck: { name: 'Deck', color: 'rgba(160, 130, 90, 0.4)', hasRoof: false, hasScreens: false },
  patio: { name: 'Patio', color: 'rgba(140, 140, 140, 0.3)', hasRoof: false, hasScreens: false },
  sunroom: { name: 'Sunroom', color: 'rgba(200, 220, 255, 0.3)', hasRoof: true, hasScreens: false, hasGlass: true },
};
