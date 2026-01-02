/**
 * Grid Renderer - Draws the background grid
 */

export function drawGrid(ctx, gridSize, scale, mode = 'normal') {
  // In architectural mode, use white background with no grid (like Revit)
  if (mode === 'architectural') {
    // Fill with white background for clean drafting look
    const gridExtent = 3000;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-gridExtent, -gridExtent, gridExtent * 2, gridExtent * 2);
    return;
  }

  const gridExtent = 3000;

  // Minor grid lines
  ctx.strokeStyle = '#141c24';
  ctx.lineWidth = 0.5;

  for (let x = -gridExtent; x <= gridExtent; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, -gridExtent);
    ctx.lineTo(x, gridExtent);
    ctx.stroke();
  }

  for (let y = -gridExtent; y <= gridExtent; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(-gridExtent, y);
    ctx.lineTo(gridExtent, y);
    ctx.stroke();
  }

  // Major grid lines (every 5 units)
  ctx.strokeStyle = '#1c2830';
  ctx.lineWidth = 1;

  for (let x = -gridExtent; x <= gridExtent; x += gridSize * 5) {
    ctx.beginPath();
    ctx.moveTo(x, -gridExtent);
    ctx.lineTo(x, gridExtent);
    ctx.stroke();
  }

  for (let y = -gridExtent; y <= gridExtent; y += gridSize * 5) {
    ctx.beginPath();
    ctx.moveTo(-gridExtent, y);
    ctx.lineTo(gridExtent, y);
    ctx.stroke();
  }
}
