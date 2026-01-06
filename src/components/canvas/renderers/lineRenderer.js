/**
 * Line Renderer - Draws annotation lines
 */

export function drawLine(ctx, line, isSelected = false, layerColor = null) {
  const { start, end, lineType = 'solid', color, lineWidth = 1 } = line;
  // Use item color if set, otherwise use layer color, otherwise use default
  const drawColor = color || layerColor || '#00c8ff';

  ctx.save();

  // Set line style
  ctx.strokeStyle = isSelected ? '#00ffaa' : drawColor;
  ctx.lineWidth = isSelected ? lineWidth + 1 : lineWidth;
  ctx.lineCap = 'round';

  // Set dash pattern based on line type
  switch (lineType) {
    case 'dashed':
      ctx.setLineDash([10, 5]);
      break;
    case 'dotted':
      ctx.setLineDash([2, 4]);
      break;
    case 'dashdot':
      ctx.setLineDash([10, 3, 2, 3]);
      break;
    case 'center':
      ctx.setLineDash([20, 5, 5, 5]);
      break;
    case 'hidden':
      ctx.setLineDash([8, 4]);
      break;
    default:
      ctx.setLineDash([]);
  }

  // Draw the line
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  // Draw selection indicators
  if (isSelected) {
    ctx.setLineDash([]);
    ctx.fillStyle = '#00ffaa';

    // Start point
    ctx.beginPath();
    ctx.arc(start.x, start.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // End point
    ctx.beginPath();
    ctx.arc(end.x, end.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
