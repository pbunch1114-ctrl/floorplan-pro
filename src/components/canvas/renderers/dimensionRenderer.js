/**
 * Dimension Renderer - Draws dimension lines with architectural styling
 */

import { DIMENSION_STYLES } from '../../../constants/styles';
import { pixelsToFeet } from '../../../utils/measurements';

export function drawDimension(ctx, dim, isSelected = false, scale = 1, isMobile = false, formatMeasurement = (v) => `${v}'`, wallDetailLevel = 'simple') {
  const style = DIMENSION_STYLES[dim.style] || DIMENSION_STYLES.standard;
  const isArchitectural = wallDetailLevel === 'architectural';

  // Auto-scale dimensions to stay readable regardless of zoom
  const minScaleFactor = isMobile ? 1.5 : 1.0;
  const scaleFactor = Math.max(minScaleFactor, 1 / scale);
  const scaledFontSize = style.fontSize * scaleFactor;
  const scaledTickSize = style.tickSize * scaleFactor;
  const scaledLineWidth = Math.max(1.5, 1.5 * scaleFactor);

  const dimStart = dim.start;
  const dimEnd = dim.end;

  const dx = dimEnd.x - dimStart.x;
  const dy = dimEnd.y - dimStart.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  // Calculate perpendicular offset direction
  const perpX = -Math.sin(angle) * (dim.offset || 0);
  const perpY = Math.cos(angle) * (dim.offset || 0);

  // Offset points
  const start = { x: dimStart.x + perpX, y: dimStart.y + perpY };
  const end = { x: dimEnd.x + perpX, y: dimEnd.y + perpY };

  // Use black colors for architectural mode
  const lineColor = isSelected ? '#00ffaa' : (isArchitectural ? '#000000' : style.color);

  ctx.save();

  // Extension lines (from original points to dimension line)
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = scaledLineWidth * 0.7;
  ctx.setLineDash([]);

  // Extension line 1
  ctx.beginPath();
  ctx.moveTo(dimStart.x, dimStart.y);
  ctx.lineTo(start.x + Math.sin(angle) * 4 * scaleFactor, start.y - Math.cos(angle) * 4 * scaleFactor);
  ctx.stroke();

  // Extension line 2
  ctx.beginPath();
  ctx.moveTo(dimEnd.x, dimEnd.y);
  ctx.lineTo(end.x + Math.sin(angle) * 4 * scaleFactor, end.y - Math.cos(angle) * 4 * scaleFactor);
  ctx.stroke();

  // Main dimension line
  ctx.lineWidth = isSelected ? scaledLineWidth * 1.3 : scaledLineWidth;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  // Tick marks at ends
  const tickX = Math.sin(angle) * scaledTickSize;
  const tickY = -Math.cos(angle) * scaledTickSize;

  ctx.lineWidth = scaledLineWidth * 1.3;
  ctx.beginPath();
  ctx.moveTo(start.x - tickX, start.y - tickY);
  ctx.lineTo(start.x + tickX, start.y + tickY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(end.x - tickX, end.y - tickY);
  ctx.lineTo(end.x + tickX, end.y + tickY);
  ctx.stroke();

  // Dimension text
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const lengthFeet = pixelsToFeet(length);
  const labelText = dim.label || formatMeasurement(lengthFeet);

  ctx.save();
  ctx.translate(midX, midY);

  // Rotate text to be readable
  let textAngle = angle;
  if (textAngle > Math.PI / 2) textAngle -= Math.PI;
  if (textAngle < -Math.PI / 2) textAngle += Math.PI;
  ctx.rotate(textAngle);

  // Background for text - white background for architectural mode
  ctx.font = `bold ${scaledFontSize}px "SF Mono", monospace`;
  const textWidth = ctx.measureText(labelText).width;
  ctx.fillStyle = isArchitectural ? 'rgba(255,255,255,0.95)' : 'rgba(8,12,16,0.9)';
  ctx.fillRect(-textWidth / 2 - 6 * scaleFactor, -scaledFontSize / 2 - 3 * scaleFactor, textWidth + 12 * scaleFactor, scaledFontSize + 6 * scaleFactor);

  // Text - black for architectural mode
  ctx.fillStyle = lineColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(labelText, 0, 0);

  ctx.restore();

  // Draw selection handles (endpoint grips) when selected
  if (isSelected) {
    const handleSize = 8 * scaleFactor;
    ctx.fillStyle = '#00ffaa';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * scaleFactor;

    // Handle at start point (offset position) - square
    ctx.fillRect(start.x - handleSize / 2, start.y - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(start.x - handleSize / 2, start.y - handleSize / 2, handleSize, handleSize);

    // Handle at end point (offset position) - square
    ctx.fillRect(end.x - handleSize / 2, end.y - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(end.x - handleSize / 2, end.y - handleSize / 2, handleSize, handleSize);

    // Also show handles at the original reference points (where extension lines start)
    ctx.fillStyle = '#00aaff';
    ctx.fillRect(dimStart.x - handleSize / 2, dimStart.y - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(dimStart.x - handleSize / 2, dimStart.y - handleSize / 2, handleSize, handleSize);

    ctx.fillRect(dimEnd.x - handleSize / 2, dimEnd.y - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(dimEnd.x - handleSize / 2, dimEnd.y - handleSize / 2, handleSize, handleSize);

    // Offset grip handle at midpoint of dimension line - diamond shape (for dragging offset)
    ctx.fillStyle = '#ff9900';
    ctx.beginPath();
    const diamondSize = handleSize * 0.8;
    ctx.moveTo(midX, midY - diamondSize);
    ctx.lineTo(midX + diamondSize, midY);
    ctx.lineTo(midX, midY + diamondSize);
    ctx.lineTo(midX - diamondSize, midY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}
