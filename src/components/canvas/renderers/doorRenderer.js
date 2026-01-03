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

    // Door stop dimensions - on BOTH jambs, positioned to create space for door panel
    const doorThickness = inchesToPixels(1.375); // 1-3/8" door thickness
    const stopWidth = 4;   // Width of the door stop bump-out
    const stopDepth = 3;   // How far it sticks into the opening
    // casingWidth is already defined above (= 3)

    // Door opens inward by default, so stop is positioned from that side
    const openDir = (door.openDirection || 'inward') === 'inward' ? 1 : -1;
    // Stop position: door thickness + half stop width from wall edge
    // This ensures the door panel fits between the wall edge and the inside edge of the stop
    const stopY = openDir === 1
      ? -thickness / 2 + doorThickness + stopWidth / 2  // Inward: stop near top (outside) of wall
      : thickness / 2 - doorThickness - stopWidth / 2;  // Outward: stop near bottom (inside) of wall

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
  const swingAngleDeg = swingAngle ?? 90;
  const swingAngleRad = (swingAngleDeg * Math.PI) / 180;

  // Door stop dimensions (must match what's drawn in drawDoor)
  const doorThickness = inchesToPixels(1.375); // 1-3/8" door thickness

  // Hinge point X - at the edge of the door opening (where the door jamb is)
  // Left swing: hinge at left edge of opening
  // Right swing: hinge at right edge of opening
  const hingeX = swing === 'left'
    ? -doorWidth / 2
    : doorWidth / 2;

  // Hinge Y position - at the wall surface on the swing side
  // Inward: hinge at outside wall surface (negative Y = top)
  // Outward: hinge at inside wall surface (positive Y = bottom)
  const hingeY = openDir === 1 ? -thickness / 2 : thickness / 2;

  // Door panel length - from one inside casing corner to the other
  const panelLength = doorWidth;

  // Door closed position angle (along the wall)
  // Left swing: door extends to the right (angle = 0)
  // Right swing: door extends to the left (angle = π)
  const closedAngle = swing === 'left' ? 0 : Math.PI;

  // Door open position angle
  // Inward: door swings toward negative Y (into the room, which is "up" on screen = negative Y)
  // Outward: door swings toward positive Y (out of the room, which is "down" on screen = positive Y)
  let openAngle;
  if (swing === 'left') {
    // Left hinge: closed at 0, swings CCW for inward (-Y), CW for outward (+Y)
    openAngle = openDir === 1 ? -swingAngleRad : swingAngleRad;
  } else {
    // Right hinge: closed at π, swings CW for inward (toward -Y), CCW for outward (toward +Y)
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
    // Use actual door thickness so panel fits in the door stop space when closed
    const panelThickness = doorThickness;

    // Swing arc (solid thin line like Revit)
    // The arc radius is the full door width (from hinge at one jamb edge to the opposite jamb edge)
    const arcRadius = panelLength;
    ctx.beginPath();
    ctx.arc(hingeX, hingeY, arcRadius, arcStart, arcEnd, counterClockwise);
    ctx.stroke();

    // Door panel in open position
    // The panel swings from the hinge (at jamb edge)
    // Panel outer edge should align with the inside casing corner
    ctx.save();
    ctx.translate(hingeX, hingeY);
    ctx.rotate(openAngle);
    // Draw panel - offset depends on swing direction and open direction
    // Left swing + outward: panel needs negative offset
    // Right swing + inward: panel needs negative offset
    // Left swing + inward: panel at 0 (no offset)
    // Right swing + outward: panel at 0 (no offset)
    const panelYOffset = ((swing === 'left' && openDir === -1) || (swing === 'right' && openDir === 1)) ? -panelThickness : 0;
    ctx.strokeRect(0, panelYOffset, arcRadius, panelThickness);
    ctx.restore();
  } else {
    // Non-architectural mode - simplified schematic view
    // Panel shown outside the wall on the swing side
    const panelY = openDir === 1 ? -thickness / 2 - 5 : thickness / 2 + 2;
    ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.25)' : 'rgba(139,90,43,0.5)';
    ctx.fillRect(-doorWidth / 2, panelY, doorWidth, 3);
    ctx.setLineDash([]);
    ctx.strokeRect(-doorWidth / 2, panelY, doorWidth, 3);

    // Swing arc (dashed) - use same hingeY as architectural mode
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(hingeX, hingeY, doorWidth, arcStart, arcEnd, counterClockwise);
    ctx.stroke();

    // Line from hinge to open position
    ctx.beginPath();
    ctx.moveTo(hingeX, hingeY);
    const openX = hingeX + Math.cos(openAngle) * doorWidth;
    const openY = hingeY + Math.sin(openAngle) * doorWidth;
    ctx.lineTo(openX, openY);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawDoubleDoor(ctx, doorWidth, thickness, openDirection, swingAngle, isSelected, isFrench, isArchitectural = false, casingWidth = 0, lineScale = 1) {
  const halfWidth = doorWidth / 2;
  const openDir = (openDirection || 'inward') === 'inward' ? 1 : -1;
  // Hinge Y position - ALWAYS at the outside wall surface
  const hingeY = -thickness / 2;
  const swingAngleDeg = swingAngle ?? 90;
  const swingAngleRad = (swingAngleDeg * Math.PI) / 180;

  // Each leaf spans from hinge to center - no gap
  const leafWidth = halfWidth;

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
    const doorThickness = inchesToPixels(1.375); // 1-3/8" door thickness
    const panelThickness = doorThickness;

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

    // Panel Y offsets - same logic as single door
    // Left door (left hinge) + outward: needs negative offset
    // Right door (right hinge) + inward: needs negative offset
    const leftPanelYOffset = (openDir === -1) ? -panelThickness : 0;
    const rightPanelYOffset = (openDir === 1) ? -panelThickness : 0;

    // Left door panel in open position
    ctx.save();
    ctx.translate(-halfWidth, hingeY);
    ctx.rotate(leftOpenAngle);
    ctx.strokeRect(0, leftPanelYOffset, leafWidth, panelThickness);
    ctx.restore();

    // Right door panel in open position
    ctx.save();
    ctx.translate(halfWidth, hingeY);
    ctx.rotate(rightOpenAngle);
    ctx.strokeRect(0, rightPanelYOffset, leafWidth, panelThickness);
    ctx.restore();
  } else {
    // Non-architectural mode
    const panelY = openDir === 1 ? -thickness / 2 - 5 : thickness / 2 + 2;

    // Left door panel
    ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.15)' : 'rgba(139,90,43,0.3)';
    ctx.fillRect(-halfWidth, panelY, halfWidth - 2, 3);
    ctx.setLineDash([]);
    ctx.strokeRect(-halfWidth, panelY, halfWidth - 2, 3);

    // Right door panel
    ctx.fillRect(2, panelY, halfWidth - 2, 3);
    ctx.strokeRect(2, panelY, halfWidth - 2, 3);

    // Left door swing arc - use hingeY for consistency
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(-halfWidth, hingeY, leafWidth, leftClosedAngle, leftOpenAngle, leftCounterClockwise);
    ctx.stroke();

    // Left door open position line
    ctx.beginPath();
    ctx.moveTo(-halfWidth, hingeY);
    const leftOpenX = -halfWidth + Math.cos(leftOpenAngle) * leafWidth;
    const leftOpenY = hingeY + Math.sin(leftOpenAngle) * leafWidth;
    ctx.lineTo(leftOpenX, leftOpenY);
    ctx.stroke();

    // Right door swing arc - use hingeY for consistency
    ctx.beginPath();
    ctx.arc(halfWidth, hingeY, leafWidth, rightClosedAngle, rightOpenAngle, rightCounterClockwise);
    ctx.stroke();

    // Right door open position line
    ctx.beginPath();
    ctx.moveTo(halfWidth, hingeY);
    const rightOpenX = halfWidth + Math.cos(rightOpenAngle) * leafWidth;
    const rightOpenY = hingeY + Math.sin(rightOpenAngle) * leafWidth;
    ctx.lineTo(rightOpenX, rightOpenY);
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
