/**
 * Text Renderer - Draws text annotations
 */

export function drawText(ctx, textAnnotation, isSelected = false, scale = 1) {
  const { position, text, fontSize = 14, color = '#ffffff', rotation = 0 } = textAnnotation;

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate((rotation * Math.PI) / 180);

  // Scale font for visibility at different zoom levels
  const scaledFontSize = Math.max(fontSize, fontSize / scale);
  ctx.font = `${scaledFontSize}px "SF Mono", monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Measure text for background
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = scaledFontSize * 1.2;

  // Draw background
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.2)' : 'rgba(8,12,16,0.8)';
  ctx.fillRect(-4, -4, textWidth + 8, textHeight + 8);

  // Draw border if selected
  if (isSelected) {
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(-6, -6, textWidth + 12, textHeight + 12);
    ctx.setLineDash([]);
  }

  // Draw text
  ctx.fillStyle = isSelected ? '#00ffaa' : color;
  ctx.fillText(text, 0, 0);

  ctx.restore();
}
