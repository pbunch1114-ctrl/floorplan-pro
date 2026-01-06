/**
 * Material calculation utilities
 */

import { MATERIALS, MATERIAL_CATEGORIES, DEFAULT_WALL_HEIGHT, DEFAULT_WASTE_FACTOR, DEFAULT_CONCRETE_DEPTH, COVERAGE } from '../constants/materials';
import { WALL_THICKNESS_OPTIONS } from '../constants/walls';

/**
 * Calculate all materials for a given category
 * @param {string} category - Material category
 * @param {number} sqft - Square footage
 * @param {number} perimeter - Perimeter in linear feet
 * @param {object} settings - Settings object with wallHeight, wasteFactor, concreteDepth
 * @returns {Array} Array of material results
 */
export const calculateMaterialsForCategory = (category, sqft, perimeter, settings = {}) => {
  const {
    wallHeight = DEFAULT_WALL_HEIGHT,
    wasteFactor = DEFAULT_WASTE_FACTOR,
    concreteDepth = DEFAULT_CONCRETE_DEPTH,
  } = settings;

  const materials = MATERIALS[category];
  if (!materials) return [];

  return materials.map(material => {
    const quantity = material.calculate(sqft, wasteFactor, perimeter, wallHeight, concreteDepth);
    return {
      id: material.id,
      name: material.name,
      quantity,
      unit: material.unit,
      unitSize: material.unitSize,
      usesPerimeter: material.usesPerimeter,
      usesWallArea: material.usesWallArea,
      usesConcreteDepth: material.usesConcreteDepth,
    };
  });
};

/**
 * Calculate all materials for all categories
 * @param {number} sqft - Square footage
 * @param {number} perimeter - Perimeter in linear feet
 * @param {object} settings - Settings object
 * @returns {Object} Object with category keys and material arrays
 */
export const calculateAllMaterials = (sqft, perimeter, settings = {}) => {
  const results = {};
  Object.values(MATERIAL_CATEGORIES).forEach(category => {
    results[category] = calculateMaterialsForCategory(category, sqft, perimeter, settings);
  });
  return results;
};

/**
 * Calculate room area from walls
 * Uses the shoelace formula for polygon area
 * @param {Array} walls - Array of wall objects with x1, y1, x2, y2
 * @param {number} scale - Scale factor (pixels per foot)
 * @returns {object} { sqft, perimeter }
 */
export const calculateRoomAreaFromWalls = (walls, scale = 50) => {
  if (!walls || walls.length < 3) {
    return { sqft: 0, perimeter: 0 };
  }

  // Get all unique points from walls
  const points = [];
  walls.forEach(wall => {
    const p1 = { x: wall.x1, y: wall.y1 };
    const p2 = { x: wall.x2, y: wall.y2 };

    // Add points if not already in array
    if (!points.some(p => Math.abs(p.x - p1.x) < 1 && Math.abs(p.y - p1.y) < 1)) {
      points.push(p1);
    }
    if (!points.some(p => Math.abs(p.x - p2.x) < 1 && Math.abs(p.y - p2.y) < 1)) {
      points.push(p2);
    }
  });

  // Sort points to form a polygon (simple convex hull approach)
  const center = points.reduce((acc, p) => ({ x: acc.x + p.x / points.length, y: acc.y + p.y / points.length }), { x: 0, y: 0 });
  points.sort((a, b) => {
    const angleA = Math.atan2(a.y - center.y, a.x - center.x);
    const angleB = Math.atan2(b.y - center.y, b.x - center.x);
    return angleA - angleB;
  });

  // Calculate area using shoelace formula
  let areaPixels = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    areaPixels += points[i].x * points[j].y;
    areaPixels -= points[j].x * points[i].y;
  }
  areaPixels = Math.abs(areaPixels) / 2;

  // Calculate perimeter
  let perimeterPixels = 0;
  walls.forEach(wall => {
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    perimeterPixels += Math.sqrt(dx * dx + dy * dy);
  });

  // Convert to feet
  const sqft = areaPixels / (scale * scale);
  const perimeter = perimeterPixels / scale;

  return {
    sqft: Math.round(sqft * 100) / 100,
    perimeter: Math.round(perimeter * 100) / 100,
  };
};

/**
 * Calculate area from a selection rectangle
 * @param {object} rect - Rectangle with x, y, width, height in pixels
 * @param {number} scale - Scale factor (pixels per foot)
 * @returns {object} { sqft, perimeter }
 */
export const calculateAreaFromSelection = (rect, scale = 50) => {
  const widthFeet = Math.abs(rect.width) / scale;
  const heightFeet = Math.abs(rect.height) / scale;

  const sqft = widthFeet * heightFeet;
  const perimeter = 2 * widthFeet + 2 * heightFeet;

  return {
    sqft: Math.round(sqft * 100) / 100,
    perimeter: Math.round(perimeter * 100) / 100,
    width: Math.round(widthFeet * 100) / 100,
    height: Math.round(heightFeet * 100) / 100,
  };
};

/**
 * Calculate total floor area from all walls
 * @param {Array} walls - Array of wall objects (with start/end or x1/y1/x2/y2)
 * @param {number} scale - Scale factor (pixels per foot)
 * @returns {object} { sqft, perimeter }
 */
export const calculateTotalFloorArea = (walls, scale = 50) => {
  if (!walls || walls.length === 0) {
    return { sqft: 0, perimeter: 0 };
  }

  // Handle both wall formats: {start, end} or {x1, y1, x2, y2}
  const getWallCoords = (wall) => {
    if (wall.start && wall.end) {
      return {
        x1: wall.start.x,
        y1: wall.start.y,
        x2: wall.end.x,
        y2: wall.end.y,
      };
    }
    return { x1: wall.x1, y1: wall.y1, x2: wall.x2, y2: wall.y2 };
  };

  // Find bounds of all walls
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let perimeterPixels = 0;

  walls.forEach(wall => {
    const coords = getWallCoords(wall);

    // Skip walls with invalid coordinates
    if (isNaN(coords.x1) || isNaN(coords.y1) || isNaN(coords.x2) || isNaN(coords.y2)) {
      return;
    }

    minX = Math.min(minX, coords.x1, coords.x2);
    minY = Math.min(minY, coords.y1, coords.y2);
    maxX = Math.max(maxX, coords.x1, coords.x2);
    maxY = Math.max(maxY, coords.y1, coords.y2);

    // Calculate wall length for perimeter
    const dx = coords.x2 - coords.x1;
    const dy = coords.y2 - coords.y1;
    perimeterPixels += Math.sqrt(dx * dx + dy * dy);
  });

  // If no valid walls found, return zeros
  if (minX === Infinity || maxX === -Infinity) {
    return { sqft: 0, perimeter: 0 };
  }

  const widthPixels = maxX - minX;
  const heightPixels = maxY - minY;

  const widthFeet = widthPixels / scale;
  const heightFeet = heightPixels / scale;

  return {
    sqft: Math.round(widthFeet * heightFeet * 100) / 100 || 0,
    perimeter: Math.round((perimeterPixels / scale) * 100) / 100 || 0,
  };
};

/**
 * Analyze walls by type and calculate lengths for each stud size
 * @param {Array} walls - Array of wall objects
 * @param {number} scale - Scale factor (pixels per foot)
 * @returns {object} Wall breakdown by stud type with lengths
 */
export const analyzeWallsByType = (walls, scale = 40) => {
  if (!walls || walls.length === 0) {
    return {
      '2x4': { length: 0, walls: [], isExterior: false },
      '2x6': { length: 0, walls: [], isExterior: false },
      totalPerimeter: 0,
    };
  }

  const getWallCoords = (wall) => {
    if (wall.start && wall.end) {
      return {
        x1: wall.start.x, y1: wall.start.y,
        x2: wall.end.x, y2: wall.end.y,
      };
    }
    return { x1: wall.x1, y1: wall.y1, x2: wall.x2, y2: wall.y2 };
  };

  const breakdown = {
    '2x4': { length: 0, walls: [], isExterior: false },
    '2x6': { length: 0, walls: [], isExterior: false },
  };
  let totalPerimeter = 0;

  walls.forEach(wall => {
    const coords = getWallCoords(wall);
    if (isNaN(coords.x1) || isNaN(coords.y1) || isNaN(coords.x2) || isNaN(coords.y2)) {
      return;
    }

    const dx = coords.x2 - coords.x1;
    const dy = coords.y2 - coords.y1;
    const lengthFeet = Math.sqrt(dx * dx + dy * dy) / scale;

    // Get wall type info - walls store type in 'type' property, not 'wallType'
    const wallType = wall.type || 'interior';
    const typeInfo = WALL_THICKNESS_OPTIONS[wallType] || WALL_THICKNESS_OPTIONS.interior;
    const studSize = typeInfo.stud || '2x4';
    const isExterior = wallType.includes('exterior');

    breakdown[studSize].length += lengthFeet;
    breakdown[studSize].walls.push(wall);
    if (isExterior) {
      breakdown[studSize].isExterior = true;
    }
    totalPerimeter += lengthFeet;
  });

  // Round values
  breakdown['2x4'].length = Math.round(breakdown['2x4'].length * 100) / 100;
  breakdown['2x6'].length = Math.round(breakdown['2x6'].length * 100) / 100;

  return {
    ...breakdown,
    totalPerimeter: Math.round(totalPerimeter * 100) / 100,
  };
};

/**
 * Calculate framing materials based on wall analysis
 * @param {object} wallBreakdown - Wall breakdown from analyzeWallsByType
 * @param {number} wallHeight - Wall height in feet
 * @returns {Array} Array of framing materials needed
 */
export const calculateFramingFromWalls = (wallBreakdown, wallHeight = 8) => {
  const materials = [];
  const wasteFactor = 1.1; // 10% waste

  // Process 2x4 walls
  if (wallBreakdown['2x4'].length > 0) {
    const perimeter = wallBreakdown['2x4'].length;
    const linearInches = perimeter * 12;
    const studs16oc = Math.ceil(linearInches / COVERAGE.STUD_SPACING_16OC) + 1;
    const corners = Math.max(4, Math.floor(perimeter / 10)); // Estimate corners
    const extraForCorners = corners * 2;
    const totalStuds = Math.ceil((studs16oc + extraForCorners) * wasteFactor);

    materials.push({
      id: 'studs_2x4',
      name: '2×4 Studs (16" OC)',
      quantity: totalStuds,
      unit: 'pieces',
      unitSize: '2×4×92-5/8"',
    });

    materials.push({
      id: 'top_plates_2x4',
      name: '2×4 Top Plates (double)',
      quantity: Math.ceil(perimeter * 2 * wasteFactor),
      unit: 'linear ft',
      unitSize: '2×4 lumber',
    });

    materials.push({
      id: 'bottom_plate_2x4',
      name: '2×4 Bottom Plate',
      quantity: Math.ceil(perimeter * wasteFactor),
      unit: 'linear ft',
      unitSize: '2×4 lumber',
    });

    materials.push({
      id: 'blocking_2x4',
      name: '2×4 Fire Blocking',
      quantity: Math.ceil(perimeter * wasteFactor),
      unit: 'linear ft',
      unitSize: '2×4 lumber',
    });
  }

  // Process 2x6 walls
  if (wallBreakdown['2x6'].length > 0) {
    const perimeter = wallBreakdown['2x6'].length;
    const linearInches = perimeter * 12;
    const studs16oc = Math.ceil(linearInches / COVERAGE.STUD_SPACING_16OC) + 1;
    const corners = Math.max(4, Math.floor(perimeter / 10));
    const extraForCorners = corners * 2;
    const totalStuds = Math.ceil((studs16oc + extraForCorners) * wasteFactor);

    materials.push({
      id: 'studs_2x6',
      name: '2×6 Studs (16" OC)',
      quantity: totalStuds,
      unit: 'pieces',
      unitSize: '2×6×92-5/8"',
    });

    materials.push({
      id: 'top_plates_2x6',
      name: '2×6 Top Plates (double)',
      quantity: Math.ceil(perimeter * 2 * wasteFactor),
      unit: 'linear ft',
      unitSize: '2×6 lumber',
    });

    materials.push({
      id: 'bottom_plate_2x6',
      name: '2×6 Bottom Plate',
      quantity: Math.ceil(perimeter * wasteFactor),
      unit: 'linear ft',
      unitSize: '2×6 lumber',
    });

    materials.push({
      id: 'blocking_2x6',
      name: '2×6 Fire Blocking',
      quantity: Math.ceil(perimeter * wasteFactor),
      unit: 'linear ft',
      unitSize: '2×6 lumber',
    });
  }

  // Sheathing - only for exterior walls (2x6 typically, but could be 2x4 exterior)
  const exteriorPerimeter = (wallBreakdown['2x6'].isExterior ? wallBreakdown['2x6'].length : 0) +
    (wallBreakdown['2x4'].isExterior ? wallBreakdown['2x4'].length : 0);

  if (exteriorPerimeter > 0) {
    const wallArea = exteriorPerimeter * wallHeight;
    const sheets = Math.ceil(wallArea * wasteFactor / COVERAGE.SHEATHING_SHEET_SQFT);

    materials.push({
      id: 'sheathing_osb',
      name: 'Wall Sheathing (OSB)',
      quantity: sheets,
      unit: 'sheets',
      unitSize: '4×8 ft (32 sqft)',
    });

    // Sheathing nails
    const nailsNeeded = sheets * COVERAGE.SCREWS_PER_SHEATHING_SHEET;
    materials.push({
      id: 'sheathing_nails',
      name: 'Sheathing Nails (8d)',
      quantity: Math.ceil(nailsNeeded / 100),
      unit: 'lbs',
      unitSize: '~100 nails/lb',
    });
  }

  // Framing nails - based on total studs
  const totalPerimeter = wallBreakdown.totalPerimeter;
  if (totalPerimeter > 0) {
    const linearInches = totalPerimeter * 12;
    const totalStuds = Math.ceil(linearInches / COVERAGE.STUD_SPACING_16OC) + 1;
    const nailsNeeded = totalStuds * COVERAGE.NAILS_PER_STUD;
    const plateNails = totalStuds * 3 * 2;

    materials.push({
      id: 'framing_nails',
      name: 'Framing Nails (16d)',
      quantity: Math.ceil((nailsNeeded + plateNails) / COVERAGE.NAILS_PER_LB),
      unit: 'lbs',
      unitSize: '~50 nails/lb',
    });
  }

  return materials;
};

/**
 * Format material list as text for copying
 * @param {Array} materials - Array of material results
 * @param {string} categoryName - Category name for header
 * @returns {string} Formatted text
 */
export const formatMaterialsAsText = (materials, categoryName) => {
  let text = `=== ${categoryName} ===\n`;
  materials.forEach(mat => {
    text += `${mat.name}: ${mat.quantity} ${mat.unit}\n`;
  });
  return text;
};

/**
 * Format all materials as text for copying
 * @param {Object} allMaterials - Object with category keys
 * @param {number} sqft - Square footage
 * @param {number} perimeter - Perimeter
 * @param {object} settings - Settings
 * @returns {string} Formatted text
 */
export const formatAllMaterialsAsText = (allMaterials, sqft, perimeter, settings) => {
  const { wallHeight = DEFAULT_WALL_HEIGHT, wasteFactor = DEFAULT_WASTE_FACTOR } = settings;

  let text = `MATERIAL ESTIMATE\n`;
  text += `================\n\n`;
  text += `Area: ${sqft} sq ft\n`;
  text += `Perimeter: ${perimeter} linear ft\n`;
  text += `Wall Height: ${wallHeight} ft\n`;
  text += `Waste Factor: ${Math.round(wasteFactor * 100)}%\n`;
  text += `Wall Area: ${Math.round(perimeter * wallHeight)} sq ft\n\n`;

  Object.entries(allMaterials).forEach(([category, materials]) => {
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    text += formatMaterialsAsText(materials, categoryName);
    text += '\n';
  });

  text += `\nGenerated by FloorPlan Pro`;
  return text;
};
