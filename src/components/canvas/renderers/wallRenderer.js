/**
 * Wall Renderer - Draws walls with various detail levels
 */

import { GRID_SIZE, DEFAULT_WALL_HEIGHT } from '../../../constants/grid';
import { WALL_THICKNESS_OPTIONS, WALL_LAYERS } from '../../../constants/walls';
import { distance, adjustColor } from '../../../utils/geometry';
import { pixelsToFeet, inchesToFeet } from '../../../utils/measurements';

// Convert inches to pixels (GRID_SIZE pixels = 6 inches)
const inchesToPixels = (inches) => inches * (GRID_SIZE / 6);

export function drawWall(ctx, wall, options = {}) {
  const {
    isSelected = false,
    wallDetailLevel = 'simple',
    scale = 1,
    isMobile = false,
    showGrips = false,
    isLocked = false,
    formatMeasurement = (v) => `${v}'`,
  } = options;

  // Convert wall thickness from inches to pixels
  const thicknessInches = WALL_THICKNESS_OPTIONS[wall.type]?.thickness || 8;
  const thickness = inchesToPixels(thicknessInches);
  const wallConfig = WALL_LAYERS[wall.type] || WALL_LAYERS['interior'];

  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const wallLength = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  // For architectural-labels-only, skip geometry drawing entirely
  const skipGeometry = wallDetailLevel === 'architectural-labels-only';

  if (!skipGeometry) {
    ctx.save();
    ctx.translate(wall.start.x, wall.start.y);
    ctx.rotate(angle);
  }

  if (skipGeometry) {
    // Skip all geometry drawing - handled by cornerRenderer
  } else if (wallDetailLevel === 'simple') {
    // Simple mode - just solid fill (original behavior)
    ctx.strokeStyle = 'rgba(0,200,255,0.15)';
    ctx.lineWidth = thickness + 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(wallLength, 0);
    ctx.stroke();

    ctx.strokeStyle = isSelected ? '#00ffaa' : (wall.type?.includes('exterior') ? '#f0f8ff' : '#c0d0e0');
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(wallLength, 0);
    ctx.stroke();

  } else if (wallDetailLevel === 'architectural') {
    // Architectural mode - clean double-line walls like Revit
    // Simple white fill with black outline - no hatching patterns

    // Fill with white - this covers any underlying elements
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, -thickness / 2, wallLength, thickness);

    // Draw outer boundary lines (top and bottom edges)
    // These lines run the full length - corner cleanup will handle intersections
    ctx.strokeStyle = isSelected ? '#00ffaa' : '#000000';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash([]);

    // Top edge - draw full length
    ctx.beginPath();
    ctx.moveTo(0, -thickness / 2);
    ctx.lineTo(wallLength, -thickness / 2);
    ctx.stroke();

    // Bottom edge - draw full length
    ctx.beginPath();
    ctx.moveTo(0, thickness / 2);
    ctx.lineTo(wallLength, thickness / 2);
    ctx.stroke();

    // Draw end caps for free-standing wall ends (will be covered by corner cleanup where walls meet)
    ctx.beginPath();
    ctx.moveTo(0, -thickness / 2);
    ctx.lineTo(0, thickness / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(wallLength, -thickness / 2);
    ctx.lineTo(wallLength, thickness / 2);
    ctx.stroke();

  } else if (wallDetailLevel === 'standard') {
    // Standard mode - show layer outlines
    const totalThickness = wallConfig.layers.reduce((sum, l) => sum + l.thickness, 0);
    const scaleFactor = thickness / totalThickness;
    let yOffset = -thickness / 2;

    // If wall is flipped, reverse the layer order
    const layersToRender = wall.flipped ? [...wallConfig.layers].reverse() : wallConfig.layers;

    // Draw each layer as a simple colored band
    layersToRender.forEach(layer => {
      const layerThickness = layer.thickness * scaleFactor;
      ctx.fillStyle = isSelected ? adjustColor(layer.color, 30) : layer.color;
      ctx.fillRect(0, yOffset, wallLength, layerThickness);
      yOffset += layerThickness;
    });

    // Draw outline
    ctx.strokeStyle = isSelected ? '#00ffaa' : '#888';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, -thickness / 2, wallLength, thickness);

    // Draw layer separators
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 0.5;
    yOffset = -thickness / 2;
    layersToRender.forEach((layer, i) => {
      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(0, yOffset);
        ctx.lineTo(wallLength, yOffset);
        ctx.stroke();
      }
      yOffset += layer.thickness * scaleFactor;
    });

  } else if (wallDetailLevel === 'detailed') {
    // Detailed mode - full construction with patterns and studs
    const totalThickness = wallConfig.layers.reduce((sum, l) => sum + l.thickness, 0);
    const scaleFactor = thickness / totalThickness;
    let yOffset = -thickness / 2;

    // Calculate pattern offset based on wall's global position
    const patternOffset = (wall.start.x + wall.start.y) % 48;

    // If wall is flipped, reverse the layer order
    const layersToRender = wall.flipped ? [...wallConfig.layers].reverse() : wallConfig.layers;

    // Draw each layer with patterns
    layersToRender.forEach(layer => {
      const layerThickness = layer.thickness * scaleFactor;

      ctx.save();
      ctx.translate(0, yOffset);

      // Base fill
      ctx.fillStyle = isSelected ? adjustColor(layer.color, 20) : layer.color;
      ctx.fillRect(0, 0, wallLength, layerThickness);

      // Draw pattern based on layer type
      if (layer.pattern === 'siding') {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 0.5;
        const lineSpacing = Math.max(1.5, layerThickness / 4);
        for (let y = lineSpacing; y < layerThickness; y += lineSpacing) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(wallLength, y);
          ctx.stroke();
        }
      } else if (layer.pattern === 'plywood') {
        ctx.strokeStyle = 'rgba(139,90,43,0.3)';
        ctx.lineWidth = 0.5;
        const plywoodSpacing = 24;
        const startX = -((patternOffset) % plywoodSpacing);
        for (let x = startX; x < wallLength; x += plywoodSpacing) {
          if (x >= 0) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, layerThickness);
            ctx.stroke();
          }
        }
      } else if (layer.pattern === 'insulation') {
        ctx.strokeStyle = 'rgba(255,150,180,0.4)';
        ctx.lineWidth = 1;
        const waveHeight = layerThickness * 0.3;
        const waveSpacing = 8;
        const startX = -((patternOffset) % waveSpacing);
        for (let x = startX; x < wallLength; x += waveSpacing) {
          ctx.beginPath();
          ctx.moveTo(Math.max(0, x), layerThickness / 2 - waveHeight);
          ctx.quadraticCurveTo(x + 4, layerThickness / 2 + waveHeight, x + waveSpacing, layerThickness / 2 - waveHeight);
          ctx.stroke();
        }
      } else if (layer.pattern === 'cavity') {
        ctx.fillStyle = isSelected ? '#3a3a3a' : '#1a1a1a';
        ctx.fillRect(0, 0, wallLength, layerThickness);
      }

      ctx.restore();
      yOffset += layerThickness;
    });

    // Draw studs in detailed mode
    if (wallConfig.studs) {
      const studSpacing = wallConfig.studs.spacing * (GRID_SIZE / 6) / 12 * scaleFactor;
      const studWidth = wallConfig.studs.width * (GRID_SIZE / 6) / 12 * scaleFactor;
      const studDepth = wallConfig.studs.depth * scaleFactor;

      // Find the cavity layer position
      let cavityStart = -thickness / 2;
      let cavityThickness = 0;
      wallConfig.layers.forEach(layer => {
        const layerThick = layer.thickness * scaleFactor;
        if (layer.pattern === 'cavity' || layer.pattern === 'insulation') {
          cavityThickness = layerThick;
        } else if (cavityThickness === 0) {
          cavityStart += layerThick;
        }
      });

      // Draw studs
      ctx.fillStyle = isSelected ? '#E8C888' : wallConfig.studs.color;
      const studStartOffset = (patternOffset % studSpacing);

      // End stud at start
      ctx.fillRect(0, cavityStart, studWidth, cavityThickness);

      // Interior studs
      const firstStudX = studSpacing - studStartOffset;
      for (let x = firstStudX; x < wallLength - studWidth; x += studSpacing) {
        ctx.fillRect(x - studWidth / 2, cavityStart, studWidth, cavityThickness);
      }

      // End stud at end
      ctx.fillRect(wallLength - studWidth, cavityStart, studWidth, cavityThickness);
    }

    // Draw outline
    ctx.strokeStyle = isSelected ? '#00ffaa' : '#555';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, -thickness / 2, wallLength, thickness);
  }

  if (!skipGeometry) {
    ctx.restore();
  }

  // For architectural-labels-only mode, skip to labels and grips
  const isLabelsOnly = wallDetailLevel === 'architectural-labels-only';

  // Measurement label
  const length = distance(wall.start, wall.end);
  const midX = (wall.start.x + wall.end.x) / 2;
  const midY = (wall.start.y + wall.end.y) / 2;

  // Auto-scale font size for mobile when zoomed out
  const minScaleFactor = isMobile ? 1.3 : 1.0;
  const labelScaleFactor = Math.max(minScaleFactor, 1 / scale);
  const labelFontSize = Math.round(10 * labelScaleFactor);

  const isArchitectural = wallDetailLevel === 'architectural' || isLabelsOnly;

  ctx.save();
  ctx.translate(midX, midY);
  ctx.rotate(angle);

  // Background for better readability
  const measureText = `${formatMeasurement(pixelsToFeet(length))} (h:${formatMeasurement(inchesToFeet(wall.height || DEFAULT_WALL_HEIGHT))})`;
  ctx.font = `${labelFontSize}px "SF Mono", monospace`;
  const textWidth = ctx.measureText(measureText).width;

  // Use white background with black text for architectural mode
  ctx.fillStyle = isArchitectural ? 'rgba(255,255,255,0.9)' : 'rgba(8,12,16,0.8)';
  ctx.fillRect(-textWidth / 2 - 4 * labelScaleFactor, -thickness - 4 - labelFontSize, textWidth + 8 * labelScaleFactor, labelFontSize + 4 * labelScaleFactor);

  ctx.fillStyle = isArchitectural ? '#000000' : '#00c8ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(measureText, 0, -thickness - 4);
  ctx.restore();

  // Draw grips for selected wall or when in select mode
  if (showGrips && !isLocked) {
    const gripSize = isSelected ? 10 / scale : 6 / scale;

    // Use different colors for architectural mode
    const gripFill = isSelected ? '#00ffaa' : (isArchitectural ? 'rgba(0,0,0,0.6)' : 'rgba(0,200,255,0.6)');
    const gripStroke = isSelected ? '#fff' : (isArchitectural ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.6)');
    const midGripFill = isSelected ? 'rgba(0,255,170,0.5)' : (isArchitectural ? 'rgba(0,0,0,0.3)' : 'rgba(0,200,255,0.3)');

    // Start grip
    ctx.fillStyle = gripFill;
    ctx.strokeStyle = gripStroke;
    ctx.lineWidth = (isSelected ? 2 : 1) / scale;
    ctx.beginPath();
    ctx.arc(wall.start.x, wall.start.y, gripSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // End grip
    ctx.beginPath();
    ctx.arc(wall.end.x, wall.end.y, gripSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Midpoint grip
    ctx.fillStyle = midGripFill;
    ctx.beginPath();
    ctx.rect(midX - gripSize/2, midY - gripSize/2, gripSize, gripSize);
    ctx.fill();
    ctx.stroke();
  }
}
