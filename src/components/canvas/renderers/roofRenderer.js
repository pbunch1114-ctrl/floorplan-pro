/**
 * Roof Renderer - Draws roof outlines in plan view
 */

import { GRID_SIZE } from '../../../constants/grid';
import { ROOF_TYPES, ROOF_PITCHES } from '../../../constants/roofs';
import { pixelsToFeet } from '../../../utils/measurements';

export function drawRoof(ctx, roof, isSelected = false, formatMeasurement = (v) => `${v}'`) {
  const { x, y, width, height, type, pitch, ridgeDirection, showRafters } = roof;

  // Fill with roof color
  ctx.fillStyle = isSelected ? 'rgba(139,90,43,0.3)' : 'rgba(139,90,43,0.15)';
  ctx.fillRect(x, y, width, height);

  // Draw roof pattern based on type
  ctx.strokeStyle = isSelected ? '#00ffaa' : 'rgba(139,90,43,0.8)';
  ctx.lineWidth = isSelected ? 2 : 1.5;

  // Border
  ctx.strokeRect(x, y, width, height);

  // Ridge line
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (type === 'gable' || type === 'hip') {
    if (ridgeDirection === 'horizontal') {
      ctx.moveTo(x, y + height / 2);
      ctx.lineTo(x + width, y + height / 2);
    } else {
      ctx.moveTo(x + width / 2, y);
      ctx.lineTo(x + width / 2, y + height);
    }
  } else if (type === 'shed') {
    // Shed roof - just show slope direction with arrow
    ctx.moveTo(x + width * 0.3, y + height / 2);
    ctx.lineTo(x + width * 0.7, y + height / 2);
    ctx.moveTo(x + width * 0.6, y + height / 2 - 8);
    ctx.lineTo(x + width * 0.7, y + height / 2);
    ctx.lineTo(x + width * 0.6, y + height / 2 + 8);
  }
  ctx.stroke();

  // Hip lines (diagonal from corners to ridge)
  if (type === 'hip') {
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    if (ridgeDirection === 'horizontal') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + height / 2, y + height / 2);
      ctx.moveTo(x, y + height);
      ctx.lineTo(x + height / 2, y + height / 2);
      ctx.moveTo(x + width, y);
      ctx.lineTo(x + width - height / 2, y + height / 2);
      ctx.moveTo(x + width, y + height);
      ctx.lineTo(x + width - height / 2, y + height / 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + width / 2, y + width / 2);
      ctx.moveTo(x + width, y);
      ctx.lineTo(x + width / 2, y + width / 2);
      ctx.moveTo(x, y + height);
      ctx.lineTo(x + width / 2, y + height - width / 2);
      ctx.moveTo(x + width, y + height);
      ctx.lineTo(x + width / 2, y + height - width / 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Draw rafters if enabled
  if (showRafters) {
    ctx.strokeStyle = isSelected ? 'rgba(0,255,170,0.5)' : 'rgba(139,90,43,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    const rafterSpacing = 24; // 24 inches (2 feet on center)
    const rafterSpacingPx = rafterSpacing * (GRID_SIZE / 6);

    if (ridgeDirection === 'horizontal') {
      // Rafters run perpendicular to ridge (vertical lines)
      for (let rx = x + rafterSpacingPx; rx < x + width; rx += rafterSpacingPx) {
        ctx.beginPath();
        ctx.moveTo(rx, y);
        ctx.lineTo(rx, y + height);
        ctx.stroke();
      }
    } else {
      // Rafters run perpendicular to ridge (horizontal lines)
      for (let ry = y + rafterSpacingPx; ry < y + height; ry += rafterSpacingPx) {
        ctx.beginPath();
        ctx.moveTo(x, ry);
        ctx.lineTo(x + width, ry);
        ctx.stroke();
      }
    }
  }

  // Label
  ctx.font = '11px "SF Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isSelected ? '#00ffaa' : 'rgba(139,90,43,0.9)';
  ctx.fillText(`${ROOF_TYPES[type]?.label || 'Roof'} ${pitch || '6:12'}`, x + width / 2, y + height / 2 - 10);

  // Dimensions
  ctx.font = '10px "SF Mono", monospace';
  ctx.fillStyle = 'rgba(139,90,43,0.7)';
  const roofWFt = pixelsToFeet(width);
  const roofHFt = pixelsToFeet(height);
  ctx.fillText(`${formatMeasurement(roofWFt)} × ${formatMeasurement(roofHFt)}`, x + width / 2, y + height / 2 + 8);

  // Selection handles
  if (isSelected) {
    const handleSize = 8;
    ctx.fillStyle = '#00ffaa';

    // Corner handles
    ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
  }
}
