/**
 * Hatch Renderer - Draws hatched/filled polygon areas with various patterns
 */

// Hatch pattern types
export const HATCH_PATTERNS = {
  solid: { label: 'Solid Fill', type: 'solid' },
  diagonal: { label: 'Diagonal Lines', type: 'lines', angle: 45 },
  horizontal: { label: 'Horizontal Lines', type: 'lines', angle: 0 },
  vertical: { label: 'Vertical Lines', type: 'lines', angle: 90 },
  crosshatch: { label: 'Crosshatch', type: 'crosshatch', angles: [45, -45] },
  grid: { label: 'Grid', type: 'crosshatch', angles: [0, 90] },
  dots: { label: 'Dots', type: 'dots' },
  brick: { label: 'Brick', type: 'brick' },
  concrete: { label: 'Concrete', type: 'concrete' },
  earth: { label: 'Earth/Soil', type: 'earth' },
  gravel: { label: 'Gravel', type: 'gravel' },
  insulation: { label: 'Insulation', type: 'insulation' },
};

/**
 * Draw a hatch pattern inside a polygon
 */
export function drawHatch(ctx, hatch, isSelected = false, scale = 1, selectedVertexIndex = null, layerColor = null) {
  const {
    points,
    pattern = 'diagonal',
    color,
    backgroundColor = 'transparent',
    spacing = 10,
    lineWidth = 1,
    opacity = 0.5,
  } = hatch;
  // Use item color if set, otherwise use layer color, otherwise use default
  const drawColor = color || layerColor || '#888888';

  if (!points || points.length < 3) return;

  ctx.save();

  // Calculate bounding box
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));

  // Create clipping path from polygon
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.clip();

  // Draw background fill if not transparent
  if (backgroundColor && backgroundColor !== 'transparent') {
    ctx.globalAlpha = opacity;
    ctx.fillStyle = backgroundColor;
    ctx.fill();
  }

  // Draw the pattern
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = drawColor;
  ctx.fillStyle = drawColor;
  ctx.lineWidth = lineWidth;

  const patternConfig = HATCH_PATTERNS[pattern] || HATCH_PATTERNS.diagonal;

  switch (patternConfig.type) {
    case 'solid':
      ctx.fillStyle = drawColor;
      ctx.fill();
      break;

    case 'lines':
      drawLinePattern(ctx, minX, minY, maxX, maxY, patternConfig.angle, spacing, lineWidth);
      break;

    case 'crosshatch':
      patternConfig.angles.forEach(angle => {
        drawLinePattern(ctx, minX, minY, maxX, maxY, angle, spacing, lineWidth);
      });
      break;

    case 'dots':
      drawDotPattern(ctx, minX, minY, maxX, maxY, spacing, lineWidth * 2);
      break;

    case 'brick':
      drawBrickPattern(ctx, minX, minY, maxX, maxY, spacing, lineWidth);
      break;

    case 'concrete':
      drawConcretePattern(ctx, minX, minY, maxX, maxY, spacing, lineWidth);
      break;

    case 'earth':
      drawEarthPattern(ctx, minX, minY, maxX, maxY, spacing, lineWidth);
      break;

    case 'gravel':
      drawGravelPattern(ctx, minX, minY, maxX, maxY, spacing, lineWidth);
      break;

    case 'insulation':
      drawInsulationPattern(ctx, minX, minY, maxX, maxY, spacing, lineWidth);
      break;
  }

  ctx.restore();

  // Draw boundary outline
  ctx.save();
  ctx.globalAlpha = isSelected ? 1 : 0.8;
  ctx.strokeStyle = isSelected ? '#00ffaa' : drawColor;
  ctx.lineWidth = isSelected ? 2 / scale : 1 / scale;
  ctx.setLineDash(isSelected ? [] : []);

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.stroke();

  // Draw selection vertices
  if (isSelected) {
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
 * Draw parallel lines at an angle
 */
function drawLinePattern(ctx, minX, minY, maxX, maxY, angle, spacing, lineWidth) {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Calculate the diagonal to ensure we cover the entire area
  const diagonal = Math.sqrt(Math.pow(maxX - minX, 2) + Math.pow(maxY - minY, 2));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  ctx.lineWidth = lineWidth;

  // Draw parallel lines
  for (let d = -diagonal; d <= diagonal; d += spacing) {
    const x1 = centerX + d * cos - diagonal * sin;
    const y1 = centerY + d * sin + diagonal * cos;
    const x2 = centerX + d * cos + diagonal * sin;
    const y2 = centerY + d * sin - diagonal * cos;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

/**
 * Draw dot pattern
 */
function drawDotPattern(ctx, minX, minY, maxX, maxY, spacing, dotSize) {
  for (let x = minX; x <= maxX; x += spacing) {
    for (let y = minY; y <= maxY; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Draw brick pattern
 */
function drawBrickPattern(ctx, minX, minY, maxX, maxY, spacing, lineWidth) {
  const brickWidth = spacing * 2;
  const brickHeight = spacing;

  ctx.lineWidth = lineWidth;

  let row = 0;
  for (let y = minY; y <= maxY; y += brickHeight) {
    const offset = (row % 2) * (brickWidth / 2);

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(minX, y);
    ctx.lineTo(maxX, y);
    ctx.stroke();

    // Vertical lines for this row
    for (let x = minX + offset; x <= maxX; x += brickWidth) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + brickHeight);
      ctx.stroke();
    }
    row++;
  }
}

/**
 * Draw concrete/aggregate pattern (random dots and small shapes)
 */
function drawConcretePattern(ctx, minX, minY, maxX, maxY, spacing, lineWidth) {
  // Use deterministic pseudo-random based on position
  const seed = (minX + minY) * 1000;
  let random = seed;
  const nextRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };

  ctx.lineWidth = lineWidth;

  for (let x = minX; x <= maxX; x += spacing / 2) {
    for (let y = minY; y <= maxY; y += spacing / 2) {
      if (nextRandom() > 0.7) {
        const size = 1 + nextRandom() * 3;
        const offsetX = (nextRandom() - 0.5) * spacing / 2;
        const offsetY = (nextRandom() - 0.5) * spacing / 2;

        ctx.beginPath();
        ctx.arc(x + offsetX, y + offsetY, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/**
 * Draw earth/soil pattern (diagonal lines with dots)
 */
function drawEarthPattern(ctx, minX, minY, maxX, maxY, spacing, lineWidth) {
  // Draw diagonal lines
  drawLinePattern(ctx, minX, minY, maxX, maxY, 45, spacing, lineWidth);

  // Add some dots
  const seed = (minX + minY) * 1000;
  let random = seed;
  const nextRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };

  for (let x = minX; x <= maxX; x += spacing) {
    for (let y = minY; y <= maxY; y += spacing) {
      if (nextRandom() > 0.5) {
        ctx.beginPath();
        ctx.arc(x + nextRandom() * spacing / 2, y + nextRandom() * spacing / 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/**
 * Draw gravel pattern (small circles/ovals)
 */
function drawGravelPattern(ctx, minX, minY, maxX, maxY, spacing, lineWidth) {
  const seed = (minX + minY) * 1000;
  let random = seed;
  const nextRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };

  ctx.lineWidth = lineWidth;

  for (let x = minX; x <= maxX; x += spacing / 1.5) {
    for (let y = minY; y <= maxY; y += spacing / 1.5) {
      const offsetX = (nextRandom() - 0.5) * spacing / 2;
      const offsetY = (nextRandom() - 0.5) * spacing / 2;
      const size = 2 + nextRandom() * 4;

      ctx.beginPath();
      ctx.ellipse(x + offsetX, y + offsetY, size, size * 0.7, nextRandom() * Math.PI, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

/**
 * Draw insulation pattern (wavy lines)
 */
function drawInsulationPattern(ctx, minX, minY, maxX, maxY, spacing, lineWidth) {
  ctx.lineWidth = lineWidth;
  const waveHeight = spacing / 3;
  const waveLength = spacing;

  for (let y = minY; y <= maxY; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(minX, y);

    for (let x = minX; x <= maxX; x += waveLength / 4) {
      const waveY = y + Math.sin((x - minX) / waveLength * Math.PI * 2) * waveHeight;
      ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  }
}

/**
 * Draw hatch preview while drawing (shows accumulated points + current mouse position)
 */
export function drawHatchPreview(ctx, points, currentEnd, isClosing = false) {
  if (!points || points.length === 0) return;

  ctx.save();

  // Draw filled preview if we have enough points
  if (points.length >= 2) {
    ctx.fillStyle = 'rgba(136, 136, 136, 0.2)';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    if (currentEnd && !isClosing) {
      ctx.lineTo(currentEnd.x, currentEnd.y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Draw boundary lines (solid for confirmed, dashed for preview)
  ctx.strokeStyle = '#888888';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw completed segments
  if (points.length >= 2) {
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  // Draw preview line from last point to current mouse position
  if (currentEnd && points.length >= 1) {
    const lastPoint = points[points.length - 1];
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentEnd.x, currentEnd.y);
    ctx.stroke();

    // If closing, also show line from current to first point
    if (isClosing && points.length >= 2) {
      ctx.strokeStyle = '#00ffaa';
      ctx.beginPath();
      ctx.moveTo(currentEnd.x, currentEnd.y);
      ctx.lineTo(points[0].x, points[0].y);
      ctx.stroke();
    }
  }

  // Draw vertices
  ctx.setLineDash([]);
  ctx.fillStyle = '#00ffaa';
  points.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, index === 0 ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Highlight first point if we're close to closing
  if (isClosing && points.length >= 3) {
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, 10, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}
