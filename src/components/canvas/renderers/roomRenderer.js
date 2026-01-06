/**
 * Room Renderer - Draws room labels and boundaries
 * Supports both polygon-based rooms (points array) and legacy rectangle rooms (x, y, width, height)
 */

import { GRID_SIZE } from '../../../constants/grid';

/**
 * Calculate area of a polygon using the Shoelace formula
 */
function calculatePolygonArea(points) {
  if (!points || points.length < 3) return 0;

  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  return Math.abs(area / 2);
}

/**
 * Calculate centroid of a polygon
 */
function calculateCentroid(points) {
  if (!points || points.length === 0) return { x: 0, y: 0 };

  let cx = 0, cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  return { x: cx / points.length, y: cy / points.length };
}

/**
 * Calculate bounding box of points
 */
function getBoundingBox(points) {
  if (!points || points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };

  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function drawRoom(ctx, room, isSelected = false, scale = 1, isMobile = false, formatMeasurement = (v) => `${v}'`, wallDetailLevel = 'simple', selectedVertexIndex = null) {
  const isArchitectural = wallDetailLevel === 'architectural';

  // Check if this is a polygon-based room (has points) or legacy rectangle room
  if (room.points && room.points.length >= 3) {
    drawPolygonRoom(ctx, room, isSelected, scale, isMobile, formatMeasurement, wallDetailLevel, selectedVertexIndex);
  } else if (room.x !== undefined && room.y !== undefined && room.width !== undefined && room.height !== undefined) {
    drawRectangleRoom(ctx, room, isSelected, scale, isMobile, formatMeasurement, wallDetailLevel);
  }
}

/**
 * Draw a polygon-based room
 */
function drawPolygonRoom(ctx, room, isSelected, scale, isMobile, formatMeasurement, wallDetailLevel, selectedVertexIndex) {
  const { points, name, color } = room;
  const isArchitectural = wallDetailLevel === 'architectural';

  ctx.save();

  // Fill the room polygon
  if (!isArchitectural) {
    ctx.fillStyle = color || 'rgba(100, 200, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Draw border
  if (!isArchitectural) {
    ctx.strokeStyle = isSelected ? '#00ffaa' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = isSelected ? 2 / scale : 1 / scale;
    ctx.setLineDash(isSelected ? [] : [5, 5]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Calculate centroid and area for labels
  const centroid = calculateCentroid(points);
  const areaPixels = calculatePolygonArea(points);
  const areaSqFt = areaPixels / (GRID_SIZE * GRID_SIZE) / 4; // Convert to square feet

  // Get bounding box for dimension display
  const bbox = getBoundingBox(points);
  const widthFt = (bbox.width / GRID_SIZE / 2).toFixed(1);
  const heightFt = (bbox.height / GRID_SIZE / 2).toFixed(1);

  // Auto-scale room labels for mobile readability
  const roomLabelScale = Math.max(isMobile ? 1.3 : 1.0, 1 / scale);
  const nameFontSize = Math.round(14 * roomLabelScale);
  const dimFontSize = Math.round(11 * roomLabelScale);
  const areaFontSize = Math.round(10 * roomLabelScale);

  // Room name
  ctx.fillStyle = isArchitectural ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';
  ctx.font = `600 ${nameFontSize}px "Inter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name || 'Room', centroid.x, centroid.y - 12 * roomLabelScale);

  // Area display
  ctx.font = `${areaFontSize}px "SF Mono", monospace`;
  ctx.fillStyle = isArchitectural ? 'rgba(0,0,0,0.6)' : 'rgba(0,200,255,0.9)';
  ctx.fillText(`${areaSqFt.toFixed(1)} sq ft`, centroid.x, centroid.y + 6 * roomLabelScale);

  // Note: Selection vertices are drawn separately via drawRoomVertices() to ensure they appear on top of walls

  ctx.restore();
}

/**
 * Draw a legacy rectangle-based room
 */
function drawRectangleRoom(ctx, room, isSelected, scale, isMobile, formatMeasurement, wallDetailLevel) {
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

/**
 * Draw room vertices/grips on top of other elements
 * Called separately from drawRoom to ensure vertices appear above walls
 */
export function drawRoomVertices(ctx, room, isSelected = false, scale = 1, wallDetailLevel = 'simple', selectedVertexIndex = null) {
  if (!isSelected) return;

  const isArchitectural = wallDetailLevel === 'architectural';

  // Handle polygon-based rooms
  if (room.points && room.points.length >= 3) {
    ctx.save();
    room.points.forEach((point, index) => {
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
        ctx.fillStyle = isArchitectural ? '#000000' : '#00ffaa';
        ctx.fill();
      }
    });
    ctx.restore();
  }
  // Legacy rectangle rooms already have handles drawn in drawRectangleRoom
}

/**
 * Draw room preview while drawing (shows accumulated points + current mouse position)
 */
export function drawRoomPreview(ctx, points, currentEnd, isClosing = false) {
  if (!points || points.length === 0) return;

  ctx.save();

  // Draw filled preview if we have enough points
  if (points.length >= 2) {
    ctx.fillStyle = 'rgba(100, 200, 255, 0.15)';
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
  ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
  ctx.lineWidth = 2;
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
  ctx.fillStyle = '#00c8ff';
  points.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, index === 0 ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Highlight first point if we're close to closing
  if (isClosing && points.length >= 3) {
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}
