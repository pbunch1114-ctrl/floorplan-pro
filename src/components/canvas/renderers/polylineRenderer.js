/**
 * Polyline Renderer - Draws polylines (connected line segments)
 */

export function drawPolyline(ctx, polyline, isSelected = false, scale = 1, selectedVertexIndex = null, layerColor = null) {
  const { points, lineType = 'solid', color, lineWidth = 1, closed = false } = polyline;
  // Use item color if set, otherwise use layer color, otherwise use default
  const drawColor = color || layerColor || '#00c8ff';

  if (!points || points.length < 2) return;

  ctx.save();

  // Set line style
  ctx.strokeStyle = isSelected ? '#00ffaa' : drawColor;
  ctx.lineWidth = isSelected ? lineWidth + 1 : lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

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

  // Draw the polyline
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  if (closed) {
    ctx.closePath();
  }
  ctx.stroke();

  // Draw selection indicators at each vertex
  if (isSelected) {
    ctx.setLineDash([]);

    points.forEach((point, index) => {
      const isHighlighted = index === selectedVertexIndex;
      ctx.beginPath();
      ctx.arc(point.x, point.y, isHighlighted ? 8 / scale : 5 / scale, 0, Math.PI * 2);

      if (isHighlighted) {
        // Highlighted vertex - yellow fill with white border
        ctx.fillStyle = '#ffff00';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      } else {
        // Normal vertex - green fill
        ctx.fillStyle = '#00ffaa';
        ctx.fill();
      }
    });
  }

  ctx.restore();
}

/**
 * Draw polyline preview while drawing (shows accumulated points + current mouse position)
 */
export function drawPolylinePreview(ctx, points, currentEnd) {
  if (!points || points.length === 0) return;

  ctx.save();

  ctx.strokeStyle = '#00c8ff';
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw completed segments (solid lines between confirmed points)
  if (points.length >= 2) {
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  // Draw preview line from last point to current mouse position (dashed)
  if (currentEnd && points.length >= 1) {
    const lastPoint = points[points.length - 1];
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentEnd.x, currentEnd.y);
    ctx.stroke();
  }

  // Draw vertices (green dots at each confirmed point)
  ctx.setLineDash([]);
  ctx.fillStyle = '#00ffaa';
  points.forEach(point => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}
