/**
 * Fillet Renderer - Draws rounded corner arcs
 */

import { GRID_SIZE } from '../../../constants/grid';
import { WALL_THICKNESS_OPTIONS } from '../../../constants/walls';

// Convert inches to pixels (GRID_SIZE pixels = 6 inches)
const inchesToPixels = (inches) => inches * (GRID_SIZE / 6);

export function drawFillet(ctx, fillet, isSelected = false) {
  const { center, radius, startAngle, endAngle, wallType } = fillet;

  // Get wall thickness for this fillet
  const thicknessInches = WALL_THICKNESS_OPTIONS[wallType]?.thickness || 6;
  const thickness = inchesToPixels(thicknessInches);

  ctx.save();

  // Draw the fillet arc with wall thickness
  ctx.strokeStyle = isSelected ? '#00ffaa' : (wallType?.includes('exterior') ? '#f0f8ff' : '#c0d0e0');
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';

  // Determine arc direction (always draw the shorter arc)
  let angleDiff = endAngle - startAngle;
  while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

  ctx.beginPath();
  if (angleDiff > 0) {
    ctx.arc(center.x, center.y, radius, startAngle, endAngle, false);
  } else {
    ctx.arc(center.x, center.y, radius, startAngle, endAngle, true);
  }
  ctx.stroke();

  // Draw glow effect for visibility
  ctx.strokeStyle = 'rgba(0,200,255,0.15)';
  ctx.lineWidth = thickness + 8;
  ctx.beginPath();
  if (angleDiff > 0) {
    ctx.arc(center.x, center.y, radius, startAngle, endAngle, false);
  } else {
    ctx.arc(center.x, center.y, radius, startAngle, endAngle, true);
  }
  ctx.stroke();

  // Selection highlight
  if (isSelected) {
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    if (angleDiff > 0) {
      ctx.arc(center.x, center.y, radius + thickness / 2 + 5, startAngle, endAngle, false);
    } else {
      ctx.arc(center.x, center.y, radius + thickness / 2 + 5, startAngle, endAngle, true);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}
