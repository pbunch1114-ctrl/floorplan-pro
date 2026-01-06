/**
 * Text Renderer - Draws text annotations
 */

import { FONT_STYLES } from '../../../constants/styles';

export function drawText(ctx, textAnnotation, isSelected = false, scale = 1, fontStyle = 'modern', layerColor = null) {
  const { position, text, fontSize = 14, color, rotation = 0 } = textAnnotation;
  // Use item color if set, otherwise use layer color, otherwise use default
  const drawColor = color || layerColor || '#ffffff';
  const font = FONT_STYLES[fontStyle] || FONT_STYLES.modern;

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate((rotation * Math.PI) / 180);

  // Apply text transform from font style
  let displayText = text;
  if (font.textTransform === 'uppercase') {
    displayText = text.toUpperCase();
  }

  // Scale font for visibility at different zoom levels
  const scaledFontSize = Math.max(fontSize, fontSize / scale);

  // Build font string from font style
  const fontWeight = font.fontWeight || 'normal';
  const fontFamily = font.fontFamily || '"SF Mono", monospace';
  ctx.font = `${fontWeight} ${scaledFontSize}px ${fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Apply letter spacing
  const letterSpacing = font.letterSpacing ? parseFloat(font.letterSpacing) * scaledFontSize : 0;

  // Measure text for background (accounting for letter spacing)
  let textWidth = ctx.measureText(displayText).width;
  if (letterSpacing > 0) {
    textWidth += letterSpacing * (displayText.length - 1);
  }
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
  ctx.fillStyle = isSelected ? '#00ffaa' : drawColor;

  // Draw text with letter spacing if needed
  if (letterSpacing > 0) {
    let currentX = 0;
    for (let i = 0; i < displayText.length; i++) {
      const char = displayText[i];
      ctx.fillText(char, currentX, 0);
      currentX += ctx.measureText(char).width + letterSpacing;
    }
  } else {
    ctx.fillText(displayText, 0, 0);
  }

  ctx.restore();
}
