/**
 * Roof Renderer - Draws roof outlines in plan view
 * Supports both legacy (x, y, width, height) and new (points array) formats
 */

import { GRID_SIZE } from '../../../constants/grid';
import { ROOF_TYPES, ROOF_PITCHES } from '../../../constants/roofs';
import { pixelsToFeet } from '../../../utils/measurements';

// Helper to get points array from roof (handles legacy format)
function getRoofPoints(roof) {
  if (roof.points && roof.points.length >= 3) {
    return roof.points;
  }
  // Legacy format - convert x, y, width, height to points
  const { x, y, width, height } = roof;
  return [
    { x, y },                    // Top-left
    { x: x + width, y },         // Top-right
    { x: x + width, y: y + height }, // Bottom-right
    { x, y: y + height },        // Bottom-left
  ];
}

// Helper to get bounding box from points
function getBoundingBox(points) {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

export function drawRoof(ctx, roof, isSelected = false, formatMeasurement = (v) => `${v}'`) {
  const points = getRoofPoints(roof);
  const { type, pitch, ridgeDirection, showRafters, showEndpoints } = roof;
  const bounds = getBoundingBox(points);
  const { x, y, width, height, centerX, centerY } = bounds;

  // Draw roof polygon fill
  ctx.fillStyle = isSelected ? 'rgba(139,90,43,0.3)' : 'rgba(139,90,43,0.15)';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // Draw roof polygon border
  ctx.strokeStyle = isSelected ? '#00ffaa' : 'rgba(139,90,43,0.8)';
  ctx.lineWidth = isSelected ? 2 : 1.5;
  ctx.stroke();

  // Ridge line - for hip roofs, stop at hip intersection points
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (type === 'gable') {
    // Gable ridge extends to the walls
    if (ridgeDirection === 'horizontal') {
      ctx.moveTo(x, centerY);
      ctx.lineTo(x + width, centerY);
    } else {
      ctx.moveTo(centerX, y);
      ctx.lineTo(centerX, y + height);
    }
  } else if (type === 'hip') {
    // Hip ridge stops where hip lines meet
    if (ridgeDirection === 'horizontal') {
      const ridgeInset = Math.min(height / 2, width / 4);
      ctx.moveTo(x + ridgeInset, centerY);
      ctx.lineTo(x + width - ridgeInset, centerY);
    } else {
      const ridgeInset = Math.min(width / 2, height / 4);
      ctx.moveTo(centerX, y + ridgeInset);
      ctx.lineTo(centerX, y + height - ridgeInset);
    }
  } else if (type === 'shed') {
    // Shed roof - just show slope direction with arrow
    ctx.moveTo(x + width * 0.3, centerY);
    ctx.lineTo(x + width * 0.7, centerY);
    ctx.moveTo(x + width * 0.6, centerY - 8);
    ctx.lineTo(x + width * 0.7, centerY);
    ctx.lineTo(x + width * 0.6, centerY + 8);
  }
  ctx.stroke();

  // Hip lines (diagonal from corners to ridge endpoints)
  if (type === 'hip' && points.length >= 4) {
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();

    // Calculate ridge endpoints based on direction
    let ridgeStart, ridgeEnd;
    if (ridgeDirection === 'horizontal') {
      // Ridge runs left-right, offset from edges by half the height
      const ridgeInset = Math.min(height / 2, width / 4);
      ridgeStart = { x: x + ridgeInset, y: centerY };
      ridgeEnd = { x: x + width - ridgeInset, y: centerY };
    } else {
      // Ridge runs top-bottom, offset from edges by half the width
      const ridgeInset = Math.min(width / 2, height / 4);
      ridgeStart = { x: centerX, y: y + ridgeInset };
      ridgeEnd = { x: centerX, y: y + height - ridgeInset };
    }

    // Draw lines from each corner to the nearest ridge endpoint
    points.forEach(point => {
      // Determine which ridge endpoint is closer
      const distToStart = Math.hypot(point.x - ridgeStart.x, point.y - ridgeStart.y);
      const distToEnd = Math.hypot(point.x - ridgeEnd.x, point.y - ridgeEnd.y);
      const ridgePoint = distToStart < distToEnd ? ridgeStart : ridgeEnd;

      ctx.moveTo(point.x, point.y);
      ctx.lineTo(ridgePoint.x, ridgePoint.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw rafters if enabled (simplified for bounding box)
  if (showRafters) {
    ctx.strokeStyle = isSelected ? 'rgba(0,255,170,0.5)' : 'rgba(139,90,43,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    const rafterSpacing = 24; // 24 inches (2 feet on center)
    const rafterSpacingPx = rafterSpacing * (GRID_SIZE / 6);

    if (ridgeDirection === 'horizontal') {
      for (let rx = x + rafterSpacingPx; rx < x + width; rx += rafterSpacingPx) {
        ctx.beginPath();
        ctx.moveTo(rx, y);
        ctx.lineTo(rx, y + height);
        ctx.stroke();
      }
    } else {
      for (let ry = y + rafterSpacingPx; ry < y + height; ry += rafterSpacingPx) {
        ctx.beginPath();
        ctx.moveTo(x, ry);
        ctx.lineTo(x + width, ry);
        ctx.stroke();
      }
    }
  }

  // Label at center
  ctx.font = '11px "SF Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isSelected ? '#00ffaa' : 'rgba(139,90,43,0.9)';
  ctx.fillText(`${ROOF_TYPES[type]?.label || 'Roof'} ${pitch || '6:12'}`, centerX, centerY - 10);

  // Dimensions
  ctx.font = '10px "SF Mono", monospace';
  ctx.fillStyle = 'rgba(139,90,43,0.7)';
  const roofWFt = pixelsToFeet(width);
  const roofHFt = pixelsToFeet(height);
  ctx.fillText(`${formatMeasurement(roofWFt)} × ${formatMeasurement(roofHFt)}`, centerX, centerY + 8);

  // Selection handles at each point
  if (isSelected) {
    const handleSize = 12;
    ctx.fillStyle = '#00ffaa';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    points.forEach(point => {
      ctx.fillRect(point.x - handleSize/2, point.y - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(point.x - handleSize/2, point.y - handleSize/2, handleSize, handleSize);
    });
  }

  // Draw endpoints with coordinates when enabled
  if (showEndpoints) {
    drawEndpointLabels(ctx, points, centerX, centerY, isSelected, formatMeasurement);
  }
}

// Helper function to draw endpoint labels inside the roof polygon
function drawEndpointLabels(ctx, points, centerX, centerY, isSelected, formatMeasurement) {
  ctx.font = '9px "SF Mono", monospace';
  ctx.textBaseline = 'top';

  points.forEach((point, index) => {
    // Draw endpoint circle
    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#00ffaa' : '#ff9933';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw coordinate label
    const coordX = pixelsToFeet(point.x);
    const coordY = pixelsToFeet(point.y);
    const coordText = `P${index + 1}: (${formatMeasurement(coordX)}, ${formatMeasurement(coordY)})`;

    // Position label INSIDE the roof polygon by offsetting toward center
    const textWidth = ctx.measureText(coordText).width;

    // Calculate direction from point toward center
    const toCenterX = centerX - point.x;
    const toCenterY = centerY - point.y;
    const dist = Math.hypot(toCenterX, toCenterY);

    // Normalize and apply offset (move label toward center)
    const labelOffset = 20;
    const offsetX = dist > 0 ? (toCenterX / dist) * labelOffset : 0;
    const offsetY = dist > 0 ? (toCenterY / dist) * labelOffset : 0;

    // Position label at offset position
    const labelX = point.x + offsetX;
    const labelY = point.y + offsetY;

    // Background for text - centered on label position
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(
      labelX - textWidth / 2 - 4,
      labelY - 2,
      textWidth + 8,
      16
    );

    // Text - centered
    ctx.fillStyle = isSelected ? '#00ffaa' : '#ff9933';
    ctx.textAlign = 'center';
    ctx.fillText(coordText, labelX, labelY);
  });

  // Reset text alignment
  ctx.textAlign = 'center';
}

// Separate function to draw just the endpoint handles (for drawing on top of walls)
export function drawRoofEndpoints(ctx, roof, isSelected = false, formatMeasurement = (v) => `${v}'`) {
  const points = getRoofPoints(roof);
  const { showEndpoints } = roof;
  const bounds = getBoundingBox(points);
  const { centerX, centerY } = bounds;

  // Selection handles at each point
  if (isSelected) {
    const handleSize = 12;
    ctx.fillStyle = '#00ffaa';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    points.forEach(point => {
      ctx.fillRect(point.x - handleSize/2, point.y - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(point.x - handleSize/2, point.y - handleSize/2, handleSize, handleSize);
    });
  }

  // Draw endpoints with coordinates when enabled
  if (showEndpoints) {
    drawEndpointLabels(ctx, points, centerX, centerY, isSelected, formatMeasurement);
  }
}

// Export helper for use in interaction code
export { getRoofPoints, getBoundingBox };
