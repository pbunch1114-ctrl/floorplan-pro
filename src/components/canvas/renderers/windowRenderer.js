/**
 * Window Renderer - Draws windows with various styles
 */

import { WALL_THICKNESS_OPTIONS } from '../../../constants/walls';
import { GRID_SIZE } from '../../../constants/grid';
import { pixelsToFeet, formatMeasurement } from '../../../utils/measurements';

// Convert inches to pixels (GRID_SIZE pixels = 6 inches)
const inchesToPixels = (inches) => inches * (GRID_SIZE / 6);

export function drawWindow(ctx, window, wall, isSelected = false, wallDetailLevel = 'simple', thinLines = false) {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const pos = { x: wall.start.x + dx * window.position, y: wall.start.y + dy * window.position };
  const angle = Math.atan2(dy, dx);
  // Convert wall thickness from inches to pixels (matches wallRenderer)
  const thicknessInches = WALL_THICKNESS_OPTIONS[wall.type]?.thickness || 8;
  const thickness = inchesToPixels(thicknessInches);
  // Convert window width from inches to pixels
  const winWidthInches = window.width || 48;
  const winWidth = inchesToPixels(winWidthInches);
  const windowType = window.type || 'double-hung';

  const isArchitectural = wallDetailLevel === 'architectural';

  // Line width multiplier for thin lines mode (like Revit's Thin Lines toggle)
  const lineScale = thinLines ? 0.5 : 1;

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(angle);

  // Clear wall opening - white for architectural, dark for others
  ctx.fillStyle = isArchitectural ? '#ffffff' : '#080c10';
  ctx.fillRect(-winWidth / 2, -thickness / 2 - 2, winWidth, thickness + 4);

  // Window frame - black for architectural, light blue for others
  ctx.strokeStyle = isSelected ? '#00ffaa' : (isArchitectural ? '#000000' : '#87CEEB');
  ctx.lineWidth = (isSelected ? 2 : (isArchitectural ? 1 : 1.5)) * lineScale;

  if (isArchitectural) {
    // Revit-style window: multiple parallel lines showing frame depth + glass indicator
    ctx.setLineDash([]);
    ctx.strokeStyle = isSelected ? '#00ffaa' : '#000000';
    ctx.lineWidth = (isSelected ? 1.5 : 1) * lineScale;

    // Outer frame lines (at wall surfaces)
    ctx.beginPath();
    ctx.moveTo(-winWidth / 2, -thickness / 2);
    ctx.lineTo(winWidth / 2, -thickness / 2);
    ctx.moveTo(-winWidth / 2, thickness / 2);
    ctx.lineTo(winWidth / 2, thickness / 2);
    ctx.stroke();

    // Inner glass lines (closer to center)
    const glassOffset = thickness / 4;
    ctx.beginPath();
    ctx.moveTo(-winWidth / 2, -glassOffset);
    ctx.lineTo(winWidth / 2, -glassOffset);
    ctx.moveTo(-winWidth / 2, glassOffset);
    ctx.lineTo(winWidth / 2, glassOffset);
    ctx.stroke();

    // Jamb lines at edges (full wall thickness)
    ctx.beginPath();
    ctx.moveTo(-winWidth / 2, -thickness / 2);
    ctx.lineTo(-winWidth / 2, thickness / 2);
    ctx.moveTo(winWidth / 2, -thickness / 2);
    ctx.lineTo(winWidth / 2, thickness / 2);
    ctx.stroke();

    // Diagonal lines through glass to indicate window (like Revit)
    ctx.lineWidth = (isSelected ? 1 : 0.5) * lineScale;
    ctx.beginPath();
    // X pattern in left half
    ctx.moveTo(-winWidth / 2 + 2, -glassOffset + 1);
    ctx.lineTo(-2, glassOffset - 1);
    ctx.moveTo(-winWidth / 2 + 2, glassOffset - 1);
    ctx.lineTo(-2, -glassOffset + 1);
    // X pattern in right half
    ctx.moveTo(2, -glassOffset + 1);
    ctx.lineTo(winWidth / 2 - 2, glassOffset - 1);
    ctx.moveTo(2, glassOffset - 1);
    ctx.lineTo(winWidth / 2 - 2, -glassOffset + 1);
    ctx.stroke();

    // Center mullion
    ctx.lineWidth = (isSelected ? 1.5 : 1) * lineScale;
    ctx.beginPath();
    ctx.moveTo(0, -thickness / 2);
    ctx.lineTo(0, thickness / 2);
    ctx.stroke();
  } else if (windowType === 'single-hung' || windowType === 'double-hung') {
    drawHungWindow(ctx, winWidth, thickness, isSelected, windowType === 'double-hung');
  } else if (windowType === 'casement') {
    drawCasementWindow(ctx, winWidth, thickness, isSelected);
  } else if (windowType === 'sliding') {
    drawSlidingWindow(ctx, winWidth, thickness, isSelected);
  } else if (windowType === 'fixed') {
    drawFixedWindow(ctx, winWidth, thickness, isSelected);
  } else if (windowType === 'awning') {
    drawAwningWindow(ctx, winWidth, thickness, isSelected);
  } else if (windowType === 'bay') {
    drawBayWindow(ctx, winWidth, thickness, isSelected);
  } else if (windowType === 'bow') {
    drawBowWindow(ctx, winWidth, thickness, isSelected);
  } else {
    // Default window style
    drawDefaultWindow(ctx, winWidth, thickness, isSelected);
  }

  // Selection highlight
  if (isSelected) {
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(-winWidth / 2 - 6, -thickness / 2 - 8, winWidth + 12, thickness + 16);
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function drawDefaultWindow(ctx, winWidth, thickness, isSelected) {
  // Frame lines
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#87CEEB';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);

  // Top and bottom frame lines
  ctx.beginPath();
  ctx.moveTo(-winWidth / 2, -thickness / 2);
  ctx.lineTo(winWidth / 2, -thickness / 2);
  ctx.moveTo(-winWidth / 2, thickness / 2);
  ctx.lineTo(winWidth / 2, thickness / 2);
  ctx.stroke();

  // Center mullion
  ctx.beginPath();
  ctx.moveTo(0, -thickness / 2);
  ctx.lineTo(0, thickness / 2);
  ctx.stroke();

  // Glass fill
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.1)' : 'rgba(135,206,235,0.2)';
  ctx.fillRect(-winWidth / 2, -thickness / 2, winWidth, thickness);
}

function drawHungWindow(ctx, winWidth, thickness, isSelected, isDoubleHung) {
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#87CEEB';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);

  // Glass fill
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.1)' : 'rgba(135,206,235,0.2)';
  ctx.fillRect(-winWidth / 2, -thickness / 2, winWidth, thickness);

  // Frame
  ctx.strokeRect(-winWidth / 2, -thickness / 2, winWidth, thickness);

  // Horizontal center mullion
  ctx.beginPath();
  ctx.moveTo(-winWidth / 2, 0);
  ctx.lineTo(winWidth / 2, 0);
  ctx.stroke();

  // Arrow indicating movable sash
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#4a8ab0';
  ctx.lineWidth = 1;

  // Bottom sash always moves up
  ctx.beginPath();
  ctx.moveTo(winWidth / 2 + 8, thickness / 4);
  ctx.lineTo(winWidth / 2 + 8, -thickness / 4);
  ctx.moveTo(winWidth / 2 + 5, -thickness / 4 + 3);
  ctx.lineTo(winWidth / 2 + 8, -thickness / 4);
  ctx.lineTo(winWidth / 2 + 11, -thickness / 4 + 3);
  ctx.stroke();

  // Top sash moves down if double-hung
  if (isDoubleHung) {
    ctx.beginPath();
    ctx.moveTo(-winWidth / 2 - 8, -thickness / 4);
    ctx.lineTo(-winWidth / 2 - 8, thickness / 4);
    ctx.moveTo(-winWidth / 2 - 11, thickness / 4 - 3);
    ctx.lineTo(-winWidth / 2 - 8, thickness / 4);
    ctx.lineTo(-winWidth / 2 - 5, thickness / 4 - 3);
    ctx.stroke();
  }
}

function drawCasementWindow(ctx, winWidth, thickness, isSelected) {
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#87CEEB';
  ctx.lineWidth = 1.5;

  // Glass fill
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.1)' : 'rgba(135,206,235,0.2)';
  ctx.fillRect(-winWidth / 2, -thickness / 2, winWidth, thickness);

  // Frame
  ctx.setLineDash([]);
  ctx.strokeRect(-winWidth / 2, -thickness / 2, winWidth, thickness);

  // Swing arc (dashed)
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(-winWidth / 2, -thickness / 2, winWidth, 0, Math.PI / 4);
  ctx.stroke();
  ctx.setLineDash([]);

  // Hinge indicators
  ctx.fillStyle = isSelected ? '#00ffaa' : '#87CEEB';
  ctx.beginPath();
  ctx.arc(-winWidth / 2, -thickness / 4, 2, 0, Math.PI * 2);
  ctx.arc(-winWidth / 2, thickness / 4, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawSlidingWindow(ctx, winWidth, thickness, isSelected) {
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#87CEEB';
  ctx.lineWidth = 1.5;

  // Glass fill
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.1)' : 'rgba(135,206,235,0.2)';
  ctx.fillRect(-winWidth / 2, -thickness / 2, winWidth, thickness);

  // Frame
  ctx.setLineDash([]);
  ctx.strokeRect(-winWidth / 2, -thickness / 2, winWidth, thickness);

  // Vertical center mullion
  ctx.beginPath();
  ctx.moveTo(0, -thickness / 2);
  ctx.lineTo(0, thickness / 2);
  ctx.stroke();

  // Arrow showing slide direction
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-winWidth / 4, thickness / 2 + 8);
  ctx.lineTo(winWidth / 4, thickness / 2 + 8);
  ctx.moveTo(winWidth / 4 - 4, thickness / 2 + 5);
  ctx.lineTo(winWidth / 4, thickness / 2 + 8);
  ctx.lineTo(winWidth / 4 - 4, thickness / 2 + 11);
  ctx.stroke();
}

function drawFixedWindow(ctx, winWidth, thickness, isSelected) {
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#87CEEB';
  ctx.lineWidth = 2;

  // Glass fill
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.1)' : 'rgba(135,206,235,0.25)';
  ctx.fillRect(-winWidth / 2, -thickness / 2, winWidth, thickness);

  // Thick frame
  ctx.setLineDash([]);
  ctx.strokeRect(-winWidth / 2, -thickness / 2, winWidth, thickness);

  // X pattern to indicate fixed
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = isSelected ? 'rgba(0,255,170,0.3)' : 'rgba(135,206,235,0.4)';
  ctx.beginPath();
  ctx.moveTo(-winWidth / 2, -thickness / 2);
  ctx.lineTo(winWidth / 2, thickness / 2);
  ctx.moveTo(winWidth / 2, -thickness / 2);
  ctx.lineTo(-winWidth / 2, thickness / 2);
  ctx.stroke();
}

function drawAwningWindow(ctx, winWidth, thickness, isSelected) {
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#87CEEB';
  ctx.lineWidth = 1.5;

  // Glass fill
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.1)' : 'rgba(135,206,235,0.2)';
  ctx.fillRect(-winWidth / 2, -thickness / 2, winWidth, thickness);

  // Frame
  ctx.setLineDash([]);
  ctx.strokeRect(-winWidth / 2, -thickness / 2, winWidth, thickness);

  // Swing arc at top (dashed)
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(-winWidth / 2, -thickness / 2);
  ctx.lineTo(-winWidth / 2, -thickness / 2 - thickness);
  ctx.lineTo(winWidth / 2, -thickness / 2 - thickness);
  ctx.lineTo(winWidth / 2, -thickness / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Hinge indicators at top
  ctx.fillStyle = isSelected ? '#00ffaa' : '#87CEEB';
  ctx.beginPath();
  ctx.arc(-winWidth / 4, -thickness / 2, 2, 0, Math.PI * 2);
  ctx.arc(winWidth / 4, -thickness / 2, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawBayWindow(ctx, winWidth, thickness, isSelected) {
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#87CEEB';
  ctx.lineWidth = 1.5;

  const sideWidth = winWidth * 0.25;
  const centerWidth = winWidth * 0.5;
  const depth = thickness * 1.5;

  // Glass fills
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.1)' : 'rgba(135,206,235,0.2)';

  // Left angled panel
  ctx.beginPath();
  ctx.moveTo(-winWidth / 2, -thickness / 2);
  ctx.lineTo(-winWidth / 2 + sideWidth, -thickness / 2 - depth);
  ctx.lineTo(-winWidth / 2 + sideWidth, thickness / 2 - depth);
  ctx.lineTo(-winWidth / 2, thickness / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Center panel
  ctx.fillRect(-winWidth / 2 + sideWidth, -thickness / 2 - depth, centerWidth, thickness);
  ctx.strokeRect(-winWidth / 2 + sideWidth, -thickness / 2 - depth, centerWidth, thickness);

  // Right angled panel
  ctx.beginPath();
  ctx.moveTo(winWidth / 2, -thickness / 2);
  ctx.lineTo(winWidth / 2 - sideWidth, -thickness / 2 - depth);
  ctx.lineTo(winWidth / 2 - sideWidth, thickness / 2 - depth);
  ctx.lineTo(winWidth / 2, thickness / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawBowWindow(ctx, winWidth, thickness, isSelected) {
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#87CEEB';
  ctx.lineWidth = 1.5;

  const depth = thickness * 1.2;

  // Glass fill - curved shape
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.1)' : 'rgba(135,206,235,0.2)';
  ctx.beginPath();
  ctx.moveTo(-winWidth / 2, -thickness / 2);
  ctx.quadraticCurveTo(0, -thickness / 2 - depth, winWidth / 2, -thickness / 2);
  ctx.lineTo(winWidth / 2, thickness / 2);
  ctx.quadraticCurveTo(0, thickness / 2 - depth, -winWidth / 2, thickness / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Panel dividers
  ctx.lineWidth = 1;
  const segments = 4;
  for (let i = 1; i < segments; i++) {
    const x = -winWidth / 2 + (winWidth / segments) * i;
    const curveOffset = Math.sin((i / segments) * Math.PI) * depth;
    ctx.beginPath();
    ctx.moveTo(x, -thickness / 2 - curveOffset);
    ctx.lineTo(x, thickness / 2 - curveOffset);
    ctx.stroke();
  }
}

/**
 * Draw temporary dimensions showing window position relative to wall ends
 * Similar to Revit's temporary dimensions when an element is selected
 * Dimensions go to the CENTER of the window
 */
export function drawWindowTemporaryDimensions(ctx, window, wall, units = 'imperial', wallDetailLevel = 'simple') {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const wallLength = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  // Window center position along wall (0-1 normalized)
  const windowCenterPos = window.position * wallLength;

  // Calculate distances from window CENTER to wall ends
  const distToWallStart = windowCenterPos; // Distance from wall start to center of window
  const distToWallEnd = wallLength - windowCenterPos; // Distance from center of window to wall end

  // Get wall thickness for offset
  const thicknessInches = WALL_THICKNESS_OPTIONS[wall.type]?.thickness || 8;
  const thickness = inchesToPixels(thicknessInches);

  const isArchitectural = wallDetailLevel === 'architectural';
  const dimColor = isArchitectural ? '#000000' : '#00aaff';
  const bgColor = isArchitectural ? 'rgba(255,255,255,0.9)' : 'rgba(8,12,16,0.85)';

  ctx.save();

  // Calculate window center position in world coordinates
  const windowPos = {
    x: wall.start.x + dx * window.position,
    y: wall.start.y + dy * window.position
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
  const minDimDistance = 20;

  // Left dimension (wall start to window center)
  if (distToWallStart > minDimDistance) {
    const startX = wall.start.x + perpX * dimOffset;
    const startY = wall.start.y + perpY * dimOffset;
    const endX = windowPos.x + perpX * dimOffset;
    const endY = windowPos.y + perpY * dimOffset;

    drawTempDimension(ctx, startX, startY, endX, endY, distToWallStart, angle, dimColor, bgColor, fontSize, units);
  }

  // Right dimension (window center to wall end)
  if (distToWallEnd > minDimDistance) {
    const startX = windowPos.x + perpX * dimOffset;
    const startY = windowPos.y + perpY * dimOffset;
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
