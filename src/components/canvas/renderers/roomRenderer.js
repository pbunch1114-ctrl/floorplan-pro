/**
 * Room Renderer - Draws room labels and boundaries
 */

import { GRID_SIZE } from '../../../constants/grid';
import { pixelsToFeet } from '../../../utils/measurements';

export function drawRoom(ctx, room, isSelected = false, scale = 1, isMobile = false, formatMeasurement = (v) => `${v}'`, wallDetailLevel = 'simple') {
  const { x, y, width, height, name, color } = room;

  const isArchitectural = wallDetailLevel === 'architectural';

  // Fill - no fill in architectural mode for cleaner look
  if (!isArchitectural) {
    ctx.fillStyle = color || 'rgba(100, 200, 255, 0.15)';
    ctx.fillRect(x, y, width, height);
  }

  // Border - no border in architectural mode (walls provide the boundary)
  if (!isArchitectural) {
    ctx.strokeStyle = isSelected ? '#00ffaa' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash(isSelected ? [] : [5, 5]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
  }

  // Auto-scale room labels for mobile readability
  const roomLabelScale = Math.max(isMobile ? 1.3 : 1.0, 1 / scale);
  const nameFontSize = Math.round(14 * roomLabelScale);
  const dimFontSize = Math.round(11 * roomLabelScale);

  // Room name - black text for architectural mode
  ctx.fillStyle = isArchitectural ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)';
  ctx.font = `${nameFontSize}px "Inter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(name || 'Room', x + width / 2, y + height / 2 - 8 * roomLabelScale);

  // Dimensions - black text for architectural mode
  const widthFt = (width / GRID_SIZE / 2).toFixed(1);
  const heightFt = (height / GRID_SIZE / 2).toFixed(1);
  ctx.font = `${dimFontSize}px "SF Mono", monospace`;
  ctx.fillStyle = isArchitectural ? 'rgba(0,0,0,0.6)' : 'rgba(0,200,255,0.8)';
  ctx.fillText(
    `${formatMeasurement(widthFt)} × ${formatMeasurement(heightFt)}`,
    x + width / 2,
    y + height / 2 + 10 * roomLabelScale
  );

  // Selection handles - black for architectural mode
  if (isSelected) {
    const handleSize = 8 / scale;
    ctx.fillStyle = isArchitectural ? '#000000' : '#00ffaa';

    // Corner handles
    ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize);

    // Edge handles
    ctx.fillRect(x + width/2 - handleSize/2, y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x + width/2 - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x - handleSize/2, y + height/2 - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x + width - handleSize/2, y + height/2 - handleSize/2, handleSize, handleSize);
  }
}
