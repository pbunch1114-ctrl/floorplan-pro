/**
 * Door Renderer - Draws doors with various styles
 */

import { WALL_THICKNESS_OPTIONS } from '../../../constants/walls';
import { GRID_SIZE } from '../../../constants/grid';
import { pixelsToFeet, formatMeasurement } from '../../../utils/measurements';

// Convert inches to pixels (GRID_SIZE pixels = 6 inches)
const inchesToPixels = (inches) => inches * (GRID_SIZE / 6);

export function drawDoor(ctx, door, wall, isSelected = false, wallDetailLevel = 'simple', thinLines = false) {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const pos = { x: wall.start.x + dx * door.position, y: wall.start.y + dy * door.position };
  const angle = Math.atan2(dy, dx);
  // Convert wall thickness from inches to pixels (matches wallRenderer)
  const thicknessInches = WALL_THICKNESS_OPTIONS[wall.type]?.thickness || 8;
  const thickness = inchesToPixels(thicknessInches);
  // Convert door width from inches to pixels
  const doorWidthInches = door.width || 36;
  const doorWidth = inchesToPixels(doorWidthInches);
  const doorType = door.type || 'single';
  const swing = door.swing || 'left';

  const isArchitectural = wallDetailLevel === 'architectural';

  // Line width multiplier for thin lines mode (like Revit's Thin Lines toggle)
  const lineScale = thinLines ? 0.5 : 1;

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(angle);

  // Casing width for architectural mode (needs to be consistent)
  const casingWidth = isArchitectural ? 3 : 0;

  // Clear wall opening - white for architectural, dark for others
  // Include casing width in the clear area so finish lines don't extend into it
  // Use exact casing width (no extra padding) so finish lines meet the casing edge precisely
  ctx.fillStyle = isArchitectural ? '#ffffff' : '#080c10';
  ctx.fillRect(-doorWidth / 2 - casingWidth, -thickness / 2 - 2, doorWidth + casingWidth * 2, thickness + 4);

  // Draw door frame (jambs on each side) with door stop and trim/casing as one piece
  if (isArchitectural) {
    ctx.strokeStyle = isSelected ? '#00ffaa' : '#000000';
    ctx.lineWidth = 1 * lineScale;

    // Door stop dimensions - on BOTH jambs, positioned 1-3/8" from wall edge (door thickness)
    const doorThickness = inchesToPixels(1.375); // 1-3/8" door thickness
    const stopWidth = 4;   // Width of the door stop bump-out
    const stopDepth = 3;   // How far it sticks into the opening
    // casingWidth is already defined above (= 3)

    // Door opens inward by default, so stop is positioned from that side
    const openDir = (door.openDirection || 'inward') === 'inward' ? 1 : -1;
    // Stop position: 1-3/8" from the swing side of the wall
    const stopY = openDir === 1
      ? -thickness / 2 + doorThickness  // Inward: stop near top (outside) of wall
      : thickness / 2 - doorThickness;  // Outward: stop near bottom (inside) of wall

    // Draw combined casing + door stop as one continuous shape (no internal lines)
    // Left jamb - draw outer perimeter only
    ctx.beginPath();
    // Start at top-left of casing
    ctx.moveTo(-doorWidth / 2 - casingWidth, -thickness / 2);
    // Go down left side of casing
    ctx.lineTo(-doorWidth / 2 - casingWidth, thickness / 2);
    // Go right along bottom of casing
    ctx.lineTo(-doorWidth / 2, thickness / 2);
    // Go up the jamb with door stop
    if (openDir === 1) {
      // Inward: stop is near top
      ctx.lineTo(-doorWidth / 2, stopY + stopWidth / 2);
      ctx.lineTo(-doorWidth / 2 + stopDepth, stopY + stopWidth / 2);
      ctx.lineTo(-doorWidth / 2 + stopDepth, stopY - stopWidth / 2);
      ctx.lineTo(-doorWidth / 2, stopY - stopWidth / 2);
    } else {
      // Outward: stop is near bottom
      ctx.lineTo(-doorWidth / 2, stopY + stopWidth / 2);
      ctx.lineTo(-doorWidth / 2 + stopDepth, stopY + stopWidth / 2);
      ctx.lineTo(-doorWidth / 2 + stopDepth, stopY - stopWidth / 2);
      ctx.lineTo(-doorWidth / 2, stopY - stopWidth / 2);
    }
    ctx.lineTo(-doorWidth / 2, -thickness / 2);
    // Go left along top back to start
    ctx.lineTo(-doorWidth / 2 - casingWidth, -thickness / 2);
    ctx.stroke();

    // Right jamb - draw outer perimeter only
    ctx.beginPath();
    // Start at top-right of casing
    ctx.moveTo(doorWidth / 2 + casingWidth, -thickness / 2);
    // Go down right side of casing
    ctx.lineTo(doorWidth / 2 + casingWidth, thickness / 2);
    // Go left along bottom of casing
    ctx.lineTo(doorWidth / 2, thickness / 2);
    // Go up the jamb with door stop
    if (openDir === 1) {
      // Inward: stop is near top
      ctx.lineTo(doorWidth / 2, stopY + stopWidth / 2);
      ctx.lineTo(doorWidth / 2 - stopDepth, stopY + stopWidth / 2);
      ctx.lineTo(doorWidth / 2 - stopDepth, stopY - stopWidth / 2);
      ctx.lineTo(doorWidth / 2, stopY - stopWidth / 2);
    } else {
      // Outward: stop is near bottom
      ctx.lineTo(doorWidth / 2, stopY + stopWidth / 2);
      ctx.lineTo(doorWidth / 2 - stopDepth, stopY + stopWidth / 2);
      ctx.lineTo(doorWidth / 2 - stopDepth, stopY - stopWidth / 2);
      ctx.lineTo(doorWidth / 2, stopY - stopWidth / 2);
    }
    ctx.lineTo(doorWidth / 2, -thickness / 2);
    // Go right along top back to start
    ctx.lineTo(doorWidth / 2 + casingWidth, -thickness / 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = isSelected ? '#00ffaa' : '#8B7355';
    ctx.fillRect(-doorWidth / 2 - 3, -thickness / 2 - 2, 3, thickness + 4); // Left jamb
    ctx.fillRect(doorWidth / 2, -thickness / 2 - 2, 3, thickness + 4); // Right jamb
  }

  // Selection highlight
  if (isSelected) {
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(-doorWidth / 2 - 8, -thickness / 2 - 10, doorWidth + 16, thickness + 55);
    ctx.setLineDash([]);
  }

  // Door styling based on type - black for architectural, cyan for others
  ctx.strokeStyle = isSelected ? '#00ffaa' : (isArchitectural ? '#000000' : '#00c8ff');
  ctx.lineWidth = (isSelected ? 2 : (isArchitectural ? 1 : 1.5)) * lineScale;

  if (doorType === 'single' || doorType === 'barn') {
    drawSingleDoor(ctx, doorWidth, thickness, swing, door.openDirection, door.swingAngle, isSelected, isArchitectural, casingWidth, lineScale);
  } else if (doorType === 'double' || doorType === 'french') {
    drawDoubleDoor(ctx, doorWidth, thickness, door.openDirection, door.swingAngle, isSelected, doorType === 'french', isArchitectural, casingWidth, lineScale);
  } else if (doorType === 'sliding') {
    drawSlidingDoor(ctx, doorWidth, thickness, isSelected, isArchitectural, lineScale);
  } else if (doorType === 'pocket') {
    drawPocketDoor(ctx, doorWidth, thickness, isSelected, isArchitectural, lineScale);
  } else if (doorType === 'bifold') {
    drawBifoldDoor(ctx, doorWidth, thickness, isSelected, isArchitectural, lineScale);
  } else if (doorType === 'garage') {
    drawGarageDoor(ctx, doorWidth, thickness, isSelected, isArchitectural, lineScale);
  }

  ctx.restore();
}

function drawSingleDoor(ctx, doorWidth, thickness, swing, openDirection, swingAngle, isSelected, isArchitectural = false, casingWidth = 0, lineScale = 1) {
  const openDir = (openDirection || 'inward') === 'inward' ? 1 : -1;
  const swingAngleDeg = swingAngle || 90;
  const swingAngleRad = (swingAngleDeg * Math.PI) / 180;

  // Hinge point - position at edge of casing (not door opening)
  // In architectural mode, hinge is at casing edge so door panel corner meets casing corner
  // Left swing: hinge on left side
  // Right swing: hinge on right side
  const hingeX = swing === 'left'
    ? -doorWidth / 2 - casingWidth
    : doorWidth / 2 + casingWidth;
  // Door panel is at OUTSIDE edge of wall (opposite side from where it swings into)
  // Inward opening: panel at outside edge (-thickness/2), swings into room
  // Outward opening: panel at inside edge (+thickness/2), swings out of room
  const hingeY = openDir === 1 ? -thickness / 2 : thickness / 2;

  // Door panel length - extends from casing corner to opposite casing corner
  const panelLength = doorWidth + casingWidth * 2;

  // Door closed position angle (along the wall)
  // Left swing: door extends to the right (angle = 0)
  // Right swing: door extends to the left (angle = π)
  const closedAngle = swing === 'left' ? 0 : Math.PI;

  // Door open position angle (perpendicular to wall, into the room)
  // The swing angle determines how far the door opens (default 90°)
  let openAngle;
  if (swing === 'left') {
    openAngle = openDir === 1 ? -swingAngleRad : swingAngleRad;
  } else {
    openAngle = openDir === 1 ? Math.PI + swingAngleRad : Math.PI - swingAngleRad;
  }

  // Determine arc direction (clockwise or counter-clockwise)
  const arcStart = closedAngle;
  const arcEnd = openAngle;
  const counterClockwise = (swing === 'left' && openDir === 1) || (swing === 'right' && openDir === -1);

  if (isArchitectural) {
    // Revit-style door: outlined rectangle for door panel in open position + swing arc
    ctx.setLineDash([]);
    ctx.strokeStyle = isSelected ? '#00ffaa' : '#000000';
    ctx.lineWidth = (isSelected ? 1.5 : 0.75) * lineScale;
    const panelThickness = 3; // Door panel thickness in pixels

    // Swing arc (solid thin line like Revit) - radius matches panel length
    ctx.beginPath();
    ctx.arc(hingeX, hingeY, panelLength, arcStart, arcEnd, counterClockwise);
    ctx.stroke();

    // Door panel in open position - edge starts at hinge (casing corner)
    ctx.save();
    ctx.translate(hingeX, hingeY);
    ctx.rotate(openAngle);
    ctx.strokeRect(0, -panelThickness / 2, panelLength, panelThickness);
    ctx.restore();
  } else {
    // Non-architectural mode
    const panelY = openDir === 1 ? thickness / 2 + 2 : -thickness / 2 - 2;
    ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.25)' : 'rgba(139,90,43,0.5)';
    ctx.fillRect(-doorWidth / 2, panelY, doorWidth, 3 * openDir);
    ctx.setLineDash([]);
    ctx.strokeRect(-doorWidth / 2, panelY, doorWidth, 3 * openDir);

    // Swing arc (dashed)
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(hingeX, panelY, doorWidth, arcStart, arcEnd, counterClockwise);
    ctx.stroke();

    // Line from hinge to open position
    ctx.beginPath();
    ctx.moveTo(hingeX, panelY);
    const openX = hingeX + Math.cos(openAngle) * doorWidth;
    const openY = panelY + Math.sin(openAngle) * doorWidth;
    ctx.lineTo(openX, openY);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawDoubleDoor(ctx, doorWidth, thickness, openDirection, swingAngle, isSelected, isFrench, isArchitectural = false, casingWidth = 0, lineScale = 1) {
  const halfWidth = doorWidth / 2;
  const openDir = (openDirection || 'inward') === 'inward' ? 1 : -1;
  // Door panel is at OUTSIDE edge of wall
  const hingeY = openDir === 1 ? -thickness / 2 : thickness / 2;
  const swingAngleDeg = swingAngle || 90;
  const swingAngleRad = (swingAngleDeg * Math.PI) / 180;

  const leafWidth = halfWidth - 2;

  // Left door: hinge at -halfWidth, swings from angle 0 (pointing right) to open position
  // Right door: hinge at +halfWidth, swings from angle π (pointing left) to open position
  const leftClosedAngle = 0;
  const rightClosedAngle = Math.PI;

  // Open angles depend on swing direction
  const leftOpenAngle = openDir === 1 ? -swingAngleRad : swingAngleRad;
  const rightOpenAngle = openDir === 1 ? Math.PI + swingAngleRad : Math.PI - swingAngleRad;

  // Arc directions
  const leftCounterClockwise = openDir === 1;
  const rightCounterClockwise = openDir === -1;

  if (isArchitectural) {
    // Revit-style double door: outlined rectangles in open position + swing arcs
    ctx.setLineDash([]);
    const panelThickness = 3;

    ctx.strokeStyle = isSelected ? '#00ffaa' : '#000000';
    ctx.lineWidth = (isSelected ? 1.5 : 0.75) * lineScale;

    // Left door arc
    ctx.beginPath();
    ctx.arc(-halfWidth, hingeY, leafWidth, leftClosedAngle, leftOpenAngle, leftCounterClockwise);
    ctx.stroke();

    // Right door arc
    ctx.beginPath();
    ctx.arc(halfWidth, hingeY, leafWidth, rightClosedAngle, rightOpenAngle, rightCounterClockwise);
    ctx.stroke();

    // Left door panel in open position
    ctx.save();
    ctx.translate(-halfWidth, hingeY);
    ctx.rotate(leftOpenAngle);
    ctx.strokeRect(0, -panelThickness / 2, leafWidth, panelThickness);
    ctx.restore();

    // Right door panel in open position
    ctx.save();
    ctx.translate(halfWidth, hingeY);
    ctx.rotate(rightOpenAngle);
    ctx.strokeRect(0, -panelThickness / 2, leafWidth, panelThickness);
    ctx.restore();
  } else {
    // Non-architectural mode
    const panelY = openDir === 1 ? thickness / 2 + 2 : -thickness / 2 - 2;

    // Left door panel
    ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.15)' : 'rgba(139,90,43,0.3)';
    ctx.fillRect(-halfWidth, panelY, halfWidth - 2, 3 * openDir);
    ctx.setLineDash([]);
    ctx.strokeRect(-halfWidth, panelY, halfWidth - 2, 3 * openDir);

    // Right door panel
    ctx.fillRect(2, panelY, halfWidth - 2, 3 * openDir);
    ctx.strokeRect(2, panelY, halfWidth - 2, 3 * openDir);

    // Left door swing arc
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    if (openDir === 1) {
      ctx.arc(-halfWidth, panelY, halfWidth - 2, -Math.PI / 2, 0);
    } else {
      ctx.arc(-halfWidth, panelY, halfWidth - 2, 0, Math.PI / 2);
    }
    ctx.stroke();

    // Left door open position line
    ctx.beginPath();
    ctx.moveTo(-halfWidth, panelY);
    ctx.lineTo(-halfWidth, panelY - (halfWidth - 2) * openDir);
    ctx.stroke();

    // Right door swing arc
    ctx.beginPath();
    if (openDir === 1) {
      ctx.arc(halfWidth, panelY, halfWidth - 2, -Math.PI, -Math.PI / 2);
    } else {
      ctx.arc(halfWidth, panelY, halfWidth - 2, Math.PI / 2, Math.PI);
    }
    ctx.stroke();

    // Right door open position line
    ctx.beginPath();
    ctx.moveTo(halfWidth, panelY);
    ctx.lineTo(halfWidth, panelY - (halfWidth - 2) * openDir);
    ctx.stroke();

    ctx.setLineDash([]);

    // French door glass panels indicator
    if (isFrench) {
      ctx.strokeStyle = isSelected ? '#00ffaa' : 'rgba(135,206,235,0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-halfWidth + 3, panelY + 0.5 * openDir, halfWidth - 8, 2 * openDir);
      ctx.strokeRect(5, panelY + 0.5 * openDir, halfWidth - 8, 2 * openDir);
    }
  }
}

function drawSlidingDoor(ctx, doorWidth, thickness, isSelected, isArchitectural = false, lineScale = 1) {
  if (isArchitectural) {
    // Revit-style sliding door: two overlapping panels shown as parallel lines
    ctx.setLineDash([]);
    ctx.lineWidth = (isSelected ? 2 : 1) * lineScale;

    // Two parallel lines representing glass panels (offset slightly to show overlap)
    const glassOffset = thickness / 6;
    ctx.beginPath();
    ctx.moveTo(-doorWidth / 2, -glassOffset);
    ctx.lineTo(doorWidth / 2, -glassOffset);
    ctx.moveTo(-doorWidth / 2, glassOffset);
    ctx.lineTo(doorWidth / 2, glassOffset);
    ctx.stroke();

    // Center mullion
    ctx.beginPath();
    ctx.moveTo(0, -thickness / 2);
    ctx.lineTo(0, thickness / 2);
    ctx.stroke();

    // Jamb lines at edges
    ctx.beginPath();
    ctx.moveTo(-doorWidth / 2, -thickness / 2);
    ctx.lineTo(-doorWidth / 2, thickness / 2);
    ctx.moveTo(doorWidth / 2, -thickness / 2);
    ctx.lineTo(doorWidth / 2, thickness / 2);
    ctx.stroke();
    return;
  }

  // Non-architectural mode
  const hingeY = thickness / 2 + 2;

  // Door panels
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.15)' : 'rgba(135,206,235,0.2)';
  ctx.fillRect(-doorWidth / 2, hingeY, doorWidth, 4);
  ctx.setLineDash([]);
  ctx.strokeRect(-doorWidth / 2, hingeY, doorWidth, 4);

  // Glass panel dividers
  ctx.strokeStyle = isSelected ? '#00ffaa' : 'rgba(135,206,235,0.8)';
  ctx.beginPath();
  ctx.moveTo(0, hingeY);
  ctx.lineTo(0, hingeY + 4);
  ctx.stroke();

  // Arrow indicator
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#00c8ff';
  ctx.beginPath();
  ctx.moveTo(-10, hingeY + 12);
  ctx.lineTo(10, hingeY + 12);
  ctx.moveTo(5, hingeY + 9);
  ctx.lineTo(10, hingeY + 12);
  ctx.lineTo(5, hingeY + 15);
  ctx.stroke();
}

function drawPocketDoor(ctx, doorWidth, thickness, isSelected, isArchitectural = false, lineScale = 1) {
  if (isArchitectural) {
    // Revit-style pocket door: solid line for visible portion, dashed for pocket
    ctx.setLineDash([]);
    ctx.lineWidth = (isSelected ? 2 : 1.5) * lineScale;

    // Visible door portion (partially open)
    ctx.beginPath();
    ctx.moveTo(-doorWidth / 2, 0);
    ctx.lineTo(doorWidth * 0.1, 0);
    ctx.stroke();

    // Dashed line showing door in pocket
    ctx.lineWidth = (isSelected ? 1.5 : 0.75) * lineScale;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(doorWidth * 0.1, 0);
    ctx.lineTo(doorWidth / 2, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Jamb lines
    ctx.lineWidth = (isSelected ? 2 : 1) * lineScale;
    ctx.beginPath();
    ctx.moveTo(-doorWidth / 2, -thickness / 2);
    ctx.lineTo(-doorWidth / 2, thickness / 2);
    ctx.stroke();
    return;
  }

  // Non-architectural mode
  const hingeY = thickness / 2 + 2;

  // Door panel
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.15)' : 'rgba(139,90,43,0.3)';
  ctx.fillRect(-doorWidth / 2, hingeY, doorWidth * 0.6, 3);
  ctx.setLineDash([]);
  ctx.lineWidth = 1 * lineScale;
  ctx.strokeRect(-doorWidth / 2, hingeY, doorWidth * 0.6, 3);

  // Wall pocket indication
  ctx.setLineDash([2, 2]);
  ctx.strokeRect(doorWidth / 2 - doorWidth * 0.4, -thickness / 2 - 3, doorWidth * 0.4, thickness + 6);
  ctx.setLineDash([]);

  // Arrow showing slide direction
  ctx.beginPath();
  ctx.moveTo(0, hingeY + 10);
  ctx.lineTo(doorWidth / 4, hingeY + 10);
  ctx.moveTo(doorWidth / 4 - 5, hingeY + 7);
  ctx.lineTo(doorWidth / 4, hingeY + 10);
  ctx.lineTo(doorWidth / 4 - 5, hingeY + 13);
  ctx.stroke();
}

function drawBifoldDoor(ctx, doorWidth, thickness, isSelected, isArchitectural = false, lineScale = 1) {
  const panelWidth = doorWidth / 4;

  if (isArchitectural) {
    // Revit-style bifold: zigzag lines showing folded panels
    ctx.setLineDash([]);
    ctx.lineWidth = (isSelected ? 2 : 1.5) * lineScale;

    // Draw folded panels as connected lines
    ctx.beginPath();
    // Left pair folds toward center
    ctx.moveTo(-doorWidth / 2, 0);
    ctx.lineTo(-doorWidth / 4, thickness / 2 + 5);
    ctx.lineTo(0, 0);
    // Right pair folds toward center
    ctx.moveTo(doorWidth / 2, 0);
    ctx.lineTo(doorWidth / 4, thickness / 2 + 5);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // Jamb lines
    ctx.beginPath();
    ctx.moveTo(-doorWidth / 2, -thickness / 2);
    ctx.lineTo(-doorWidth / 2, thickness / 2);
    ctx.moveTo(doorWidth / 2, -thickness / 2);
    ctx.lineTo(doorWidth / 2, thickness / 2);
    ctx.stroke();
    return;
  }

  // Non-architectural mode
  const hingeY = thickness / 2 + 2;

  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.15)' : 'rgba(139,90,43,0.3)';
  ctx.setLineDash([]);

  // Draw 4 panels with fold lines
  for (let i = 0; i < 4; i++) {
    const x = -doorWidth / 2 + i * panelWidth;
    ctx.fillRect(x, hingeY, panelWidth - 1, 3);
    ctx.strokeRect(x, hingeY, panelWidth - 1, 3);
  }

  // Fold direction arrows
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(-doorWidth / 4, hingeY + 10);
  ctx.lineTo(0, hingeY + 10);
  ctx.moveTo(-5, hingeY + 7);
  ctx.lineTo(0, hingeY + 10);
  ctx.lineTo(-5, hingeY + 13);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(doorWidth / 4, hingeY + 10);
  ctx.lineTo(0, hingeY + 10);
  ctx.moveTo(5, hingeY + 7);
  ctx.lineTo(0, hingeY + 10);
  ctx.lineTo(5, hingeY + 13);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawGarageDoor(ctx, doorWidth, thickness, isSelected, isArchitectural = false, lineScale = 1) {
  const hingeY = thickness / 2 + 2;

  if (isArchitectural) {
    // Simple rectangle outline for garage door
    ctx.setLineDash([]);
    ctx.strokeRect(-doorWidth / 2, hingeY, doorWidth, 4);
    return;
  }

  // Main door panel
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.15)' : 'rgba(100,100,100,0.3)';
  ctx.fillRect(-doorWidth / 2, hingeY, doorWidth, 6);
  ctx.setLineDash([]);
  ctx.strokeRect(-doorWidth / 2, hingeY, doorWidth, 6);

  // Panel sections
  ctx.strokeStyle = isSelected ? '#00ffaa' : 'rgba(150,150,150,0.5)';
  ctx.lineWidth = 1;
  const sectionWidth = doorWidth / 4;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-doorWidth / 2 + i * sectionWidth, hingeY);
    ctx.lineTo(-doorWidth / 2 + i * sectionWidth, hingeY + 6);
    ctx.stroke();
  }

  // Windows at top
  ctx.strokeStyle = isSelected ? '#00ffaa' : 'rgba(135,206,235,0.6)';
  for (let i = 0; i < 4; i++) {
    const x = -doorWidth / 2 + i * sectionWidth + 4;
    ctx.strokeRect(x, hingeY + 1, sectionWidth - 8, 2);
  }
}

/**
 * Draw temporary dimensions showing door position relative to wall ends
 * Similar to Revit's temporary dimensions when an element is selected
 * Dimensions go to the CENTER of the door
 */
export function drawDoorTemporaryDimensions(ctx, door, wall, units = 'imperial', wallDetailLevel = 'simple') {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const wallLength = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  // Door center position along wall (0-1 normalized)
  const doorCenterPos = door.position * wallLength;

  // Calculate distances from door CENTER to wall ends
  const distToWallStart = doorCenterPos; // Distance from wall start to center of door
  const distToWallEnd = wallLength - doorCenterPos; // Distance from center of door to wall end

  // Get wall thickness for offset
  const thicknessInches = WALL_THICKNESS_OPTIONS[wall.type]?.thickness || 8;
  const thickness = inchesToPixels(thicknessInches);

  const isArchitectural = wallDetailLevel === 'architectural';
  const dimColor = isArchitectural ? '#000000' : '#00aaff';
  const bgColor = isArchitectural ? 'rgba(255,255,255,0.9)' : 'rgba(8,12,16,0.85)';

  ctx.save();

  // Calculate door center position in world coordinates
  const doorPos = {
    x: wall.start.x + dx * door.position,
    y: wall.start.y + dy * door.position
  };

  // Offset for dimension lines (below the wall)
  const dimOffset = thickness / 2 + 25;

  // Perpendicular offset direction
  const perpX = Math.sin(angle);
  const perpY = -Math.cos(angle);

  // Font settings
  const fontSize = 11;
  ctx.font = `bold ${fontSize}px "SF Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Only draw dimensions if there's meaningful distance
  const minDimDistance = 20; // Minimum pixels to show a dimension

  // Left dimension (wall start to door center)
  if (distToWallStart > minDimDistance) {
    const startX = wall.start.x + perpX * dimOffset;
    const startY = wall.start.y + perpY * dimOffset;
    const endX = doorPos.x + perpX * dimOffset;
    const endY = doorPos.y + perpY * dimOffset;

    drawTempDimension(ctx, startX, startY, endX, endY, distToWallStart, angle, dimColor, bgColor, fontSize, units);
  }

  // Right dimension (door center to wall end)
  if (distToWallEnd > minDimDistance) {
    const startX = doorPos.x + perpX * dimOffset;
    const startY = doorPos.y + perpY * dimOffset;
    const endX = wall.end.x + perpX * dimOffset;
    const endY = wall.end.y + perpY * dimOffset;

    drawTempDimension(ctx, startX, startY, endX, endY, distToWallEnd, angle, dimColor, bgColor, fontSize, units);
  }

  ctx.restore();
}

/**
 * Helper to draw a single temporary dimension line with text
 */
function drawTempDimension(ctx, startX, startY, endX, endY, lengthPixels, angle, color, bgColor, fontSize, units) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([]);

  // Extension lines (short vertical lines at ends)
  const tickSize = 6;
  const tickX = Math.sin(angle) * tickSize;
  const tickY = -Math.cos(angle) * tickSize;

  // Start tick
  ctx.beginPath();
  ctx.moveTo(startX - tickX, startY - tickY);
  ctx.lineTo(startX + tickX, startY + tickY);
  ctx.stroke();

  // End tick
  ctx.beginPath();
  ctx.moveTo(endX - tickX, endY - tickY);
  ctx.lineTo(endX + tickX, endY + tickY);
  ctx.stroke();

  // Main dimension line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Dimension text
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const lengthFeet = pixelsToFeet(lengthPixels);
  const labelText = formatMeasurement(lengthFeet, units);

  ctx.save();
  ctx.translate(midX, midY);

  // Rotate text to be readable (always right-side up)
  let textAngle = angle;
  if (textAngle > Math.PI / 2) textAngle -= Math.PI;
  if (textAngle < -Math.PI / 2) textAngle += Math.PI;
  ctx.rotate(textAngle);

  // Text background
  ctx.font = `bold ${fontSize}px "SF Mono", monospace`;
  const textWidth = ctx.measureText(labelText).width;
  ctx.fillStyle = bgColor;
  ctx.fillRect(-textWidth / 2 - 4, -fontSize / 2 - 2, textWidth + 8, fontSize + 4);

  // Text
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(labelText, 0, 0);

  ctx.restore();
}
