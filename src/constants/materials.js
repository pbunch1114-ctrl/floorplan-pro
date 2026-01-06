/**
 * Material constants for the Material Calculator
 */

export const MATERIAL_CATEGORIES = {
  FLOORING: 'flooring',
  PAINT: 'paint',
  DRYWALL: 'drywall',
  TILE: 'tile',
  INSULATION: 'insulation',
  CONCRETE: 'concrete',
  FRAMING: 'framing',
};

export const CATEGORY_LABELS = {
  [MATERIAL_CATEGORIES.FLOORING]: 'Flooring',
  [MATERIAL_CATEGORIES.PAINT]: 'Paint',
  [MATERIAL_CATEGORIES.DRYWALL]: 'Drywall',
  [MATERIAL_CATEGORIES.TILE]: 'Wall Tile',
  [MATERIAL_CATEGORIES.INSULATION]: 'Insulation',
  [MATERIAL_CATEGORIES.CONCRETE]: 'Concrete',
  [MATERIAL_CATEGORIES.FRAMING]: 'Wall Framing',
};

export const CATEGORY_ICONS = {
  [MATERIAL_CATEGORIES.FLOORING]: '🪵',
  [MATERIAL_CATEGORIES.PAINT]: '🎨',
  [MATERIAL_CATEGORIES.DRYWALL]: '🧱',
  [MATERIAL_CATEGORIES.TILE]: '🔲',
  [MATERIAL_CATEGORIES.INSULATION]: '🧤',
  [MATERIAL_CATEGORIES.CONCRETE]: '🪨',
  [MATERIAL_CATEGORIES.FRAMING]: '🪚',
};

// Individual material icons for realistic display
export const MATERIAL_ICONS = {
  // Flooring
  hardwood: '🪵',
  vinyl_plank: '📋',
  tile_12x12: '🔲',
  tile_18x18: '🔳',
  carpet: '🧶',
  underlayment: '📜',
  baseboards: '📏',

  // Paint
  wall_paint: '🪣',
  wall_paint_2coat: '🪣',
  ceiling_paint: '🎨',
  primer: '🫗',
  painters_tape: '🔵',

  // Drywall
  drywall_walls: '📋',
  drywall_ceiling: '📋',
  joint_compound: '🪣',
  drywall_tape: '📜',
  drywall_screws: '🔩',

  // Wall Tile
  wall_tile: '🔲',
  thinset: '🧱',
  grout: '🧴',

  // Insulation
  batt_r13_walls: '🧻',
  batt_r30_ceiling: '🧻',
  blown_in: '💨',

  // Concrete
  concrete_yards: '🏗️',
  concrete_bags: '🛍️',
  rebar: '📏',
  wire_mesh: '🔗',
  gravel_base: '🪨',

  // Framing
  studs: '🪵',
  studs_2x4: '🪵',
  studs_2x6: '🪵',
  top_plates: '📐',
  top_plates_2x4: '📐',
  top_plates_2x6: '📐',
  bottom_plate: '📐',
  bottom_plate_2x4: '📐',
  bottom_plate_2x6: '📐',
  sheathing: '📦',
  sheathing_osb: '📦',
  framing_nails: '🔨',
  sheathing_nails: '🔨',
  blocking: '🧱',
  blocking_2x4: '🧱',
  blocking_2x6: '🧱',
};

// Default settings
export const DEFAULT_WALL_HEIGHT = 8; // feet
export const DEFAULT_WASTE_FACTOR = 0.10; // 10%
export const DEFAULT_CONCRETE_DEPTH = 4; // inches

// Coverage constants
export const COVERAGE = {
  // Flooring
  HARDWOOD_BOX_SQFT: 20,
  VINYL_PLANK_BOX_SQFT: 24,
  TILE_12X12_SQFT: 1,
  TILE_18X18_SQFT: 2.25,
  CARPET_SQYD: 9,
  UNDERLAYMENT_ROLL_SQFT: 100,

  // Paint
  WALL_PAINT_GALLON_SQFT: 350,
  CEILING_PAINT_GALLON_SQFT: 400,
  PRIMER_GALLON_SQFT: 300,
  PAINTERS_TAPE_ROLL_FT: 60,

  // Drywall
  DRYWALL_SHEET_SQFT: 32, // 4x8 sheet
  JOINT_COMPOUND_BUCKET_SHEETS: 30,
  DRYWALL_TAPE_ROLL_FT: 250,
  DRYWALL_SCREWS_LB_SQFT: 300,

  // Tile
  THINSET_BAG_SQFT: 80,
  GROUT_BAG_SQFT: 100,

  // Insulation
  BATT_R13_BUNDLE_SQFT: 40,
  BATT_R30_BUNDLE_SQFT: 30,
  BLOWN_IN_BAG_SQFT: 40,

  // Concrete
  CONCRETE_BAG_CUBIC_FT: 0.45, // 60lb bag
  REBAR_PIECE_SQFT: 16,
  WIRE_MESH_ROLL_SQFT: 150,

  // Framing
  STUD_SPACING_16OC: 16, // inches on center
  STUD_SPACING_24OC: 24, // inches on center
  STUD_LENGTH_FT: 8, // pre-cut studs for 8' walls
  PLATE_LENGTH_FT: 16, // standard 2x4 plate length
  SHEATHING_SHEET_SQFT: 32, // 4x8 sheet
  NAILS_PER_STUD: 6, // framing nails per stud
  NAILS_PER_LB: 50, // 16d nails per pound (approx)
  SCREWS_PER_SHEATHING_SHEET: 40, // screws per 4x8 sheet
};

// Material definitions with calculation info
export const MATERIALS = {
  [MATERIAL_CATEGORIES.FLOORING]: [
    {
      id: 'hardwood',
      name: 'Hardwood/Laminate',
      unit: 'boxes',
      unitSize: '20 sqft/box',
      calculate: (sqft, waste) => Math.ceil(sqft * (1 + waste) / COVERAGE.HARDWOOD_BOX_SQFT),
    },
    {
      id: 'vinyl_plank',
      name: 'Vinyl Plank',
      unit: 'boxes',
      unitSize: '24 sqft/box',
      calculate: (sqft, waste) => Math.ceil(sqft * (1 + waste) / COVERAGE.VINYL_PLANK_BOX_SQFT),
    },
    {
      id: 'tile_12x12',
      name: 'Tile (12"×12")',
      unit: 'pieces',
      unitSize: '1 sqft each',
      calculate: (sqft, waste) => Math.ceil(sqft * (1 + waste)),
    },
    {
      id: 'tile_18x18',
      name: 'Tile (18"×18")',
      unit: 'pieces',
      unitSize: '2.25 sqft each',
      calculate: (sqft, waste) => Math.ceil(sqft * (1 + waste) / COVERAGE.TILE_18X18_SQFT),
    },
    {
      id: 'carpet',
      name: 'Carpet',
      unit: 'sq yards',
      unitSize: '9 sqft/sqyd',
      calculate: (sqft, waste) => Math.ceil(sqft * (1 + waste) / COVERAGE.CARPET_SQYD),
    },
    {
      id: 'underlayment',
      name: 'Underlayment',
      unit: 'rolls',
      unitSize: '100 sqft/roll',
      calculate: (sqft) => Math.ceil(sqft / COVERAGE.UNDERLAYMENT_ROLL_SQFT),
    },
    {
      id: 'baseboards',
      name: 'Baseboards',
      unit: 'linear ft',
      unitSize: 'perimeter',
      calculate: (sqft, waste, perimeter) => Math.ceil(perimeter * (1 + waste)),
      usesPerimeter: true,
    },
  ],

  [MATERIAL_CATEGORIES.PAINT]: [
    {
      id: 'wall_paint',
      name: 'Wall Paint (1 coat)',
      unit: 'gallons',
      unitSize: '350 sqft/gal',
      calculate: (sqft, waste, perimeter, wallHeight) => {
        const wallArea = perimeter * wallHeight;
        return Math.ceil(wallArea / COVERAGE.WALL_PAINT_GALLON_SQFT);
      },
      usesWallArea: true,
    },
    {
      id: 'wall_paint_2coat',
      name: 'Wall Paint (2 coats)',
      unit: 'gallons',
      unitSize: '350 sqft/gal',
      calculate: (sqft, waste, perimeter, wallHeight) => {
        const wallArea = perimeter * wallHeight;
        return Math.ceil((wallArea * 2) / COVERAGE.WALL_PAINT_GALLON_SQFT);
      },
      usesWallArea: true,
    },
    {
      id: 'ceiling_paint',
      name: 'Ceiling Paint',
      unit: 'gallons',
      unitSize: '400 sqft/gal',
      calculate: (sqft) => Math.ceil(sqft / COVERAGE.CEILING_PAINT_GALLON_SQFT),
    },
    {
      id: 'primer',
      name: 'Primer',
      unit: 'gallons',
      unitSize: '300 sqft/gal',
      calculate: (sqft, waste, perimeter, wallHeight) => {
        const wallArea = perimeter * wallHeight;
        const totalArea = sqft + wallArea;
        return Math.ceil(totalArea / COVERAGE.PRIMER_GALLON_SQFT);
      },
      usesWallArea: true,
    },
    {
      id: 'painters_tape',
      name: "Painter's Tape",
      unit: 'rolls',
      unitSize: '60 ft/roll',
      calculate: (sqft, waste, perimeter) => Math.ceil(perimeter / COVERAGE.PAINTERS_TAPE_ROLL_FT),
      usesPerimeter: true,
    },
  ],

  [MATERIAL_CATEGORIES.DRYWALL]: [
    {
      id: 'drywall_walls',
      name: 'Drywall Sheets (Walls)',
      unit: 'sheets',
      unitSize: '4×8 ft (32 sqft)',
      calculate: (sqft, waste, perimeter, wallHeight) => {
        const wallArea = perimeter * wallHeight;
        return Math.ceil(wallArea / COVERAGE.DRYWALL_SHEET_SQFT);
      },
      usesWallArea: true,
    },
    {
      id: 'drywall_ceiling',
      name: 'Drywall Sheets (Ceiling)',
      unit: 'sheets',
      unitSize: '4×8 ft (32 sqft)',
      calculate: (sqft) => Math.ceil(sqft / COVERAGE.DRYWALL_SHEET_SQFT),
    },
    {
      id: 'joint_compound',
      name: 'Joint Compound',
      unit: '5-gal buckets',
      unitSize: '~30 sheets/bucket',
      calculate: (sqft, waste, perimeter, wallHeight) => {
        const wallArea = perimeter * wallHeight;
        const totalSheets = Math.ceil(wallArea / COVERAGE.DRYWALL_SHEET_SQFT) + Math.ceil(sqft / COVERAGE.DRYWALL_SHEET_SQFT);
        return Math.ceil(totalSheets / COVERAGE.JOINT_COMPOUND_BUCKET_SHEETS);
      },
      usesWallArea: true,
    },
    {
      id: 'drywall_tape',
      name: 'Drywall Tape',
      unit: 'rolls',
      unitSize: '250 ft/roll',
      calculate: (sqft, waste, perimeter, wallHeight) => {
        const wallArea = perimeter * wallHeight;
        const totalSheets = Math.ceil(wallArea / COVERAGE.DRYWALL_SHEET_SQFT) + Math.ceil(sqft / COVERAGE.DRYWALL_SHEET_SQFT);
        const linearFeet = totalSheets * 12; // ~12 ft of seams per sheet
        return Math.ceil(linearFeet / COVERAGE.DRYWALL_TAPE_ROLL_FT);
      },
      usesWallArea: true,
    },
    {
      id: 'drywall_screws',
      name: 'Drywall Screws',
      unit: 'lbs',
      unitSize: '~300 sqft/lb',
      calculate: (sqft, waste, perimeter, wallHeight) => {
        const wallArea = perimeter * wallHeight;
        const totalArea = sqft + wallArea;
        return Math.ceil(totalArea / COVERAGE.DRYWALL_SCREWS_LB_SQFT);
      },
      usesWallArea: true,
    },
  ],

  [MATERIAL_CATEGORIES.TILE]: [
    {
      id: 'wall_tile',
      name: 'Wall Tile',
      unit: 'sqft',
      unitSize: '+15% waste',
      calculate: (sqft, waste, perimeter, wallHeight) => {
        const wallArea = perimeter * wallHeight;
        return Math.ceil(wallArea * 1.15);
      },
      usesWallArea: true,
    },
    {
      id: 'thinset',
      name: 'Thinset Mortar',
      unit: '50-lb bags',
      unitSize: '80 sqft/bag',
      calculate: (sqft, waste, perimeter, wallHeight) => {
        const wallArea = perimeter * wallHeight;
        return Math.ceil(wallArea / COVERAGE.THINSET_BAG_SQFT);
      },
      usesWallArea: true,
    },
    {
      id: 'grout',
      name: 'Grout',
      unit: '25-lb bags',
      unitSize: '100 sqft/bag',
      calculate: (sqft, waste, perimeter, wallHeight) => {
        const wallArea = perimeter * wallHeight;
        return Math.ceil(wallArea / COVERAGE.GROUT_BAG_SQFT);
      },
      usesWallArea: true,
    },
  ],

  [MATERIAL_CATEGORIES.INSULATION]: [
    {
      id: 'batt_r13_walls',
      name: 'Batt R-13 (Walls)',
      unit: 'bundles',
      unitSize: '40 sqft/bundle',
      calculate: (sqft, waste, perimeter, wallHeight) => {
        const wallArea = perimeter * wallHeight;
        return Math.ceil(wallArea / COVERAGE.BATT_R13_BUNDLE_SQFT);
      },
      usesWallArea: true,
    },
    {
      id: 'batt_r30_ceiling',
      name: 'Batt R-30 (Ceiling)',
      unit: 'bundles',
      unitSize: '30 sqft/bundle',
      calculate: (sqft) => Math.ceil(sqft / COVERAGE.BATT_R30_BUNDLE_SQFT),
    },
    {
      id: 'blown_in',
      name: 'Blown-in (Ceiling)',
      unit: 'bags',
      unitSize: '40 sqft/bag',
      calculate: (sqft) => Math.ceil(sqft / COVERAGE.BLOWN_IN_BAG_SQFT),
    },
  ],

  [MATERIAL_CATEGORIES.CONCRETE]: [
    {
      id: 'concrete_yards',
      name: 'Ready-Mix Concrete',
      unit: 'cubic yards',
      unitSize: 'for 4" depth',
      calculate: (sqft, waste, perimeter, wallHeight, concreteDepth = 4) => {
        const depthFeet = concreteDepth / 12;
        const cubicYards = (sqft * depthFeet) / 27;
        return Math.ceil(cubicYards * 10) / 10; // Round to 0.1
      },
      usesConcreteDepth: true,
    },
    {
      id: 'concrete_bags',
      name: 'Concrete Bags (60 lb)',
      unit: 'bags',
      unitSize: '0.45 cu ft/bag',
      calculate: (sqft, waste, perimeter, wallHeight, concreteDepth = 4) => {
        const depthFeet = concreteDepth / 12;
        const cubicFeet = sqft * depthFeet;
        return Math.ceil(cubicFeet / COVERAGE.CONCRETE_BAG_CUBIC_FT);
      },
      usesConcreteDepth: true,
    },
    {
      id: 'rebar',
      name: 'Rebar (#4)',
      unit: 'pieces',
      unitSize: '20 ft lengths',
      calculate: (sqft) => Math.ceil(sqft / COVERAGE.REBAR_PIECE_SQFT),
    },
    {
      id: 'wire_mesh',
      name: 'Wire Mesh',
      unit: 'rolls',
      unitSize: '150 sqft/roll',
      calculate: (sqft) => Math.ceil(sqft / COVERAGE.WIRE_MESH_ROLL_SQFT),
    },
    {
      id: 'gravel_base',
      name: 'Gravel Base (4")',
      unit: 'cubic yards',
      unitSize: 'for 4" base',
      calculate: (sqft) => {
        const cubicYards = (sqft * 0.33) / 27;
        return Math.ceil(cubicYards * 10) / 10;
      },
    },
  ],

  // Framing - Note: When walls are drawn, the calculator uses calculateFramingFromWalls()
  // which analyzes wall types and calculates specific 2x4/2x6 materials automatically.
  // These entries are only used as fallback for manual entry mode.
  [MATERIAL_CATEGORIES.FRAMING]: [
    {
      id: 'studs',
      name: 'Wall Studs (16" OC)',
      unit: 'pieces',
      unitSize: 'Based on wall type',
      calculate: (sqft, waste, perimeter) => {
        const linearInches = perimeter * 12;
        const studsFromSpacing = Math.ceil(linearInches / COVERAGE.STUD_SPACING_16OC) + 1;
        const corners = 4;
        const extraForCorners = corners * 2;
        return Math.ceil((studsFromSpacing + extraForCorners) * 1.1);
      },
      usesPerimeter: true,
    },
    {
      id: 'top_plates',
      name: 'Top Plates (double)',
      unit: 'linear ft',
      unitSize: 'Based on wall type',
      calculate: (sqft, waste, perimeter) => {
        return Math.ceil(perimeter * 2 * 1.1);
      },
      usesPerimeter: true,
    },
    {
      id: 'bottom_plate',
      name: 'Bottom Plate',
      unit: 'linear ft',
      unitSize: 'Based on wall type',
      calculate: (sqft, waste, perimeter) => {
        return Math.ceil(perimeter * 1.1);
      },
      usesPerimeter: true,
    },
    {
      id: 'sheathing',
      name: 'Wall Sheathing',
      unit: 'sheets',
      unitSize: '4×8 ft (32 sqft)',
      calculate: (sqft, waste, perimeter, wallHeight) => {
        const wallArea = perimeter * wallHeight;
        return Math.ceil(wallArea * 1.1 / COVERAGE.SHEATHING_SHEET_SQFT);
      },
      usesWallArea: true,
    },
    {
      id: 'framing_nails',
      name: 'Framing Nails (16d)',
      unit: 'lbs',
      unitSize: '~50 nails/lb',
      calculate: (sqft, waste, perimeter) => {
        const linearInches = perimeter * 12;
        const studs = Math.ceil(linearInches / COVERAGE.STUD_SPACING_16OC) + 1;
        const nailsNeeded = studs * COVERAGE.NAILS_PER_STUD;
        const plateNails = studs * 3 * 2;
        return Math.ceil((nailsNeeded + plateNails) / COVERAGE.NAILS_PER_LB);
      },
      usesPerimeter: true,
    },
    {
      id: 'blocking',
      name: 'Fire Blocking',
      unit: 'linear ft',
      unitSize: 'Based on wall type',
      calculate: (sqft, waste, perimeter) => {
        return Math.ceil(perimeter * 1.1);
      },
      usesPerimeter: true,
    },
  ],
};
