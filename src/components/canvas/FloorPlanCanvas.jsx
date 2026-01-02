import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { GRID_SIZE, GRID_OPTIONS, DEFAULT_WALL_HEIGHT } from '../../constants/grid';
import { WALL_THICKNESS_OPTIONS, WALL_LAYERS, WALL_DETAIL_LEVELS } from '../../constants/walls';
import { DOOR_TYPES } from '../../constants/doors';
import { WINDOW_TYPES } from '../../constants/windows';
import { ROOF_TYPES, ROOF_PITCHES } from '../../constants/roofs';
import { LINE_TYPES, DIMENSION_STYLES } from '../../constants/styles';
import { pixelsToFeet, formatMeasurement as formatMeasurementUtil } from '../../utils/measurements';
import { distance, adjustColor } from '../../utils/geometry';
import { drawWall } from './renderers/wallRenderer';
import { drawDoor, drawDoorTemporaryDimensions } from './renderers/doorRenderer';
import { drawWindow, drawWindowTemporaryDimensions } from './renderers/windowRenderer';
import { drawFurniture } from './renderers/furnitureRenderer';
import { drawRoom } from './renderers/roomRenderer';
import { drawRoof } from './renderers/roofRenderer';
import { drawDimension } from './renderers/dimensionRenderer';
import { drawFillet } from './renderers/filletRenderer';
import { drawLine } from './renderers/lineRenderer';
import { drawText } from './renderers/textRenderer';
import { drawGrid } from './renderers/gridRenderer';
import { computeWallTrims, drawArchitecturalWalls } from './renderers/cornerRenderer';

/**
 * FloorPlanCanvas - Main canvas component for rendering the floor plan
 * Handles all drawing, transforms, and interactions
 */
const FloorPlanCanvas = forwardRef(({
  // Floor data
  activeFloor,
  selectedItems = [],

  // Transform state
  scale = 1,
  offset = { x: 100, y: 100 },

  // Tool state
  tool = 'select',
  wallType = 'exterior',
  wallDetailLevel = 'simple',
  thinLines = false,

  // Drawing state
  isDrawing = false,
  drawStart = null,
  drawEnd = null,

  // Move tool state
  moveBasePoint = null,
  movePreviewPoint = null,

  // Rotate tool state
  rotateCenter = null,
  rotateStartAngle = null,
  rotatePreviewAngle = null,

  // Snap guidelines for visual alignment feedback
  snapGuidelines = null,

  // Active snap indicator (endpoint, midpoint, perpendicular, nearest)
  activeSnap = null,

  // UI settings
  units = 'decimal',
  gridSize = '6"',
  showDimensions = true,
  showGrips = true,
  isMobile = false,

  // Layers
  layers = {},

  // Event handlers
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
}, ref) => {
  const internalCanvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Forward the ref to the canvas element
  useImperativeHandle(ref, () => internalCanvasRef.current, []);

  // Format measurement based on units setting
  const formatMeasurement = useCallback((feet) => {
    return formatMeasurementUtil(feet, units);
  }, [units]);

  // Update canvas dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      const canvas = internalCanvasRef.current;
      if (!canvas) return;

      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      setDimensions({ width: rect.width * dpr, height: rect.height * dpr });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Main render effect
  useEffect(() => {
    const canvas = internalCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;

    // Clear canvas
    ctx.fillStyle = '#080c10';
    ctx.fillRect(0, 0, width, height);

    // Apply transforms
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw grid (hidden in architectural mode for clean Revit-like appearance)
    drawGrid(ctx, GRID_SIZE, scale, wallDetailLevel);

    // Draw rooms (if layer visible)
    if (layers.rooms?.visible !== false && activeFloor?.rooms) {
      activeFloor.rooms.forEach(room => {
        const isSelected = selectedItems.some(s => s.type === 'room' && s.item?.id === room.id);
        drawRoom(ctx, room, isSelected, scale, isMobile, formatMeasurement, wallDetailLevel);
      });
    }

    // Draw roofs (if layer visible)
    if (activeFloor?.roofs) {
      activeFloor.roofs.forEach(roof => {
        const isSelected = selectedItems.some(s => s.type === 'roof' && s.item?.id === roof.id);
        drawRoof(ctx, roof, isSelected, formatMeasurement);
      });
    }

    // Draw walls (if layer visible)
    if (layers.walls?.visible !== false && activeFloor?.walls) {
      if (wallDetailLevel === 'architectural') {
        // Architectural mode: pre-compute trim points for clean mitered corners
        const trims = computeWallTrims(activeFloor.walls);
        drawArchitecturalWalls(ctx, activeFloor.walls, trims, selectedItems, thinLines);

        // Still draw labels and grips using the standard wall renderer
        activeFloor.walls.forEach(wall => {
          const isSelected = selectedItems.some(s => s.type === 'wall' && s.item?.id === wall.id);
          // Only draw the labels and grips, not the wall geometry
          drawWall(ctx, wall, {
            isSelected,
            wallDetailLevel: 'architectural-labels-only',
            scale,
            isMobile,
            showGrips: showGrips && (isSelected || tool === 'select'),
            isLocked: layers.walls?.locked,
            formatMeasurement,
          });
        });
      } else {
        // Other modes: use standard wall renderer
        activeFloor.walls.forEach(wall => {
          const isSelected = selectedItems.some(s => s.type === 'wall' && s.item?.id === wall.id);
          drawWall(ctx, wall, {
            isSelected,
            wallDetailLevel,
            scale,
            isMobile,
            showGrips: showGrips && (isSelected || tool === 'select'),
            isLocked: layers.walls?.locked,
            formatMeasurement,
          });
        });
      }
    }

    // Draw fillets (rounded corners)
    if (layers.walls?.visible !== false && activeFloor?.fillets) {
      activeFloor.fillets.forEach(fillet => {
        const isSelected = selectedItems.some(s => s.type === 'fillet' && s.item?.id === fillet.id);
        drawFillet(ctx, fillet, isSelected);
      });
    }

    // Draw doors (if layer visible)
    if (layers.doors?.visible !== false && activeFloor?.doors) {
      activeFloor.doors.forEach(door => {
        const wall = activeFloor.walls?.find(w => w.id === door.wallId);
        if (!wall) return;

        const isSelected = selectedItems.some(s => s.type === 'door' && s.item?.id === door.id);
        drawDoor(ctx, door, wall, isSelected, wallDetailLevel, thinLines);

        // Draw temporary dimensions for selected doors (like Revit)
        if (isSelected) {
          drawDoorTemporaryDimensions(ctx, door, wall, units, wallDetailLevel);
        }
      });
    }

    // Draw windows (if layer visible)
    if (layers.windows?.visible !== false && activeFloor?.windows) {
      activeFloor.windows.forEach(window => {
        const wall = activeFloor.walls?.find(w => w.id === window.wallId);
        if (!wall) return;

        const isSelected = selectedItems.some(s => s.type === 'window' && s.item?.id === window.id);
        drawWindow(ctx, window, wall, isSelected, wallDetailLevel, thinLines);

        // Draw temporary dimensions for selected windows (like Revit)
        if (isSelected) {
          drawWindowTemporaryDimensions(ctx, window, wall, units, wallDetailLevel);
        }
      });
    }

    // Draw furniture (if layer visible)
    if (layers.furniture?.visible !== false && activeFloor?.furniture) {
      activeFloor.furniture.forEach(furniture => {
        const isSelected = selectedItems.some(s => s.type === 'furniture' && s.item?.id === furniture.id);
        drawFurniture(ctx, furniture, isSelected, scale);
      });
    }

    // Draw dimensions (if enabled and layer visible)
    if (showDimensions && layers.dimensions?.visible !== false && activeFloor?.dimensions) {
      activeFloor.dimensions.forEach(dim => {
        const isSelected = selectedItems.some(s => s.type === 'dimension' && s.item?.id === dim.id);
        drawDimension(ctx, dim, isSelected, scale, isMobile, formatMeasurement, wallDetailLevel);
      });
    }

    // Draw annotation lines
    if (layers.annotations?.visible !== false && activeFloor?.lines) {
      activeFloor.lines.forEach(line => {
        const isSelected = selectedItems.some(s => s.type === 'line' && s.item?.id === line.id);
        drawLine(ctx, line, isSelected);
      });
    }

    // Draw text annotations
    if (layers.annotations?.visible !== false && activeFloor?.annotations) {
      activeFloor.annotations.forEach(textAnnotation => {
        const isSelected = selectedItems.some(s => s.type === 'text' && s.item?.id === textAnnotation.id);
        drawText(ctx, textAnnotation, isSelected, scale);
      });
    }

    // Draw snap guidelines when drawing walls
    if (isDrawing && snapGuidelines && snapGuidelines.length > 0) {
      drawSnapGuidelines(ctx, snapGuidelines, drawEnd, dimensions, scale, offset);
    }

    // Draw active snap indicator (both when drawing and when hovering)
    if (activeSnap) {
      drawSnapIndicator(ctx, activeSnap, scale);
    }

    // Draw current drawing preview
    if (isDrawing && drawStart && drawEnd) {
      drawDrawingPreview(ctx, tool, drawStart, drawEnd, wallType, formatMeasurement, dimensions, scale, offset);
    }

    // Draw move tool preview
    if (tool === 'move' && moveBasePoint && movePreviewPoint) {
      drawMovePreview(ctx, moveBasePoint, movePreviewPoint, selectedItems);
    }

    // Draw rotate tool preview
    if (tool === 'rotate' && rotateCenter) {
      drawRotatePreview(ctx, rotateCenter, rotateStartAngle, rotatePreviewAngle, selectedItems, scale);
    }

    ctx.restore();

  }, [
    dimensions, activeFloor, selectedItems, scale, offset, tool, wallType,
    wallDetailLevel, thinLines, isDrawing, drawStart, drawEnd, units, gridSize,
    showDimensions, showGrips, isMobile, layers, formatMeasurement,
    moveBasePoint, movePreviewPoint, rotateCenter, rotateStartAngle, rotatePreviewAngle,
    snapGuidelines, activeSnap
  ]);

  // Handle pointer events
  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    if (onPointerDown) {
      onPointerDown(e);
    }
  }, [onPointerDown]);

  const handlePointerMove = useCallback((e) => {
    if (onPointerMove) {
      onPointerMove(e);
    }
  }, [onPointerMove]);

  const handlePointerUp = useCallback((e) => {
    if (onPointerUp) {
      onPointerUp(e);
    }
  }, [onPointerUp]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (onWheel) {
      onWheel(e);
    }
  }, [onWheel]);

  // Touch event handlers for multi-touch (pinch-to-zoom)
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length >= 2) {
      e.preventDefault();
    }
    if (onPointerDown) {
      onPointerDown(e);
    }
  }, [onPointerDown]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length >= 2) {
      e.preventDefault();
    }
    if (onPointerMove) {
      onPointerMove(e);
    }
  }, [onPointerMove]);

  const handleTouchEnd = useCallback((e) => {
    if (onPointerUp) {
      onPointerUp(e);
    }
  }, [onPointerUp]);

  return (
    <canvas
      ref={internalCanvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        cursor: getCursor(tool),
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onWheel={handleWheel}
    />
  );
});

// Get cursor based on current tool
function getCursor(tool) {
  switch (tool) {
    case 'select': return 'default';
    case 'pan': return 'grab';
    case 'wall':
    case 'door':
    case 'window':
    case 'room':
    case 'roof':
    case 'line':
    case 'dimension':
      return 'crosshair';
    case 'move': return 'move';
    case 'rotate': return 'grab';
    default: return 'default';
  }
}

// Draw snap guidelines (alignment guides)
function drawSnapGuidelines(ctx, guidelines, cursorPos, dimensions, scale, offset) {
  if (!guidelines || guidelines.length === 0 || !cursorPos) return;

  // Calculate visible canvas bounds in world coordinates
  const viewLeft = -offset.x / scale;
  const viewTop = -offset.y / scale;
  const viewRight = (dimensions.width - offset.x) / scale;
  const viewBottom = (dimensions.height - offset.y) / scale;

  // Extend lines beyond visible area
  const extend = 5000;

  guidelines.forEach(guide => {
    // Color based on point type: green for endpoints, yellow for midpoints
    const color = guide.pointType === 'endpoint' ? '#00ff00' : '#ffcc00';
    const alpha = guide.snappedTo ? 0.8 : 0.5;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1 / scale; // Keep line thin regardless of zoom
    ctx.setLineDash([6 / scale, 4 / scale]); // Dashed line

    ctx.beginPath();
    if (guide.type === 'horizontal') {
      // Draw horizontal line across entire visible width
      ctx.moveTo(viewLeft - extend, guide.y);
      ctx.lineTo(viewRight + extend, guide.y);
    } else if (guide.type === 'vertical') {
      // Draw vertical line across entire visible height
      ctx.moveTo(guide.x, viewTop - extend);
      ctx.lineTo(guide.x, viewBottom + extend);
    }
    ctx.stroke();

    // Draw a small indicator at the aligned point
    if (guide.alignedPoint) {
      const indicatorSize = 6 / scale;
      ctx.setLineDash([]);
      ctx.lineWidth = 2 / scale;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 1;

      // Diamond shape at the aligned point
      ctx.beginPath();
      ctx.moveTo(guide.alignedPoint.x, guide.alignedPoint.y - indicatorSize);
      ctx.lineTo(guide.alignedPoint.x + indicatorSize, guide.alignedPoint.y);
      ctx.lineTo(guide.alignedPoint.x, guide.alignedPoint.y + indicatorSize);
      ctx.lineTo(guide.alignedPoint.x - indicatorSize, guide.alignedPoint.y);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  });
}

// Draw snap indicator showing snap type at cursor position
function drawSnapIndicator(ctx, activeSnap, scale) {
  if (!activeSnap || !activeSnap.point) return;

  const { type, point } = activeSnap;

  // Colors and symbols for each snap type
  const snapStyles = {
    endpoint: { color: '#00ff00', symbol: 'square', label: 'Endpoint' },
    midpoint: { color: '#ffcc00', symbol: 'triangle', label: 'Midpoint' },
    perpendicular: { color: '#00ccff', symbol: 'perpendicular', label: 'Perpendicular' },
    nearest: { color: '#ff66ff', symbol: 'x', label: 'Nearest' },
  };

  const style = snapStyles[type] || snapStyles.endpoint;
  const size = 8 / scale;

  ctx.save();
  ctx.strokeStyle = style.color;
  ctx.fillStyle = style.color;
  ctx.lineWidth = 2 / scale;
  ctx.setLineDash([]);

  // Draw the snap symbol
  ctx.beginPath();
  switch (style.symbol) {
    case 'square':
      // Filled square for endpoint
      ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
      break;

    case 'triangle':
      // Triangle pointing up for midpoint
      ctx.moveTo(point.x, point.y - size);
      ctx.lineTo(point.x + size * 0.866, point.y + size / 2);
      ctx.lineTo(point.x - size * 0.866, point.y + size / 2);
      ctx.closePath();
      ctx.fill();
      break;

    case 'perpendicular':
      // Right angle symbol for perpendicular
      ctx.moveTo(point.x - size, point.y);
      ctx.lineTo(point.x, point.y);
      ctx.lineTo(point.x, point.y - size);
      ctx.stroke();
      // Small square in corner
      const cornerSize = size / 3;
      ctx.strokeRect(point.x, point.y - cornerSize, cornerSize, cornerSize);
      break;

    case 'x':
      // X mark for nearest
      ctx.moveTo(point.x - size / 2, point.y - size / 2);
      ctx.lineTo(point.x + size / 2, point.y + size / 2);
      ctx.moveTo(point.x + size / 2, point.y - size / 2);
      ctx.lineTo(point.x - size / 2, point.y + size / 2);
      ctx.stroke();
      break;
  }

  // Draw label below the indicator
  ctx.font = `bold ${10 / scale}px "SF Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Background for label
  const labelY = point.y + size + 4 / scale;
  const textWidth = ctx.measureText(style.label).width;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(point.x - textWidth / 2 - 3 / scale, labelY - 2 / scale, textWidth + 6 / scale, 14 / scale);

  // Label text
  ctx.fillStyle = style.color;
  ctx.fillText(style.label, point.x, labelY);

  ctx.restore();
}

// Draw preview while drawing
function drawDrawingPreview(ctx, tool, start, end, wallType, formatMeasurement, canvasDimensions, scale, offset) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (tool === 'wall') {
    const thickness = WALL_THICKNESS_OPTIONS[wallType]?.thickness || 8;
    const angle = Math.atan2(dy, dx);

    // Draw preview wall
    ctx.save();
    ctx.translate(start.x, start.y);
    ctx.rotate(angle);

    // Glow effect
    ctx.strokeStyle = 'rgba(0,200,255,0.3)';
    ctx.lineWidth = thickness + 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();

    // Wall
    ctx.strokeStyle = wallType?.includes('exterior') ? '#f0f8ff' : '#c0d0e0';
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();

    ctx.restore();

    // Show length - keep dimension visible in viewport
    if (length > 10) {
      // Calculate viewport bounds in canvas coordinates
      const viewLeft = -offset.x / scale;
      const viewTop = -offset.y / scale;
      const viewRight = (canvasDimensions.width / window.devicePixelRatio - offset.x) / scale;
      const viewBottom = (canvasDimensions.height / window.devicePixelRatio - offset.y) / scale;

      // Calculate midpoint
      let labelX = (start.x + end.x) / 2;
      let labelY = (start.y + end.y) / 2;

      // Check if midpoint is outside viewport, if so position near the end point
      const padding = 80; // Padding from edge
      const isOutOfView = labelX < viewLeft + padding || labelX > viewRight - padding ||
                          labelY < viewTop + padding || labelY > viewBottom - padding;

      if (isOutOfView) {
        // Position the label near the cursor (end point) but offset along the wall direction
        // This keeps it visible while drawing long walls
        const labelOffset = 60; // Distance from end point along wall
        const dirX = dx / length;
        const dirY = dy / length;
        labelX = end.x - dirX * labelOffset;
        labelY = end.y - dirY * labelOffset;

        // Clamp to viewport bounds with padding
        labelX = Math.max(viewLeft + padding, Math.min(viewRight - padding, labelX));
        labelY = Math.max(viewTop + padding, Math.min(viewBottom - padding, labelY));
      }

      ctx.save();
      ctx.translate(labelX, labelY);
      ctx.rotate(angle);

      const text = formatMeasurement(pixelsToFeet(length));
      ctx.font = 'bold 12px "SF Mono", monospace';
      const textWidth = ctx.measureText(text).width;

      ctx.fillStyle = 'rgba(8,12,16,0.9)';
      ctx.fillRect(-textWidth/2 - 6, -thickness - 20, textWidth + 12, 18);

      ctx.fillStyle = '#00c8ff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, -thickness - 11);

      ctx.restore();
    }
  } else if (tool === 'room') {
    // Draw preview room rectangle
    ctx.strokeStyle = 'rgba(0,200,255,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      Math.min(start.x, end.x),
      Math.min(start.y, end.y),
      Math.abs(dx),
      Math.abs(dy)
    );
    ctx.setLineDash([]);

    // Show dimensions
    ctx.fillStyle = '#00c8ff';
    ctx.font = '12px "SF Mono", monospace';
    ctx.textAlign = 'center';
    const widthFt = pixelsToFeet(Math.abs(dx));
    const heightFt = pixelsToFeet(Math.abs(dy));
    ctx.fillText(
      `${formatMeasurement(widthFt)} × ${formatMeasurement(heightFt)}`,
      (start.x + end.x) / 2,
      (start.y + end.y) / 2
    );
  } else if (tool === 'roof') {
    // Draw preview roof rectangle
    ctx.strokeStyle = 'rgba(139,90,43,0.5)';
    ctx.fillStyle = 'rgba(139,90,43,0.1)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.fillRect(
      Math.min(start.x, end.x),
      Math.min(start.y, end.y),
      Math.abs(dx),
      Math.abs(dy)
    );
    ctx.strokeRect(
      Math.min(start.x, end.x),
      Math.min(start.y, end.y),
      Math.abs(dx),
      Math.abs(dy)
    );
    ctx.setLineDash([]);
  }
}

// Draw move tool preview
function drawMovePreview(ctx, basePoint, previewPoint, selectedItems) {
  // Draw base point marker
  ctx.fillStyle = '#00ff88';
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;

  // Base point - crosshair
  ctx.beginPath();
  ctx.moveTo(basePoint.x - 10, basePoint.y);
  ctx.lineTo(basePoint.x + 10, basePoint.y);
  ctx.moveTo(basePoint.x, basePoint.y - 10);
  ctx.lineTo(basePoint.x, basePoint.y + 10);
  ctx.stroke();

  // Draw preview point marker
  ctx.fillStyle = '#00c8ff';
  ctx.strokeStyle = '#00c8ff';

  ctx.beginPath();
  ctx.moveTo(previewPoint.x - 10, previewPoint.y);
  ctx.lineTo(previewPoint.x + 10, previewPoint.y);
  ctx.moveTo(previewPoint.x, previewPoint.y - 10);
  ctx.lineTo(previewPoint.x, previewPoint.y + 10);
  ctx.stroke();

  // Draw line from base to preview
  ctx.strokeStyle = 'rgba(0,200,255,0.5)';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(basePoint.x, basePoint.y);
  ctx.lineTo(previewPoint.x, previewPoint.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw delta distance
  const dx = previewPoint.x - basePoint.x;
  const dy = previewPoint.y - basePoint.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 10) {
    const midX = (basePoint.x + previewPoint.x) / 2;
    const midY = (basePoint.y + previewPoint.y) / 2;

    ctx.font = 'bold 11px "SF Mono", monospace';
    ctx.fillStyle = '#00c8ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Δ ${(dist / 8).toFixed(1)}"`, midX, midY - 5);
  }
}

// Draw rotate tool preview
function drawRotatePreview(ctx, center, startAngle, previewAngle, selectedItems, scale) {
  // Draw center point
  ctx.fillStyle = '#ff8800';
  ctx.strokeStyle = '#ff8800';
  ctx.lineWidth = 2;

  // Center crosshair
  ctx.beginPath();
  ctx.arc(center.x, center.y, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(center.x - 15, center.y);
  ctx.lineTo(center.x + 15, center.y);
  ctx.moveTo(center.x, center.y - 15);
  ctx.lineTo(center.x, center.y + 15);
  ctx.stroke();

  // Draw angle arc if we have start angle
  if (startAngle !== null && previewAngle !== null) {
    const radius = 50;
    const angleDelta = previewAngle - startAngle;

    // Draw reference line (start angle)
    ctx.strokeStyle = 'rgba(255,136,0,0.5)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(
      center.x + Math.cos(startAngle) * radius * 1.5,
      center.y + Math.sin(startAngle) * radius * 1.5
    );
    ctx.stroke();

    // Draw current angle line
    ctx.strokeStyle = '#00c8ff';
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(
      center.x + Math.cos(previewAngle) * radius * 1.5,
      center.y + Math.sin(previewAngle) * radius * 1.5
    );
    ctx.stroke();

    // Draw arc showing rotation
    ctx.strokeStyle = 'rgba(0,200,255,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, startAngle, previewAngle, angleDelta < 0);
    ctx.stroke();

    // Draw angle text
    const angleDegrees = (angleDelta * 180 / Math.PI).toFixed(1);
    const textAngle = (startAngle + previewAngle) / 2;
    const textX = center.x + Math.cos(textAngle) * (radius + 20);
    const textY = center.y + Math.sin(textAngle) * (radius + 20);

    ctx.font = 'bold 12px "SF Mono", monospace';
    ctx.fillStyle = '#00c8ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${angleDegrees}°`, textX, textY);
  }
}

export default FloorPlanCanvas;
