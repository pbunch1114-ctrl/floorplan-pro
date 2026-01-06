import { useState, useCallback, useRef, useEffect } from 'react';
import { GRID_SIZE, GRID_OPTIONS } from '../constants/grid';
import { WALL_THICKNESS_OPTIONS } from '../constants/walls';
import { distance, closestPointOnLine } from '../utils/geometry';
import { snapToGrid, snapToGridSize, generateId, pixelsToFeet } from '../utils/measurements';

// Helper to get points array from roof (handles legacy format)
function getRoofPoints(roof) {
  if (roof.points && roof.points.length >= 3) {
    return roof.points;
  }
  // Legacy format - convert x, y, width, height to points
  const { x, y, width, height } = roof;
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
}

// Helper to check if point is inside polygon (ray casting algorithm)
function isPointInPolygon(point, polygon) {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Helper to get bounding box from points
function getRoofBoundingBox(points) {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

/**
 * useCanvasInteraction - Hook for handling canvas interactions
 * Manages drawing, selection, and tool operations
 */
export const useCanvasInteraction = ({
  activeFloor,
  updateActiveFloor,
  selectedItems,
  setSelectedItems,
  setSelectionSource,
  canvasRef,
  scale = 1,
  setScale,
  offset = { x: 100, y: 100 },
  setOffset,
  tool = 'select',
  wallType = 'exterior',
  gridSize = '6"',
  angleSnap = '45',
  isMobile = false,
  layers = {},
  // Snap settings - which snap types are enabled
  snaps = {
    endpoint: true,
    midpoint: true,
    perpendicular: true,
    nearest: true,
    grid: true,
  },
}) => {
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [drawEnd, setDrawEnd] = useState(null);
  const [polarAngle, setPolarAngle] = useState(null); // Current snapped polar angle for display
  const [startingLineAngle, setStartingLineAngle] = useState(null); // Angle of line we started from (for perpendicular)

  // Polyline drawing state - accumulates points as user clicks
  const [polylinePoints, setPolylinePoints] = useState([]);

  // Hatch drawing state - accumulates points for polygon boundary
  const [hatchPoints, setHatchPoints] = useState([]);

  // Room drawing state - accumulates points for room boundary polygon
  const [roomPoints, setRoomPoints] = useState([]);

  // Panning state
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Drag state
  const [dragItem, setDragItem] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragOriginalPositions, setDragOriginalPositions] = useState(null); // For alignment guidelines

  // Grip editing state
  const [activeGrip, setActiveGrip] = useState(null);
  const [gripCursorPosition, setGripCursorPosition] = useState(null); // For displaying grip guidelines

  // Touch state for pinch-to-zoom
  const [pinchStart, setPinchStart] = useState(null);

  // Move tool state
  const [moveBasePoint, setMoveBasePoint] = useState(null);
  const [movePreviewPoint, setMovePreviewPoint] = useState(null);

  // Rotate tool state
  const [rotateCenter, setRotateCenter] = useState(null);
  const [rotateStartAngle, setRotateStartAngle] = useState(null);
  const [rotatePreviewAngle, setRotatePreviewAngle] = useState(null);

  // Snap guidelines state - tracks active alignment guides
  const [snapGuidelines, setSnapGuidelines] = useState(null);

  // Active snap indicator - shows what type of snap is active
  // { type: 'endpoint'|'midpoint'|'perpendicular'|'nearest', point: {x, y}, wall?: wall }
  const [activeSnap, setActiveSnap] = useState(null);

  // Get current grid size
  const currentGridSize = GRID_OPTIONS[gridSize]?.size || GRID_SIZE;

  // Snap value to grid
  const snap = useCallback((value) => {
    if (gridSize === 'off') return value;
    return snapToGridSize(value, currentGridSize);
  }, [gridSize, currentGridSize]);

  // Convert screen position to canvas position
  const screenToCanvas = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!rect || !canvas) return { x: clientX, y: clientY };

    // Get position relative to canvas element (in CSS pixels)
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    // Convert to world coordinates by reversing the transform:
    // Rendering does: ctx.scale(dpr) -> ctx.translate(offset) -> ctx.scale(scale)
    // So: worldX = (screenX - offset.x) / scale
    const x = (canvasX - offset.x) / scale;
    const y = (canvasY - offset.y) / scale;

    return { x, y };
  }, [canvasRef, scale, offset]);

  // Get pointer position from event
  const getPointerPos = useCallback((e) => {
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    return screenToCanvas(clientX, clientY);
  }, [screenToCanvas]);

  // Snap angle for wall/line drawing - returns { point, angle, isSnapped }
  const snapAngle = useCallback((start, end, baseAngle = null) => {
    if (angleSnap === 'off' && baseAngle === null) return { point: end, angle: null, isSnapped: false };

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 5) return { point: end, angle: null, isSnapped: false };

    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const snapDegrees = parseInt(angleSnap) || 45;

    let snappedAngle;
    if (baseAngle !== null) {
      // Snap relative to base angle (for perpendicular from existing line)
      // Snap to baseAngle, baseAngle+90, baseAngle+180, baseAngle+270
      const relativeAngles = [0, 90, 180, 270, -90, -180, -270].map(a => baseAngle + a);
      let minDiff = Infinity;
      snappedAngle = angle;
      relativeAngles.forEach(ra => {
        // Normalize angles for comparison
        let diff = Math.abs(((angle - ra + 180) % 360) - 180);
        if (diff < minDiff && diff < 15) { // 15 degree tolerance for perpendicular snap
          minDiff = diff;
          snappedAngle = ra;
        }
      });
      if (minDiff === Infinity) {
        // No perpendicular snap, fall back to regular angle snap
        if (angleSnap !== 'off') {
          snappedAngle = Math.round(angle / snapDegrees) * snapDegrees;
        } else {
          return { point: end, angle: angle, isSnapped: false };
        }
      }
    } else {
      snappedAngle = Math.round(angle / snapDegrees) * snapDegrees;
    }

    const snappedRad = snappedAngle * Math.PI / 180;

    return {
      point: {
        x: start.x + Math.cos(snappedRad) * length,
        y: start.y + Math.sin(snappedRad) * length,
      },
      angle: snappedAngle,
      isSnapped: true
    };
  }, [angleSnap]);

  // Detect if starting from an existing wall or line endpoint - returns the angle of that line
  const detectStartingLineAngle = useCallback((startPos, floor) => {
    if (!floor) return null;
    const SNAP_DIST = 15;

    // Check walls
    for (const wall of floor.walls || []) {
      const dStart = distance(startPos, wall.start);
      const dEnd = distance(startPos, wall.end);
      if (dStart < SNAP_DIST || dEnd < SNAP_DIST) {
        // Return the angle of this wall
        return Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * 180 / Math.PI;
      }
    }

    // Check annotation lines
    for (const line of floor.lines || []) {
      if (!line.start || !line.end) continue;
      const dStart = distance(startPos, line.start);
      const dEnd = distance(startPos, line.end);
      if (dStart < SNAP_DIST || dEnd < SNAP_DIST) {
        return Math.atan2(line.end.y - line.start.y, line.end.x - line.start.x) * 180 / Math.PI;
      }
    }

    // Check polylines
    for (const polyline of floor.polylines || []) {
      if (!polyline.points || polyline.points.length < 2) continue;
      for (let i = 0; i < polyline.points.length; i++) {
        const pt = polyline.points[i];
        if (distance(startPos, pt) < SNAP_DIST) {
          // Return angle of adjacent segment
          if (i > 0) {
            const prev = polyline.points[i - 1];
            return Math.atan2(pt.y - prev.y, pt.x - prev.x) * 180 / Math.PI;
          } else if (i < polyline.points.length - 1) {
            const next = polyline.points[i + 1];
            return Math.atan2(next.y - pt.y, next.x - pt.x) * 180 / Math.PI;
          }
        }
      }
    }

    return null;
  }, []);

  // Find item at position
  const findItemAt = useCallback((pos) => {
    if (!activeFloor) return null;

    // Check furniture
    if (layers.furniture?.visible !== false && !layers.furniture?.locked) {
      for (const furniture of activeFloor.furniture || []) {
        const pxWidth = furniture.width * (GRID_SIZE / 6);
        const pxHeight = furniture.height * (GRID_SIZE / 6);
        const halfW = pxWidth / 2;
        const halfH = pxHeight / 2;

        if (pos.x >= furniture.x - halfW && pos.x <= furniture.x + halfW &&
            pos.y >= furniture.y - halfH && pos.y <= furniture.y + halfH) {
          return { type: 'furniture', item: furniture };
        }
      }
    }

    // Check doors
    if (layers.doors?.visible !== false && !layers.doors?.locked) {
      for (const door of activeFloor.doors || []) {
        const wall = activeFloor.walls?.find(w => w.id === door.wallId);
        if (!wall) continue;

        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const doorPos = {
          x: wall.start.x + dx * door.position,
          y: wall.start.y + dy * door.position
        };

        if (distance(pos, doorPos) < (door.width || 36) / 2 + 10) {
          return { type: 'door', item: door };
        }
      }
    }

    // Check windows
    if (layers.windows?.visible !== false && !layers.windows?.locked) {
      for (const window of activeFloor.windows || []) {
        const wall = activeFloor.walls?.find(w => w.id === window.wallId);
        if (!wall) continue;

        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const winPos = {
          x: wall.start.x + dx * window.position,
          y: wall.start.y + dy * window.position
        };

        if (distance(pos, winPos) < (window.width || 48) / 2 + 10) {
          return { type: 'window', item: window };
        }
      }
    }

    // Check walls
    if (layers.walls?.visible !== false && !layers.walls?.locked) {
      for (const wall of activeFloor.walls || []) {
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length < 0.001) continue;

        const t = ((pos.x - wall.start.x) * dx + (pos.y - wall.start.y) * dy) / (length * length);
        if (t < 0 || t > 1) continue;

        const closest = { x: wall.start.x + t * dx, y: wall.start.y + t * dy };
        const thickness = WALL_THICKNESS_OPTIONS[wall.type]?.thickness || 8;

        if (distance(pos, closest) < thickness + 5) {
          return { type: 'wall', item: wall };
        }
      }
    }

    // Check rooms (both polygon-based and legacy rectangle)
    if (layers.rooms?.visible !== false && !layers.rooms?.locked) {
      for (const room of activeFloor.rooms || []) {
        if (room.points && room.points.length >= 3) {
          // Polygon-based room - check if point is inside
          if (isPointInPolygon(pos, room.points)) {
            return { type: 'room', item: room };
          }
        } else if (room.x !== undefined && room.width !== undefined) {
          // Legacy rectangle room
          if (pos.x >= room.x && pos.x <= room.x + room.width &&
              pos.y >= room.y && pos.y <= room.y + room.height) {
            return { type: 'room', item: room };
          }
        }
      }
    }

    // Check roofs (using points-based polygon)
    if (layers.roofs?.visible !== false && !layers.roofs?.locked) {
      for (const roof of activeFloor.roofs || []) {
        const points = getRoofPoints(roof);
        if (isPointInPolygon(pos, points)) {
          return { type: 'roof', item: roof };
        }
      }
    }

    // Check dimensions
    if (layers.dimensions?.visible !== false && !layers.dimensions?.locked) {
      for (const dim of activeFloor.dimensions || []) {
        // Check if click is near the dimension line
        const dx = dim.end.x - dim.start.x;
        const dy = dim.end.y - dim.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length < 0.001) continue;

        // Calculate offset position for the dimension line
        const angle = Math.atan2(dy, dx);
        const perpX = -Math.sin(angle) * (dim.offset || 0);
        const perpY = Math.cos(angle) * (dim.offset || 0);
        const offsetStart = { x: dim.start.x + perpX, y: dim.start.y + perpY };
        const offsetEnd = { x: dim.end.x + perpX, y: dim.end.y + perpY };

        // Check distance to dimension line
        const t = ((pos.x - offsetStart.x) * dx + (pos.y - offsetStart.y) * dy) / (length * length);
        if (t >= -0.1 && t <= 1.1) { // Allow some tolerance beyond endpoints
          const closest = { x: offsetStart.x + t * dx, y: offsetStart.y + t * dy };
          if (distance(pos, closest) < 15) {
            return { type: 'dimension', item: dim };
          }
        }

        // Also check if click is near endpoints
        if (distance(pos, offsetStart) < 15 || distance(pos, offsetEnd) < 15) {
          return { type: 'dimension', item: dim };
        }
      }
    }

    // Check annotation lines
    if (layers.lines?.visible !== false && !layers.lines?.locked) {
      for (const line of activeFloor.lines || []) {
        const dx = line.end.x - line.start.x;
        const dy = line.end.y - line.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length < 0.001) continue;

        const t = ((pos.x - line.start.x) * dx + (pos.y - line.start.y) * dy) / (length * length);
        if (t >= 0 && t <= 1) {
          const closest = { x: line.start.x + t * dx, y: line.start.y + t * dy };
          if (distance(pos, closest) < 10) {
            return { type: 'line', item: line };
          }
        }
      }
    }

    // Check polylines
    if (layers.lines?.visible !== false && !layers.lines?.locked) {
      for (const polyline of activeFloor.polylines || []) {
        if (!polyline.points || polyline.points.length < 2) continue;

        // Check each segment of the polyline
        for (let i = 0; i < polyline.points.length - 1; i++) {
          const p1 = polyline.points[i];
          const p2 = polyline.points[i + 1];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const segLen = Math.sqrt(dx * dx + dy * dy);
          if (segLen < 0.001) continue;

          const t = ((pos.x - p1.x) * dx + (pos.y - p1.y) * dy) / (segLen * segLen);
          if (t >= 0 && t <= 1) {
            const closest = { x: p1.x + t * dx, y: p1.y + t * dy };
            if (distance(pos, closest) < 10) {
              return { type: 'polyline', item: polyline };
            }
          }
        }

        // Also check vertices
        for (const pt of polyline.points) {
          if (distance(pos, pt) < 8) {
            return { type: 'polyline', item: polyline };
          }
        }
      }
    }

    // Check text annotations
    if (layers.text?.visible !== false && !layers.text?.locked) {
      for (const text of activeFloor.texts || []) {
        // Estimate text bounding box based on font size and text length
        const fontSize = text.fontSize || 14;
        const textWidth = (text.text?.length || 4) * fontSize * 0.6; // Approximate character width
        const textHeight = fontSize * 1.5;
        const halfW = textWidth / 2 + 10; // Add padding for easier selection
        const halfH = textHeight / 2 + 5;

        if (pos.x >= text.position.x - halfW && pos.x <= text.position.x + halfW &&
            pos.y >= text.position.y - halfH && pos.y <= text.position.y + halfH) {
          return { type: 'text', item: text };
        }
      }
    }

    // Check hatches - use point-in-polygon test
    if (layers.hatches?.visible !== false && !layers.hatches?.locked) {
      for (const hatch of activeFloor.hatches || []) {
        if (!hatch.points || hatch.points.length < 3) continue;
        if (isPointInPolygon(pos, hatch.points)) {
          return { type: 'hatch', item: hatch };
        }
        // Also check boundary edges
        for (let i = 0; i < hatch.points.length; i++) {
          const p1 = hatch.points[i];
          const p2 = hatch.points[(i + 1) % hatch.points.length];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const segLen = Math.sqrt(dx * dx + dy * dy);
          if (segLen < 0.001) continue;
          const t = ((pos.x - p1.x) * dx + (pos.y - p1.y) * dy) / (segLen * segLen);
          if (t >= 0 && t <= 1) {
            const closest = { x: p1.x + t * dx, y: p1.y + t * dy };
            if (distance(pos, closest) < 10) {
              return { type: 'hatch', item: hatch };
            }
          }
        }
      }
    }

    return null;
  }, [activeFloor, layers]);

  // Find a closed polyline at position (for converting to hatch)
  const findClosedPolylineAt = useCallback((pos) => {
    if (!activeFloor?.polylines) return null;

    for (const polyline of activeFloor.polylines) {
      // Must be closed and have at least 3 points
      if (!polyline.closed || !polyline.points || polyline.points.length < 3) continue;

      // Check if point is inside the polygon
      if (isPointInPolygon(pos, polyline.points)) {
        return polyline;
      }

      // Also check if clicking near an edge
      for (let i = 0; i < polyline.points.length; i++) {
        const p1 = polyline.points[i];
        const p2 = polyline.points[(i + 1) % polyline.points.length];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const segLen = Math.sqrt(dx * dx + dy * dy);
        if (segLen < 0.001) continue;

        const t = ((pos.x - p1.x) * dx + (pos.y - p1.y) * dy) / (segLen * segLen);
        if (t >= 0 && t <= 1) {
          const closest = { x: p1.x + t * dx, y: p1.y + t * dy };
          if (distance(pos, closest) < 15) {
            return polyline;
          }
        }
      }
    }
    return null;
  }, [activeFloor]);

  // Find nearest wall to position (for door/window placement)
  const findNearestWall = useCallback((pos) => {
    if (!activeFloor?.walls) return null;

    let nearest = null;
    let minDist = 30; // Max distance to wall

    for (const wall of activeFloor.walls) {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length < 0.001) continue;

      const t = ((pos.x - wall.start.x) * dx + (pos.y - wall.start.y) * dy) / (length * length);
      if (t < 0.05 || t > 0.95) continue; // Not too close to ends

      const closest = { x: wall.start.x + t * dx, y: wall.start.y + t * dy };
      const dist = distance(pos, closest);

      if (dist < minDist) {
        minDist = dist;
        nearest = { wall, position: t };
      }
    }

    return nearest;
  }, [activeFloor]);

  // Move selected items by delta
  const moveSelectedItems = useCallback((deltaX, deltaY) => {
    if (!selectedItems.length) return;

    selectedItems.forEach(({ type, item }) => {
      if (type === 'wall') {
        updateActiveFloor(f => ({
          ...f,
          walls: f.walls.map(w => w.id === item.id ? {
            ...w,
            start: { x: w.start.x + deltaX, y: w.start.y + deltaY },
            end: { x: w.end.x + deltaX, y: w.end.y + deltaY },
          } : w),
          // Also move doors/windows on this wall
          doors: f.doors.map(d => d.wallId === item.id ? d : d),
          windows: f.windows.map(w => w.wallId === item.id ? w : w),
        }));
      } else if (type === 'furniture') {
        updateActiveFloor(f => ({
          ...f,
          furniture: f.furniture.map(furn =>
            furn.id === item.id ? { ...furn, x: furn.x + deltaX, y: furn.y + deltaY } : furn
          ),
        }));
      } else if (type === 'room') {
        updateActiveFloor(f => ({
          ...f,
          rooms: (f.rooms || []).map(r => {
            if (r.id !== item.id) return r;
            // Handle both polygon-based rooms (points array) and legacy rectangle rooms
            if (r.points) {
              return {
                ...r,
                points: r.points.map(pt => ({
                  x: pt.x + deltaX,
                  y: pt.y + deltaY,
                })),
              };
            } else {
              return { ...r, x: r.x + deltaX, y: r.y + deltaY };
            }
          }),
        }));
      } else if (type === 'roof') {
        updateActiveFloor(f => ({
          ...f,
          roofs: (f.roofs || []).map(r => {
            if (r.id !== item.id) return r;
            // Move all points by delta
            const pts = getRoofPoints(r);
            const newPoints = pts.map(pt => ({
              x: pt.x + deltaX,
              y: pt.y + deltaY,
            }));
            return { ...r, points: newPoints };
          }),
        }));
      } else if (type === 'text') {
        updateActiveFloor(f => ({
          ...f,
          texts: (f.texts || []).map(t =>
            t.id === item.id ? { ...t, position: { x: t.position.x + deltaX, y: t.position.y + deltaY } } : t
          ),
        }));
      }
      // Note: dimensions and lines use grip editing, not move tool
    });
  }, [selectedItems, updateActiveFloor]);

  // Rotate selected items around a center point
  const rotateSelectedItems = useCallback((centerX, centerY, angleDelta) => {
    if (!selectedItems.length) return;

    const cos = Math.cos(angleDelta);
    const sin = Math.sin(angleDelta);

    const rotatePoint = (x, y) => {
      const dx = x - centerX;
      const dy = y - centerY;
      return {
        x: centerX + dx * cos - dy * sin,
        y: centerY + dx * sin + dy * cos,
      };
    };

    selectedItems.forEach(({ type, item }) => {
      if (type === 'wall') {
        const newStart = rotatePoint(item.start.x, item.start.y);
        const newEnd = rotatePoint(item.end.x, item.end.y);
        updateActiveFloor(f => ({
          ...f,
          walls: f.walls.map(w => w.id === item.id ? {
            ...w,
            start: { x: snap(newStart.x), y: snap(newStart.y) },
            end: { x: snap(newEnd.x), y: snap(newEnd.y) },
          } : w),
        }));
      } else if (type === 'furniture') {
        const newPos = rotatePoint(item.x, item.y);
        const currentRotation = item.rotation || 0;
        updateActiveFloor(f => ({
          ...f,
          furniture: f.furniture.map(furn =>
            furn.id === item.id ? {
              ...furn,
              x: snap(newPos.x),
              y: snap(newPos.y),
              rotation: currentRotation + (angleDelta * 180 / Math.PI),
            } : furn
          ),
        }));
      } else if (type === 'room') {
        updateActiveFloor(f => ({
          ...f,
          rooms: (f.rooms || []).map(r => {
            if (r.id !== item.id) return r;
            // Handle both polygon-based rooms (points array) and legacy rectangle rooms
            if (r.points) {
              const newPoints = r.points.map(pt => {
                const rotated = rotatePoint(pt.x, pt.y);
                return { x: snap(rotated.x), y: snap(rotated.y) };
              });
              return { ...r, points: newPoints };
            } else {
              const newPos = rotatePoint(item.x + item.width / 2, item.y + item.height / 2);
              return {
                ...r,
                x: snap(newPos.x - item.width / 2),
                y: snap(newPos.y - item.height / 2),
              };
            }
          }),
        }));
      } else if (type === 'roof') {
        updateActiveFloor(f => ({
          ...f,
          roofs: (f.roofs || []).map(r => {
            if (r.id !== item.id) return r;
            // Rotate all points around the center
            const pts = getRoofPoints(r);
            const newPoints = pts.map(pt => {
              const rotated = rotatePoint(pt.x, pt.y);
              return { x: snap(rotated.x), y: snap(rotated.y) };
            });
            return { ...r, points: newPoints };
          }),
        }));
      }
    });
  }, [selectedItems, updateActiveFloor, snap]);

  // Handle pointer down
  const handlePointerDown = useCallback((e) => {
    e.preventDefault();

    // Handle two-finger gestures for pinch-to-zoom and pan
    if (e.touches?.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      // Store initial pinch state for proportional zoom
      setPinchStart({
        dist,
        scale,
        centerX,
        centerY,
        offsetX: offset.x,
        offsetY: offset.y,
      });
      setIsPanning(true);
      panStartRef.current = { x: centerX, y: centerY };
      return;
    }

    const pos = getPointerPos(e);
    const snappedPos = { x: snap(pos.x), y: snap(pos.y) };

    if (tool === 'pan') {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX || e.touches?.[0]?.clientX, y: e.clientY || e.touches?.[0]?.clientY };
    } else if (tool === 'wall') {
      setIsDrawing(true);
      setDrawStart(snappedPos);
      setDrawEnd(snappedPos);
      // Detect if starting from an existing wall/line to enable perpendicular snap
      const lineAngle = detectStartingLineAngle(snappedPos, activeFloor);
      setStartingLineAngle(lineAngle);
    } else if (tool === 'room') {
      // Room tool - click to add boundary points, close to first point to finish
      // Check if clicking near the first point to close the room
      if (roomPoints.length >= 3) {
        const distToFirst = distance(snappedPos, roomPoints[0]);
        if (distToFirst < (isMobile ? 30 : 15)) {
          // Close the room
          const newRoom = {
            id: generateId(),
            points: [...roomPoints],
            name: 'Room',
            color: 'rgba(100, 200, 255, 0.15)',
          };
          updateActiveFloor(f => ({ ...f, rooms: [...(f.rooms || []), newRoom] }));
          setSelectedItems([{ type: 'room', item: newRoom }]);
          setSelectionSource?.('draw');
          setRoomPoints([]);
          setIsDrawing(false);
          setDrawEnd(null);
          setSnapGuidelines(null);
          setActiveSnap(null);
          return;
        }
      }

      // Add point to room boundary
      if (roomPoints.length === 0) {
        // First point - start new room
        setRoomPoints([snappedPos]);
        setIsDrawing(true);
        setDrawEnd(snappedPos);
      } else {
        // Add another point to the room boundary
        setRoomPoints(prev => [...prev, snappedPos]);
      }
    } else if (tool === 'roof') {
      setIsDrawing(true);
      setDrawStart(snappedPos);
      setDrawEnd(snappedPos);
    } else if (tool === 'door' || tool === 'window') {
      const nearest = findNearestWall(pos);
      if (nearest) {
        // Store dimensions in inches (matching wall thickness units)
        const newItem = {
          id: generateId(),
          wallId: nearest.wall.id,
          position: nearest.position,
          width: tool === 'door' ? 36 : 36, // 36 inches (3 feet)
          type: tool === 'door' ? 'single' : 'double-hung',
          ...(tool === 'door' ? { swing: 'left', openDirection: 'inward' } : { height: 48, sillHeight: 36 }),
        };

        updateActiveFloor(f => ({
          ...f,
          [tool === 'door' ? 'doors' : 'windows']: [...(f[tool === 'door' ? 'doors' : 'windows'] || []), newItem]
        }));

        setSelectedItems([{ type: tool, item: newItem }]);
        setSelectionSource?.('draw');
      }
    } else if (tool === 'dimension') {
      // Dimension tool - click two points to create a dimension line
      setIsDrawing(true);
      setDrawStart(snappedPos);
      setDrawEnd(snappedPos);
    } else if (tool === 'text') {
      // Text tool - click to place text annotation
      const newText = {
        id: generateId(),
        position: snappedPos,
        text: 'Text',
        fontSize: 14,
        color: '#ffffff',
        rotation: 0,
      };
      updateActiveFloor(f => ({
        ...f,
        texts: [...(f.texts || []), newText]
      }));
      setSelectedItems([{ type: 'text', item: newText }]);
      setSelectionSource?.('draw');
    } else if (tool === 'line') {
      // Line tool - click to draw annotation lines
      setIsDrawing(true);
      setDrawStart(snappedPos);
      setDrawEnd(snappedPos);
      // Detect if starting from an existing line to enable perpendicular snap
      const lineAngle = detectStartingLineAngle(snappedPos, activeFloor);
      setStartingLineAngle(lineAngle);
    } else if (tool === 'polyline') {
      // Polyline tool - click to add points, double-click or Escape to finish
      if (polylinePoints.length === 0) {
        // First point - start new polyline
        setPolylinePoints([snappedPos]);
        setIsDrawing(true);
        setDrawEnd(snappedPos);
      } else {
        // Add another point to the polyline
        setPolylinePoints(prev => [...prev, snappedPos]);
      }
    } else if (tool === 'hatch') {
      // Hatch tool - click to add boundary points, close to first point to finish
      // OR click on an existing closed polyline to convert it to a hatch

      // First, check if clicking on a closed polyline to convert it
      if (hatchPoints.length === 0) {
        const clickedPolyline = findClosedPolylineAt(pos);
        if (clickedPolyline) {
          // Convert closed polyline to hatch
          const newHatch = {
            id: generateId(),
            points: [...clickedPolyline.points],
            pattern: 'diagonal',
            color: '#888888',
            backgroundColor: 'transparent',
            spacing: 10,
            lineWidth: 1,
            opacity: 0.5,
          };
          updateActiveFloor(f => ({
            ...f,
            hatches: [...(f.hatches || []), newHatch],
            // Optionally remove the polyline
            // polylines: (f.polylines || []).filter(p => p.id !== clickedPolyline.id),
          }));
          setSelectedItems([{ type: 'hatch', item: newHatch }]);
          setSelectionSource?.('draw');
          return;
        }
      }

      // Check if clicking near the first point to close the hatch
      if (hatchPoints.length >= 3) {
        const distToFirst = distance(snappedPos, hatchPoints[0]);
        if (distToFirst < (isMobile ? 30 : 15)) {
          // Close the hatch
          const newHatch = {
            id: generateId(),
            points: [...hatchPoints],
            pattern: 'diagonal',
            color: '#888888',
            backgroundColor: 'transparent',
            spacing: 10,
            lineWidth: 1,
            opacity: 0.5,
          };
          updateActiveFloor(f => ({ ...f, hatches: [...(f.hatches || []), newHatch] }));
          setSelectedItems([{ type: 'hatch', item: newHatch }]);
          setSelectionSource?.('draw');
          setHatchPoints([]);
          setIsDrawing(false);
          setDrawEnd(null);
          setSnapGuidelines(null);
          setActiveSnap(null);
          return;
        }
      }

      // Add point to hatch boundary
      if (hatchPoints.length === 0) {
        // First point - start new hatch
        setHatchPoints([snappedPos]);
        setIsDrawing(true);
        setDrawEnd(snappedPos);
      } else {
        // Add another point to the hatch boundary
        setHatchPoints(prev => [...prev, snappedPos]);
      }
    } else if (tool === 'select') {
      // First check if clicking on a grip of a selected wall or roof
      const gripRadius = isMobile ? 20 : 12;
      for (const selected of selectedItems) {
        if (selected.type === 'wall') {
          const wall = selected.item;
          const dStart = distance(pos, wall.start);
          const dEnd = distance(pos, wall.end);

          if (dStart < gripRadius) {
            // Clicked on start grip - begin grip drag, store original position and wall angle
            const wallAngle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
            setActiveGrip({
              type: 'wall',
              wall,
              endpoint: 'start',
              originalPosition: { ...wall.start },
              originalOtherEndpoint: { ...wall.end },
              originalWallAngle: wallAngle
            });
            return;
          }
          if (dEnd < gripRadius) {
            // Clicked on end grip - begin grip drag, store original position and wall angle
            const wallAngle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
            setActiveGrip({
              type: 'wall',
              wall,
              endpoint: 'end',
              originalPosition: { ...wall.end },
              originalOtherEndpoint: { ...wall.start },
              originalWallAngle: wallAngle
            });
            return;
          }
        }

        // Check roof corner grips
        if (selected.type === 'roof') {
          const roof = selected.item;
          const points = getRoofPoints(roof);

          for (let i = 0; i < points.length; i++) {
            const d = distance(pos, points[i]);
            if (d < gripRadius) {
              // Clicked on roof corner grip - begin grip drag
              setActiveGrip({ type: 'roof', roof, pointIndex: i });
              return;
            }
          }
        }

        // Check dimension endpoint grips
        if (selected.type === 'dimension') {
          const dim = selected.item;
          const dStart = distance(pos, dim.start);
          const dEnd = distance(pos, dim.end);

          // Calculate offset midpoint position (where the diamond handle is)
          const dx = dim.end.x - dim.start.x;
          const dy = dim.end.y - dim.start.y;
          const angle = Math.atan2(dy, dx);
          const perpX = -Math.sin(angle) * (dim.offset || 0);
          const perpY = Math.cos(angle) * (dim.offset || 0);
          const offsetMid = {
            x: (dim.start.x + dim.end.x) / 2 + perpX,
            y: (dim.start.y + dim.end.y) / 2 + perpY
          };
          const dMid = distance(pos, offsetMid);

          // Check offset grip first (diamond at midpoint) - takes priority
          if (dMid < gripRadius) {
            setActiveGrip({ type: 'dimension-offset', dimension: dim });
            return;
          }

          if (dStart < gripRadius) {
            // Clicked on start grip - begin grip drag
            setActiveGrip({ type: 'dimension', dimension: dim, endpoint: 'start' });
            return;
          }
          if (dEnd < gripRadius) {
            // Clicked on end grip - begin grip drag
            setActiveGrip({ type: 'dimension', dimension: dim, endpoint: 'end' });
            return;
          }
        }

        // Check annotation line endpoint grips
        if (selected.type === 'line') {
          const line = selected.item;
          const dStart = distance(pos, line.start);
          const dEnd = distance(pos, line.end);

          if (dStart < gripRadius) {
            setActiveGrip({ type: 'line', line, endpoint: 'start' });
            return;
          }
          if (dEnd < gripRadius) {
            setActiveGrip({ type: 'line', line, endpoint: 'end' });
            return;
          }
        }

        // Check polyline vertex grips
        if (selected.type === 'polyline') {
          const polyline = selected.item;
          if (polyline.points && polyline.points.length > 0) {
            for (let i = 0; i < polyline.points.length; i++) {
              const d = distance(pos, polyline.points[i]);
              if (d < gripRadius) {
                setActiveGrip({ type: 'polyline', polyline, pointIndex: i });
                return;
              }
            }
          }
        }

        // Check hatch vertex grips
        if (selected.type === 'hatch') {
          const hatch = selected.item;
          if (hatch.points && hatch.points.length > 0) {
            for (let i = 0; i < hatch.points.length; i++) {
              const d = distance(pos, hatch.points[i]);
              if (d < gripRadius) {
                setActiveGrip({ type: 'hatch', hatch, pointIndex: i });
                return;
              }
            }
          }
        }

        // Check room vertex grips (for polygon-based rooms)
        if (selected.type === 'room') {
          const room = selected.item;
          if (room.points && room.points.length > 0) {
            for (let i = 0; i < room.points.length; i++) {
              const d = distance(pos, room.points[i]);
              if (d < gripRadius) {
                setActiveGrip({ type: 'room', room, pointIndex: i });
                return;
              }
            }
          }
        }
      }

      const item = findItemAt(pos);
      if (item) {
        // Check if already selected for multi-select
        if (e.shiftKey) {
          const alreadySelected = selectedItems.some(s => s.type === item.type && s.item?.id === item.item?.id);
          if (alreadySelected) {
            setSelectedItems(selectedItems.filter(s => !(s.type === item.type && s.item?.id === item.item?.id)));
          } else {
            setSelectedItems([...selectedItems, item]);
            setSelectionSource?.('click');
          }
        } else {
          setSelectedItems([item]);
          setSelectionSource?.('click');
          setDragItem(item.item);
          // For walls, store the current pos as the drag reference point
          // For text items, use position.x/y
          // For other items, calculate offset from item position (x, y)
          // Note: dimensions and lines use grip editing, not whole-item dragging
          if (item.type === 'wall') {
            setDragOffset({ x: pos.x, y: pos.y });
            // Store original wall positions for alignment guidelines
            setDragOriginalPositions({
              start: { ...item.item.start },
              end: { ...item.item.end }
            });
          } else if (item.type === 'text') {
            setDragOffset({ x: pos.x - (item.item.position?.x || 0), y: pos.y - (item.item.position?.y || 0) });
          } else {
            setDragOffset({ x: pos.x - (item.item.x || 0), y: pos.y - (item.item.y || 0) });
          }
        }
      } else {
        // Click on empty space - deselect
        setSelectedItems([]);
        setSelectionSource?.(null);
      }
    } else if (tool === 'move') {
      // Move tool - click base point, then click destination
      if (selectedItems.length === 0) {
        // Nothing selected - try to select something first
        const item = findItemAt(pos);
        if (item) {
          setSelectedItems([item]);
          setSelectionSource?.('click');
        }
        return;
      }

      if (!moveBasePoint) {
        // First click - set base point
        setMoveBasePoint(snappedPos);
        setMovePreviewPoint(snappedPos);
      } else {
        // Second click - execute move
        const deltaX = snappedPos.x - moveBasePoint.x;
        const deltaY = snappedPos.y - moveBasePoint.y;
        moveSelectedItems(deltaX, deltaY);
        setMoveBasePoint(null);
        setMovePreviewPoint(null);
      }
    } else if (tool === 'rotate') {
      // Rotate tool - click center, then click/drag to set angle
      if (selectedItems.length === 0) {
        // Nothing selected - try to select something first
        const item = findItemAt(pos);
        if (item) {
          setSelectedItems([item]);
          setSelectionSource?.('click');
        }
        return;
      }

      if (!rotateCenter) {
        // First click - set rotation center
        setRotateCenter(snappedPos);
        setRotateStartAngle(null);
        setRotatePreviewAngle(0);
      } else if (rotateStartAngle === null) {
        // Second click - set reference angle
        const angle = Math.atan2(snappedPos.y - rotateCenter.y, snappedPos.x - rotateCenter.x);
        setRotateStartAngle(angle);
        setRotatePreviewAngle(angle);
      } else {
        // Third click - execute rotation
        const newAngle = Math.atan2(snappedPos.y - rotateCenter.y, snappedPos.x - rotateCenter.x);
        const angleDelta = newAngle - rotateStartAngle;
        rotateSelectedItems(rotateCenter.x, rotateCenter.y, angleDelta);
        setRotateCenter(null);
        setRotateStartAngle(null);
        setRotatePreviewAngle(null);
      }
    } else if (tool === 'extend') {
      // Extend tool - click on wall endpoint to extend it to meet another wall
      const walls = activeFloor?.walls || [];
      let clickedWall = null;
      let clickedEndpoint = null;
      let minDist = 30 / scale;

      for (const wall of walls) {
        const dStart = distance(pos, wall.start);
        const dEnd = distance(pos, wall.end);
        if (dStart < minDist) {
          minDist = dStart;
          clickedWall = wall;
          clickedEndpoint = 'start';
        }
        if (dEnd < minDist) {
          minDist = dEnd;
          clickedWall = wall;
          clickedEndpoint = 'end';
        }
      }

      if (clickedWall && clickedEndpoint) {
        const extendPoint = clickedEndpoint === 'start' ? clickedWall.start : clickedWall.end;
        const wallDir = {
          x: clickedWall.end.x - clickedWall.start.x,
          y: clickedWall.end.y - clickedWall.start.y,
        };
        const wallLen = Math.sqrt(wallDir.x * wallDir.x + wallDir.y * wallDir.y);
        if (wallLen < 0.001) return;
        wallDir.x /= wallLen;
        wallDir.y /= wallLen;

        if (clickedEndpoint === 'start') {
          wallDir.x = -wallDir.x;
          wallDir.y = -wallDir.y;
        }

        // Find intersection with other walls
        let bestIntersection = null;
        let bestDist = Infinity;

        for (const targetWall of walls) {
          if (targetWall.id === clickedWall.id) continue;

          const x1 = extendPoint.x, y1 = extendPoint.y;
          const x2 = extendPoint.x + wallDir.x * 10000, y2 = extendPoint.y + wallDir.y * 10000;
          const x3 = targetWall.start.x, y3 = targetWall.start.y;
          const x4 = targetWall.end.x, y4 = targetWall.end.y;

          const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
          if (Math.abs(denom) < 0.001) continue;

          const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
          const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

          if (t > 0.001 && u >= -0.01 && u <= 1.01) {
            const ix = x1 + t * (x2 - x1);
            const iy = y1 + t * (y2 - y1);
            const dist = t * Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));

            if (dist < bestDist) {
              bestDist = dist;
              bestIntersection = { x: ix, y: iy };
            }
          }
        }

        if (bestIntersection) {
          updateActiveFloor(f => ({
            ...f,
            walls: f.walls.map(w => {
              if (w.id === clickedWall.id) {
                if (clickedEndpoint === 'start') {
                  return { ...w, start: { x: snap(bestIntersection.x), y: snap(bestIntersection.y) } };
                } else {
                  return { ...w, end: { x: snap(bestIntersection.x), y: snap(bestIntersection.y) } };
                }
              }
              return w;
            }),
          }));
        }
      }
    } else if (tool === 'trim') {
      // Trim tool - click on a wall segment to trim it at intersections
      const walls = activeFloor?.walls || [];
      let clickedWall = null;
      let clickedT = 0;
      let minDist = 15 / scale;

      for (const wall of walls) {
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.001) continue;

        let t = ((pos.x - wall.start.x) * dx + (pos.y - wall.start.y) * dy) / (len * len);
        t = Math.max(0, Math.min(1, t));

        const closest = { x: wall.start.x + t * dx, y: wall.start.y + t * dy };
        const d = distance(pos, closest);
        if (d < minDist) {
          minDist = d;
          clickedWall = wall;
          clickedT = t;
        }
      }

      if (clickedWall) {
        // Find all intersections with other walls
        const intersections = [];

        for (const targetWall of walls) {
          if (targetWall.id === clickedWall.id) continue;

          const x1 = clickedWall.start.x, y1 = clickedWall.start.y;
          const x2 = clickedWall.end.x, y2 = clickedWall.end.y;
          const x3 = targetWall.start.x, y3 = targetWall.start.y;
          const x4 = targetWall.end.x, y4 = targetWall.end.y;

          const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
          if (Math.abs(denom) < 0.001) continue;

          const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
          const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

          if (t >= 0.01 && t <= 0.99 && u >= 0.01 && u <= 0.99) {
            intersections.push({
              t,
              x: x1 + t * (x2 - x1),
              y: y1 + t * (y2 - y1),
            });
          }
        }

        if (intersections.length > 0) {
          intersections.sort((a, b) => a.t - b.t);

          let segmentStart = 0;
          let segmentEnd = 1;

          for (let i = 0; i < intersections.length; i++) {
            if (intersections[i].t > clickedT) {
              segmentEnd = intersections[i].t;
              break;
            }
            segmentStart = intersections[i].t;
          }

          const dx = clickedWall.end.x - clickedWall.start.x;
          const dy = clickedWall.end.y - clickedWall.start.y;

          if (segmentStart === 0) {
            // Trim from start
            const newStart = {
              x: snap(clickedWall.start.x + segmentEnd * dx),
              y: snap(clickedWall.start.y + segmentEnd * dy),
            };
            updateActiveFloor(f => ({
              ...f,
              walls: f.walls.map(w => w.id === clickedWall.id ? { ...w, start: newStart } : w),
            }));
          } else if (segmentEnd === 1) {
            // Trim from end
            const newEnd = {
              x: snap(clickedWall.start.x + segmentStart * dx),
              y: snap(clickedWall.start.y + segmentStart * dy),
            };
            updateActiveFloor(f => ({
              ...f,
              walls: f.walls.map(w => w.id === clickedWall.id ? { ...w, end: newEnd } : w),
            }));
          } else {
            // Middle segment - split wall
            const newWall1 = {
              ...clickedWall,
              id: generateId(),
              end: {
                x: snap(clickedWall.start.x + segmentStart * dx),
                y: snap(clickedWall.start.y + segmentStart * dy),
              },
            };
            const newWall2 = {
              ...clickedWall,
              id: generateId(),
              start: {
                x: snap(clickedWall.start.x + segmentEnd * dx),
                y: snap(clickedWall.start.y + segmentEnd * dy),
              },
            };
            updateActiveFloor(f => ({
              ...f,
              walls: f.walls.filter(w => w.id !== clickedWall.id).concat([newWall1, newWall2]),
            }));
          }
        }
      }
    } else if (tool === 'corner') {
      // Corner tool - tap near a corner to clean up wall intersection
      const walls = activeFloor?.walls || [];
      if (walls.length < 2) return;

      const searchRadius = isMobile ? 150 / scale : 100 / scale;

      // Find walls near the click point
      const nearbyWalls = [];
      for (const wall of walls) {
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.001) continue;

        let t = ((pos.x - wall.start.x) * dx + (pos.y - wall.start.y) * dy) / (len * len);
        t = Math.max(0, Math.min(1, t));

        const closest = { x: wall.start.x + t * dx, y: wall.start.y + t * dy };
        const distToWall = distance(pos, closest);
        if (distToWall < searchRadius) {
          nearbyWalls.push({ wall, distToWall });
        }
      }

      nearbyWalls.sort((a, b) => a.distToWall - b.distToWall);

      if (nearbyWalls.length >= 2) {
        const wall1 = nearbyWalls[0].wall;
        const wall2 = nearbyWalls[1].wall;

        // Find which endpoints are closest
        const endpointPairs = [
          { ep1: 'start', ep2: 'start', dist: distance(wall1.start, wall2.start) },
          { ep1: 'start', ep2: 'end', dist: distance(wall1.start, wall2.end) },
          { ep1: 'end', ep2: 'start', dist: distance(wall1.end, wall2.start) },
          { ep1: 'end', ep2: 'end', dist: distance(wall1.end, wall2.end) },
        ];
        endpointPairs.sort((a, b) => a.dist - b.dist);
        const closestPair = endpointPairs[0];

        // Calculate intersection point
        const x1 = wall1.start.x, y1 = wall1.start.y;
        const x2 = wall1.end.x, y2 = wall1.end.y;
        const x3 = wall2.start.x, y3 = wall2.start.y;
        const x4 = wall2.end.x, y4 = wall2.end.y;

        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (Math.abs(denom) > 0.001) {
          const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
          const ix = x1 + t * (x2 - x1);
          const iy = y1 + t * (y2 - y1);
          const intersection = { x: snap(ix), y: snap(iy) };

          updateActiveFloor(f => ({
            ...f,
            walls: f.walls.map(w => {
              if (w.id === wall1.id) {
                return closestPair.ep1 === 'start'
                  ? { ...w, start: intersection }
                  : { ...w, end: intersection };
              }
              if (w.id === wall2.id) {
                return closestPair.ep2 === 'start'
                  ? { ...w, start: intersection }
                  : { ...w, end: intersection };
              }
              return w;
            }),
          }));
        }
      }
    } else if (tool === 'chamfer') {
      // Chamfer tool - cut corner at 45 degrees with configurable distance
      const walls = activeFloor?.walls || [];
      if (walls.length < 2) return;

      const searchRadius = isMobile ? 150 / scale : 100 / scale;
      const chamferSize = 24; // Default chamfer size in pixels (about 7 inches)

      // Find walls near the click point
      const nearbyWalls = [];
      for (const wall of walls) {
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.001) continue;

        let t = ((pos.x - wall.start.x) * dx + (pos.y - wall.start.y) * dy) / (len * len);
        t = Math.max(0, Math.min(1, t));

        const closest = { x: wall.start.x + t * dx, y: wall.start.y + t * dy };
        const distToWall = distance(pos, closest);
        if (distToWall < searchRadius) {
          nearbyWalls.push({ wall, distToWall });
        }
      }

      nearbyWalls.sort((a, b) => a.distToWall - b.distToWall);

      if (nearbyWalls.length >= 2) {
        const wall1 = nearbyWalls[0].wall;
        const wall2 = nearbyWalls[1].wall;

        // Find which endpoints are closest
        const endpointPairs = [
          { ep1: 'start', ep2: 'start', dist: distance(wall1.start, wall2.start) },
          { ep1: 'start', ep2: 'end', dist: distance(wall1.start, wall2.end) },
          { ep1: 'end', ep2: 'start', dist: distance(wall1.end, wall2.start) },
          { ep1: 'end', ep2: 'end', dist: distance(wall1.end, wall2.end) },
        ];
        endpointPairs.sort((a, b) => a.dist - b.dist);
        const closestPair = endpointPairs[0];

        // Calculate intersection point
        const x1 = wall1.start.x, y1 = wall1.start.y;
        const x2 = wall1.end.x, y2 = wall1.end.y;
        const x3 = wall2.start.x, y3 = wall2.start.y;
        const x4 = wall2.end.x, y4 = wall2.end.y;

        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (Math.abs(denom) > 0.001) {
          const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
          const ix = x1 + t * (x2 - x1);
          const iy = y1 + t * (y2 - y1);

          // Calculate direction vectors for each wall (pointing away from intersection)
          const dir1 = closestPair.ep1 === 'start'
            ? { x: x2 - x1, y: y2 - y1 }
            : { x: x1 - x2, y: y1 - y2 };
          const len1 = Math.sqrt(dir1.x * dir1.x + dir1.y * dir1.y);
          dir1.x /= len1; dir1.y /= len1;

          const dir2 = closestPair.ep2 === 'start'
            ? { x: x4 - x3, y: y4 - y3 }
            : { x: x3 - x4, y: y3 - y4 };
          const len2 = Math.sqrt(dir2.x * dir2.x + dir2.y * dir2.y);
          dir2.x /= len2; dir2.y /= len2;

          // Calculate chamfer points (offset from intersection along each wall)
          const chamferPt1 = { x: snap(ix + dir1.x * chamferSize), y: snap(iy + dir1.y * chamferSize) };
          const chamferPt2 = { x: snap(ix + dir2.x * chamferSize), y: snap(iy + dir2.y * chamferSize) };

          // Create new chamfer wall connecting the two points
          const chamferWall = {
            id: generateId(),
            start: chamferPt1,
            end: chamferPt2,
            type: wall1.type || 'interior',
            height: wall1.height || 96,
          };

          updateActiveFloor(f => ({
            ...f,
            walls: f.walls.map(w => {
              if (w.id === wall1.id) {
                return closestPair.ep1 === 'start'
                  ? { ...w, start: chamferPt1 }
                  : { ...w, end: chamferPt1 };
              }
              if (w.id === wall2.id) {
                return closestPair.ep2 === 'start'
                  ? { ...w, start: chamferPt2 }
                  : { ...w, end: chamferPt2 };
              }
              return w;
            }).concat([chamferWall]),
          }));
        }
      }
    } else if (tool === 'fillet') {
      // Fillet tool - round corner with arc
      const walls = activeFloor?.walls || [];
      if (walls.length < 2) return;

      const searchRadius = isMobile ? 150 / scale : 100 / scale;
      const filletRadius = 30; // Default fillet radius in pixels (about 9 inches)

      // Find walls near the click point
      const nearbyWalls = [];
      for (const wall of walls) {
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.001) continue;

        let t = ((pos.x - wall.start.x) * dx + (pos.y - wall.start.y) * dy) / (len * len);
        t = Math.max(0, Math.min(1, t));

        const closest = { x: wall.start.x + t * dx, y: wall.start.y + t * dy };
        const distToWall = distance(pos, closest);
        if (distToWall < searchRadius) {
          nearbyWalls.push({ wall, distToWall });
        }
      }

      nearbyWalls.sort((a, b) => a.distToWall - b.distToWall);

      if (nearbyWalls.length >= 2) {
        const wall1 = nearbyWalls[0].wall;
        const wall2 = nearbyWalls[1].wall;

        // Find which endpoints are closest
        const endpointPairs = [
          { ep1: 'start', ep2: 'start', dist: distance(wall1.start, wall2.start) },
          { ep1: 'start', ep2: 'end', dist: distance(wall1.start, wall2.end) },
          { ep1: 'end', ep2: 'start', dist: distance(wall1.end, wall2.start) },
          { ep1: 'end', ep2: 'end', dist: distance(wall1.end, wall2.end) },
        ];
        endpointPairs.sort((a, b) => a.dist - b.dist);
        const closestPair = endpointPairs[0];

        // Calculate intersection point
        const x1 = wall1.start.x, y1 = wall1.start.y;
        const x2 = wall1.end.x, y2 = wall1.end.y;
        const x3 = wall2.start.x, y3 = wall2.start.y;
        const x4 = wall2.end.x, y4 = wall2.end.y;

        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (Math.abs(denom) > 0.001) {
          const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
          const ix = x1 + t * (x2 - x1);
          const iy = y1 + t * (y2 - y1);

          // Calculate direction vectors for each wall (pointing away from intersection)
          const dir1 = closestPair.ep1 === 'start'
            ? { x: x2 - x1, y: y2 - y1 }
            : { x: x1 - x2, y: y1 - y2 };
          const len1 = Math.sqrt(dir1.x * dir1.x + dir1.y * dir1.y);
          dir1.x /= len1; dir1.y /= len1;

          const dir2 = closestPair.ep2 === 'start'
            ? { x: x4 - x3, y: y4 - y3 }
            : { x: x3 - x4, y: y3 - y4 };
          const len2 = Math.sqrt(dir2.x * dir2.x + dir2.y * dir2.y);
          dir2.x /= len2; dir2.y /= len2;

          // Calculate tangent points (where fillet touches each wall)
          const tangentPt1 = { x: snap(ix + dir1.x * filletRadius), y: snap(iy + dir1.y * filletRadius) };
          const tangentPt2 = { x: snap(ix + dir2.x * filletRadius), y: snap(iy + dir2.y * filletRadius) };

          // Calculate fillet center (offset from intersection by radius along angle bisector)
          const bisector = { x: dir1.x + dir2.x, y: dir1.y + dir2.y };
          const bisectorLen = Math.sqrt(bisector.x * bisector.x + bisector.y * bisector.y);
          if (bisectorLen > 0.001) {
            bisector.x /= bisectorLen;
            bisector.y /= bisectorLen;
          }

          // Calculate angle between walls to determine arc center distance
          const dotProduct = dir1.x * dir2.x + dir1.y * dir2.y;
          const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
          const centerDist = filletRadius / Math.sin(angle / 2);

          const filletCenter = {
            x: ix + bisector.x * centerDist,
            y: iy + bisector.y * centerDist
          };

          // Calculate start and end angles for the arc
          const startAngle = Math.atan2(tangentPt1.y - filletCenter.y, tangentPt1.x - filletCenter.x);
          const endAngle = Math.atan2(tangentPt2.y - filletCenter.y, tangentPt2.x - filletCenter.x);

          // Create fillet arc data
          const filletArc = {
            id: generateId(),
            type: 'fillet',
            center: filletCenter,
            radius: filletRadius,
            startAngle,
            endAngle,
            wallType: wall1.type || 'interior',
          };

          updateActiveFloor(f => ({
            ...f,
            walls: f.walls.map(w => {
              if (w.id === wall1.id) {
                return closestPair.ep1 === 'start'
                  ? { ...w, start: tangentPt1 }
                  : { ...w, end: tangentPt1 };
              }
              if (w.id === wall2.id) {
                return closestPair.ep2 === 'start'
                  ? { ...w, start: tangentPt2 }
                  : { ...w, end: tangentPt2 };
              }
              return w;
            }),
            fillets: [...(f.fillets || []), filletArc],
          }));
        }
      }
    }
  }, [tool, getPointerPos, snap, offset, scale, findItemAt, findNearestWall, updateActiveFloor, selectedItems, setSelectedItems, moveBasePoint, moveSelectedItems, rotateCenter, rotateStartAngle, rotateSelectedItems, activeFloor, isMobile, polylinePoints, hatchPoints, roomPoints, findClosedPolylineAt]);

  // Handle pointer move
  const handlePointerMove = useCallback((e) => {
    e.preventDefault?.();

    // Handle pinch-to-zoom with two fingers
    if (e.touches?.length === 2 && pinchStart && setScale && setOffset) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      // Calculate new scale based on pinch distance change
      const scaleChange = dist / pinchStart.dist;
      const newScale = Math.max(0.1, Math.min(5, pinchStart.scale * scaleChange));

      // Calculate offset to zoom towards the INITIAL pinch center
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        // Use the initial pinch center for zoom calculation
        const initialPinchCenterX = pinchStart.centerX - rect.left;
        const initialPinchCenterY = pinchStart.centerY - rect.top;

        // Adjust offset to keep initial pinch center stationary during zoom
        const scaleRatio = newScale / pinchStart.scale;
        const newOffsetX = initialPinchCenterX - (initialPinchCenterX - pinchStart.offsetX) * scaleRatio;
        const newOffsetY = initialPinchCenterY - (initialPinchCenterY - pinchStart.offsetY) * scaleRatio;

        // Also handle two-finger pan (movement of the pinch center from initial position)
        const panDeltaX = centerX - pinchStart.centerX;
        const panDeltaY = centerY - pinchStart.centerY;

        setScale(newScale);
        setOffset({ x: newOffsetX + panDeltaX, y: newOffsetY + panDeltaY });
      }
      return;
    }

    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;

    if (isPanning && clientX !== undefined && clientY !== undefined && setOffset) {
      const panDeltaX = clientX - panStartRef.current.x;
      const panDeltaY = clientY - panStartRef.current.y;
      // Use functional update to ensure we're using the latest offset value
      setOffset(prev => ({
        x: prev.x + panDeltaX,
        y: prev.y + panDeltaY
      }));
      panStartRef.current = { x: clientX, y: clientY };
      return;
    }

    // Handle drawing state updates - for regular tools (drawStart) or polyline/hatch/room (accumulated points)
    if (isDrawing && (drawStart || polylinePoints.length > 0 || hatchPoints.length > 0 || roomPoints.length > 0)) {
      const pos = getPointerPos(e);
      // Keep raw position for object snap detection (object snaps should override grid)
      const rawPos = { ...pos };
      let snappedPos = { ...pos };

      // Auto-pan when drawing near screen edges on mobile
      if (isMobile && clientX !== undefined && clientY !== undefined && setOffset) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const edgeThreshold = 80; // pixels from edge
        const basePanSpeed = 1.5; // reduced base speed
        let panX = 0;
        let panY = 0;

        // Check edges using screen coordinates - gradual speed based on distance from edge
        if (clientX < edgeThreshold) {
          const proximity = 1 - (clientX / edgeThreshold);
          panX = basePanSpeed * proximity;
        }
        if (clientX > screenWidth - edgeThreshold) {
          const proximity = 1 - ((screenWidth - clientX) / edgeThreshold);
          panX = -basePanSpeed * proximity;
        }
        if (clientY < edgeThreshold) {
          const proximity = 1 - (clientY / edgeThreshold);
          panY = basePanSpeed * proximity;
        }
        if (clientY > screenHeight - edgeThreshold) {
          const proximity = 1 - ((screenHeight - clientY) / edgeThreshold);
          panY = -basePanSpeed * proximity;
        }

        if (panX !== 0 || panY !== 0) {
          setOffset(prev => ({ x: prev.x + panX, y: prev.y + panY }));
        }
      }

      // Apply snapping for walls, doors, windows, dimensions, lines, polylines, hatches, and rooms
      if (tool === 'wall' || tool === 'door' || tool === 'window' || tool === 'dimension' || tool === 'line' || tool === 'polyline' || tool === 'hatch' || tool === 'room') {
        // Apply angle snapping first (for walls and lines)
        let currentPolarAngle = null;
        let isPolarSnapped = false;
        if (tool === 'wall' || tool === 'line') {
          const angleResult = snapAngle(drawStart, snappedPos, startingLineAngle);
          snappedPos = angleResult.point;
          currentPolarAngle = angleResult.angle;
          isPolarSnapped = angleResult.isSnapped;
          setPolarAngle(currentPolarAngle);
        } else {
          setPolarAngle(null);
        }

        // Apply grid snapping if enabled
        // When polar tracking is active, snap along the angle line to grid instead of both axes
        if (snaps.grid) {
          if (isPolarSnapped && currentPolarAngle !== null && drawStart) {
            // Snap to grid along the polar angle line
            // Calculate the length from start to current position
            const dx = snappedPos.x - drawStart.x;
            const dy = snappedPos.y - drawStart.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            // Snap the length to grid
            const snappedLength = snap(length);
            // Recalculate position along the angle
            const angleRad = currentPolarAngle * Math.PI / 180;
            snappedPos = {
              x: drawStart.x + Math.cos(angleRad) * snappedLength,
              y: drawStart.y + Math.sin(angleRad) * snappedLength,
            };
          } else {
            // Normal grid snapping for non-polar tools
            snappedPos = { x: snap(snappedPos.x), y: snap(snappedPos.y) };
          }
        }

        // Snap distances - larger for mobile
        const POINT_SNAP_DIST = isMobile ? 50 : 20;
        const PERP_SNAP_DIST = isMobile ? 40 : 15;
        const NEAREST_SNAP_DIST = isMobile ? 35 : 12;
        const ALIGNMENT_SNAP_DIST = isMobile ? 30 : 15;

        // Collect all snap candidates
        const snapCandidates = [];
        const walls = activeFloor?.walls || [];

        // For polyline/hatch/room, use the last point as the reference; for other tools use drawStart
        const referencePoint = tool === 'polyline' && polylinePoints.length > 0
          ? polylinePoints[polylinePoints.length - 1]
          : tool === 'hatch' && hatchPoints.length > 0
            ? hatchPoints[hatchPoints.length - 1]
            : tool === 'room' && roomPoints.length > 0
              ? roomPoints[roomPoints.length - 1]
              : drawStart;

        // Skip points too close to reference point (drawStart or last polyline point)
        const isNearStart = (pt) =>
          referencePoint && Math.abs(pt.x - referencePoint.x) < 5 && Math.abs(pt.y - referencePoint.y) < 5;

        walls.forEach(wall => {
          // Endpoint snaps
          if (snaps.endpoint) {
            if (!isNearStart(wall.start)) {
              snapCandidates.push({
                x: wall.start.x,
                y: wall.start.y,
                type: 'endpoint',
                wall
              });
            }
            if (!isNearStart(wall.end)) {
              snapCandidates.push({
                x: wall.end.x,
                y: wall.end.y,
                type: 'endpoint',
                wall
              });
            }
          }

          // Midpoint snaps
          if (snaps.midpoint) {
            const mid = {
              x: (wall.start.x + wall.end.x) / 2,
              y: (wall.start.y + wall.end.y) / 2
            };
            if (!isNearStart(mid)) {
              snapCandidates.push({
                ...mid,
                type: 'midpoint',
                wall
              });
            }
          }

          // Door midpoint snaps - snap to center of doors on this wall
          const wallDoors = (activeFloor?.doors || []).filter(d => d.wallId === wall.id);
          if (snaps.midpoint && wallDoors.length > 0) {
            const wallDx = wall.end.x - wall.start.x;
            const wallDy = wall.end.y - wall.start.y;
            const wallLength = Math.sqrt(wallDx * wallDx + wallDy * wallDy);

            wallDoors.forEach(door => {
              // door.position is normalized (0-1) along the wall
              const doorCenterPos = door.position * wallLength;
              const doorMid = {
                x: wall.start.x + (doorCenterPos / wallLength) * wallDx,
                y: wall.start.y + (doorCenterPos / wallLength) * wallDy
              };
              if (!isNearStart(doorMid)) {
                snapCandidates.push({
                  ...doorMid,
                  type: 'door-midpoint',
                  wall,
                  door
                });
              }
            });
          }

          // Window midpoint snaps - snap to center of windows on this wall
          const wallWindows = (activeFloor?.windows || []).filter(w => w.wallId === wall.id);
          if (snaps.midpoint && wallWindows.length > 0) {
            const wallDx = wall.end.x - wall.start.x;
            const wallDy = wall.end.y - wall.start.y;
            const wallLength = Math.sqrt(wallDx * wallDx + wallDy * wallDy);

            wallWindows.forEach(window => {
              // window.position is normalized (0-1) along the wall
              const windowCenterPos = window.position * wallLength;
              const windowMid = {
                x: wall.start.x + (windowCenterPos / wallLength) * wallDx,
                y: wall.start.y + (windowCenterPos / wallLength) * wallDy
              };
              if (!isNearStart(windowMid)) {
                snapCandidates.push({
                  ...windowMid,
                  type: 'window-midpoint',
                  wall,
                  window
                });
              }
            });
          }

          // Perpendicular snap - find the point on wall where a line from reference point would be perpendicular
          if (snaps.perpendicular && referencePoint) {
            const wallDx = wall.end.x - wall.start.x;
            const wallDy = wall.end.y - wall.start.y;
            const wallLen2 = wallDx * wallDx + wallDy * wallDy;

            if (wallLen2 > 0) {
              // Project reference point onto the wall line to find perpendicular foot
              const t = ((referencePoint.x - wall.start.x) * wallDx + (referencePoint.y - wall.start.y) * wallDy) / wallLen2;

              // Only consider if perpendicular foot lands on the wall segment
              if (t >= 0.01 && t <= 0.99) { // Avoid endpoints (those are handled by endpoint snap)
                const perpPoint = {
                  x: wall.start.x + t * wallDx,
                  y: wall.start.y + t * wallDy
                };

                // Check if cursor is near this perpendicular point (use rawPos for detection)
                const distToPerpPoint = distance(rawPos, perpPoint);
                if (distToPerpPoint < PERP_SNAP_DIST && !isNearStart(perpPoint)) {
                  snapCandidates.push({
                    ...perpPoint,
                    type: 'perpendicular',
                    wall,
                    priority: 2 // Higher priority than nearest
                  });
                }
              }
            }
          }

          // Nearest point snap - closest point on wall (use rawPos for detection)
          if (snaps.nearest) {
            const nearest = closestPointOnLine(rawPos, wall.start, wall.end);
            if (!isNearStart(nearest)) {
              const d = distance(rawPos, nearest);
              if (d < NEAREST_SNAP_DIST) {
                snapCandidates.push({
                  ...nearest,
                  type: 'nearest',
                  wall,
                  priority: 1 // Lower priority
                });
              }
            }
          }
        });

        // Add polyline snaps - vertices, midpoints, nearest, perpendicular
        (activeFloor?.polylines || []).forEach(polyline => {
          if (!polyline.points || polyline.points.length < 2) return;

          // Endpoint snaps - snap to vertices
          if (snaps.endpoint) {
            polyline.points.forEach(pt => {
              if (!isNearStart(pt)) {
                snapCandidates.push({
                  x: pt.x,
                  y: pt.y,
                  type: 'endpoint',
                });
              }
            });
          }

          // Process each segment for midpoint, nearest, and perpendicular snaps
          const numSegments = polyline.closed ? polyline.points.length : polyline.points.length - 1;
          for (let i = 0; i < numSegments; i++) {
            const p1 = polyline.points[i];
            const p2 = polyline.points[(i + 1) % polyline.points.length];
            const segDx = p2.x - p1.x;
            const segDy = p2.y - p1.y;
            const segLen2 = segDx * segDx + segDy * segDy;
            if (segLen2 < 0.001) continue;

            // Midpoint snap
            if (snaps.midpoint) {
              const mid = {
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2
              };
              if (!isNearStart(mid)) {
                snapCandidates.push({
                  ...mid,
                  type: 'midpoint',
                });
              }
            }

            // Perpendicular snap (use rawPos for detection)
            if (snaps.perpendicular && referencePoint) {
              const t = ((referencePoint.x - p1.x) * segDx + (referencePoint.y - p1.y) * segDy) / segLen2;
              if (t >= 0.01 && t <= 0.99) {
                const perpPoint = {
                  x: p1.x + t * segDx,
                  y: p1.y + t * segDy
                };
                const distToPerpPoint = distance(rawPos, perpPoint);
                if (distToPerpPoint < PERP_SNAP_DIST && !isNearStart(perpPoint)) {
                  snapCandidates.push({
                    ...perpPoint,
                    type: 'perpendicular',
                    priority: 2
                  });
                }
              }
            }

            // Nearest point snap (use rawPos for detection)
            if (snaps.nearest) {
              const t = Math.max(0, Math.min(1, ((rawPos.x - p1.x) * segDx + (rawPos.y - p1.y) * segDy) / segLen2));
              const nearest = {
                x: p1.x + t * segDx,
                y: p1.y + t * segDy
              };
              if (!isNearStart(nearest)) {
                const d = distance(rawPos, nearest);
                if (d < NEAREST_SNAP_DIST) {
                  snapCandidates.push({
                    ...nearest,
                    type: 'nearest',
                    priority: 1
                  });
                }
              }
            }
          }
        });

        // Also snap to vertices of the polyline currently being drawn (except the last point)
        if (snaps.endpoint && tool === 'polyline' && polylinePoints.length > 1) {
          // Can snap to first point to close the polyline, and other points
          polylinePoints.forEach((pt, idx) => {
            // Skip the last point (that's the reference point)
            if (idx === polylinePoints.length - 1) return;
            if (!isNearStart(pt)) {
              snapCandidates.push({
                x: pt.x,
                y: pt.y,
                type: idx === 0 ? 'close-polyline' : 'endpoint',
              });
            }
          });
        }

        // Add annotation line snaps - endpoints, midpoints, nearest, perpendicular
        (activeFloor?.lines || []).forEach(line => {
          if (!line.start || !line.end) return;

          const lineDx = line.end.x - line.start.x;
          const lineDy = line.end.y - line.start.y;
          const lineLen2 = lineDx * lineDx + lineDy * lineDy;
          if (lineLen2 < 0.001) return;

          // Endpoint snaps
          if (snaps.endpoint) {
            if (!isNearStart(line.start)) {
              snapCandidates.push({
                x: line.start.x,
                y: line.start.y,
                type: 'endpoint',
              });
            }
            if (!isNearStart(line.end)) {
              snapCandidates.push({
                x: line.end.x,
                y: line.end.y,
                type: 'endpoint',
              });
            }
          }

          // Midpoint snap
          if (snaps.midpoint) {
            const mid = {
              x: (line.start.x + line.end.x) / 2,
              y: (line.start.y + line.end.y) / 2
            };
            if (!isNearStart(mid)) {
              snapCandidates.push({
                ...mid,
                type: 'midpoint',
              });
            }
          }

          // Perpendicular snap (use rawPos for detection)
          if (snaps.perpendicular && referencePoint) {
            const t = ((referencePoint.x - line.start.x) * lineDx + (referencePoint.y - line.start.y) * lineDy) / lineLen2;
            if (t >= 0.01 && t <= 0.99) {
              const perpPoint = {
                x: line.start.x + t * lineDx,
                y: line.start.y + t * lineDy
              };
              const distToPerpPoint = distance(rawPos, perpPoint);
              if (distToPerpPoint < PERP_SNAP_DIST && !isNearStart(perpPoint)) {
                snapCandidates.push({
                  ...perpPoint,
                  type: 'perpendicular',
                  priority: 2
                });
              }
            }
          }

          // Nearest point snap (use rawPos for detection)
          if (snaps.nearest) {
            const t = Math.max(0, Math.min(1, ((rawPos.x - line.start.x) * lineDx + (rawPos.y - line.start.y) * lineDy) / lineLen2));
            const nearest = {
              x: line.start.x + t * lineDx,
              y: line.start.y + t * lineDy
            };
            if (!isNearStart(nearest)) {
              const d = distance(rawPos, nearest);
              if (d < NEAREST_SNAP_DIST) {
                snapCandidates.push({
                  ...nearest,
                  type: 'nearest',
                  priority: 1
                });
              }
            }
          }
        });

        // Find best snap candidate
        // Priority: endpoint/midpoint > perpendicular > nearest
        let bestSnap = null;
        let bestDist = POINT_SNAP_DIST;

        // First pass: check endpoints and midpoints (highest priority) including door/window midpoints and polyline close
        // Use rawPos for distance checks so object snaps work regardless of grid snapping
        snapCandidates
          .filter(c => c.type === 'endpoint' || c.type === 'midpoint' || c.type === 'door-midpoint' || c.type === 'window-midpoint' || c.type === 'close-polyline')
          .forEach(candidate => {
            const d = distance(rawPos, candidate);
            if (d < bestDist) {
              bestDist = d;
              bestSnap = candidate;
            }
          });

        // Second pass: check perpendicular if no point snap found
        if (!bestSnap) {
          bestDist = PERP_SNAP_DIST;
          snapCandidates
            .filter(c => c.type === 'perpendicular')
            .forEach(candidate => {
              const d = distance(rawPos, candidate);
              if (d < bestDist) {
                bestDist = d;
                bestSnap = candidate;
              }
            });
        }

        // Third pass: check nearest if no other snap found
        if (!bestSnap) {
          bestDist = NEAREST_SNAP_DIST;
          snapCandidates
            .filter(c => c.type === 'nearest')
            .forEach(candidate => {
              const d = distance(rawPos, candidate);
              if (d < bestDist) {
                bestDist = d;
                bestSnap = candidate;
              }
            });
        }

        // Apply snap if found
        if (bestSnap) {
          snappedPos = { x: bestSnap.x, y: bestSnap.y };
          setActiveSnap({
            type: bestSnap.type,
            point: { x: bestSnap.x, y: bestSnap.y },
            wall: bestSnap.wall
          });
        } else {
          setActiveSnap(null);
        }

        // Check for alignment guidelines
        let guidelines = null;
        const alignPoints = snapCandidates.filter(c => c.type === 'endpoint' || c.type === 'midpoint' || c.type === 'door-midpoint' || c.type === 'window-midpoint' || c.type === 'close-polyline');

        if (bestSnap && (bestSnap.type === 'endpoint' || bestSnap.type === 'midpoint' || bestSnap.type === 'door-midpoint' || bestSnap.type === 'window-midpoint' || bestSnap.type === 'close-polyline')) {
          // Snapped directly to a point - show guidelines through that point
          guidelines = [
            {
              type: 'horizontal',
              y: bestSnap.y,
              pointType: bestSnap.type,
              alignedPoint: { x: bestSnap.x, y: bestSnap.y },
              snappedTo: true
            },
            {
              type: 'vertical',
              x: bestSnap.x,
              pointType: bestSnap.type,
              alignedPoint: { x: bestSnap.x, y: bestSnap.y },
              snappedTo: true
            }
          ];
        } else {
          // Check for horizontal/vertical alignment with snap points
          let closestHAlign = null;
          let closestVAlign = null;
          let minHDist = ALIGNMENT_SNAP_DIST;
          let minVDist = ALIGNMENT_SNAP_DIST;

          alignPoints.forEach(pt => {
            const hDist = Math.abs(snappedPos.y - pt.y);
            if (hDist < minHDist) {
              minHDist = hDist;
              closestHAlign = pt;
            }

            const vDist = Math.abs(snappedPos.x - pt.x);
            if (vDist < minVDist) {
              minVDist = vDist;
              closestVAlign = pt;
            }
          });

          if (closestHAlign || closestVAlign) {
            guidelines = [];
            if (closestHAlign && !bestSnap) {
              snappedPos.y = closestHAlign.y;
              guidelines.push({
                type: 'horizontal',
                y: closestHAlign.y,
                pointType: closestHAlign.type,
                alignedPoint: { x: closestHAlign.x, y: closestHAlign.y }
              });
            }
            if (closestVAlign && !bestSnap) {
              snappedPos.x = closestVAlign.x;
              guidelines.push({
                type: 'vertical',
                x: closestVAlign.x,
                pointType: closestVAlign.type,
                alignedPoint: { x: closestVAlign.x, y: closestVAlign.y }
              });
            }
          }
        }

        setSnapGuidelines(guidelines);
      } else {
        setSnapGuidelines(null);
        setActiveSnap(null);
      }

      setDrawEnd(snappedPos);
    }

    // Hover snap detection - show snaps before starting to draw
    if (!isDrawing && (tool === 'wall' || tool === 'door' || tool === 'window' || tool === 'line' || tool === 'polyline' || tool === 'dimension' || tool === 'hatch')) {
      const pos = getPointerPos(e);
      let snappedPos = snaps.grid ? { x: snap(pos.x), y: snap(pos.y) } : { ...pos };

      const POINT_SNAP_DIST = isMobile ? 50 : 20;
      const NEAREST_SNAP_DIST = isMobile ? 35 : 12;

      const walls = activeFloor?.walls || [];
      let bestSnap = null;
      let bestDist = POINT_SNAP_DIST;

      // Check endpoints and midpoints on walls
      walls.forEach(wall => {
        if (snaps.endpoint) {
          const dStart = distance(snappedPos, wall.start);
          if (dStart < bestDist) {
            bestDist = dStart;
            bestSnap = { type: 'endpoint', point: { ...wall.start }, wall };
          }
          const dEnd = distance(snappedPos, wall.end);
          if (dEnd < bestDist) {
            bestDist = dEnd;
            bestSnap = { type: 'endpoint', point: { ...wall.end }, wall };
          }
        }

        if (snaps.midpoint) {
          const mid = {
            x: (wall.start.x + wall.end.x) / 2,
            y: (wall.start.y + wall.end.y) / 2
          };
          const dMid = distance(snappedPos, mid);
          if (dMid < bestDist) {
            bestDist = dMid;
            bestSnap = { type: 'midpoint', point: mid, wall };
          }
        }
      });

      // Check endpoints and midpoints on annotation lines
      (activeFloor?.lines || []).forEach(line => {
        if (!line.start || !line.end) return;

        if (snaps.endpoint) {
          const dStart = distance(snappedPos, line.start);
          if (dStart < bestDist) {
            bestDist = dStart;
            bestSnap = { type: 'endpoint', point: { ...line.start }, line };
          }
          const dEnd = distance(snappedPos, line.end);
          if (dEnd < bestDist) {
            bestDist = dEnd;
            bestSnap = { type: 'endpoint', point: { ...line.end }, line };
          }
        }

        if (snaps.midpoint) {
          const mid = {
            x: (line.start.x + line.end.x) / 2,
            y: (line.start.y + line.end.y) / 2
          };
          const dMid = distance(snappedPos, mid);
          if (dMid < bestDist) {
            bestDist = dMid;
            bestSnap = { type: 'midpoint', point: mid, line };
          }
        }
      });

      // Check endpoints and midpoints on polylines
      (activeFloor?.polylines || []).forEach(polyline => {
        if (!polyline.points || polyline.points.length < 2) return;

        // Snap to polyline vertices
        if (snaps.endpoint) {
          polyline.points.forEach(pt => {
            const d = distance(snappedPos, pt);
            if (d < bestDist) {
              bestDist = d;
              bestSnap = { type: 'endpoint', point: { ...pt }, polyline };
            }
          });
        }

        // Snap to segment midpoints
        if (snaps.midpoint) {
          for (let i = 0; i < polyline.points.length - 1; i++) {
            const p1 = polyline.points[i];
            const p2 = polyline.points[i + 1];
            const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            const d = distance(snappedPos, mid);
            if (d < bestDist) {
              bestDist = d;
              bestSnap = { type: 'midpoint', point: mid, polyline };
            }
          }
          // If closed, check last-to-first segment midpoint
          if (polyline.closed && polyline.points.length >= 2) {
            const p1 = polyline.points[polyline.points.length - 1];
            const p2 = polyline.points[0];
            const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            const d = distance(snappedPos, mid);
            if (d < bestDist) {
              bestDist = d;
              bestSnap = { type: 'midpoint', point: mid, polyline };
            }
          }
        }
      });

      // Check nearest point on walls if no point snap found
      if (!bestSnap && snaps.nearest) {
        bestDist = NEAREST_SNAP_DIST;
        walls.forEach(wall => {
          const nearest = closestPointOnLine(snappedPos, wall.start, wall.end);
          const d = distance(snappedPos, nearest);
          if (d < bestDist) {
            bestDist = d;
            bestSnap = { type: 'nearest', point: nearest, wall };
          }
        });

        // Check nearest on annotation lines
        (activeFloor?.lines || []).forEach(line => {
          if (!line.start || !line.end) return;
          const nearest = closestPointOnLine(snappedPos, line.start, line.end);
          const d = distance(snappedPos, nearest);
          if (d < bestDist) {
            bestDist = d;
            bestSnap = { type: 'nearest', point: nearest, line };
          }
        });

        // Check nearest on polyline segments
        (activeFloor?.polylines || []).forEach(polyline => {
          if (!polyline.points || polyline.points.length < 2) return;
          for (let i = 0; i < polyline.points.length - 1; i++) {
            const nearest = closestPointOnLine(snappedPos, polyline.points[i], polyline.points[i + 1]);
            const d = distance(snappedPos, nearest);
            if (d < bestDist) {
              bestDist = d;
              bestSnap = { type: 'nearest', point: nearest, polyline };
            }
          }
          if (polyline.closed && polyline.points.length >= 2) {
            const nearest = closestPointOnLine(snappedPos, polyline.points[polyline.points.length - 1], polyline.points[0]);
            const d = distance(snappedPos, nearest);
            if (d < bestDist) {
              bestDist = d;
              bestSnap = { type: 'nearest', point: nearest, polyline };
            }
          }
        });
      }

      setActiveSnap(bestSnap);
      // No guidelines on hover, just the snap indicator
      setSnapGuidelines(null);
    }

    // Move tool preview
    if (tool === 'move' && moveBasePoint) {
      const pos = getPointerPos(e);
      const snappedPos = { x: snap(pos.x), y: snap(pos.y) };
      setMovePreviewPoint(snappedPos);
    }

    // Rotate tool preview
    if (tool === 'rotate' && rotateCenter && rotateStartAngle !== null) {
      const pos = getPointerPos(e);
      const newAngle = Math.atan2(pos.y - rotateCenter.y, pos.x - rotateCenter.x);
      setRotatePreviewAngle(newAngle);
    }

    // Handle grip dragging for wall endpoints
    if (activeGrip && activeGrip.type === 'wall' && tool === 'select') {
      const pos = getPointerPos(e);
      let snappedPos = snaps.grid ? { x: snap(pos.x), y: snap(pos.y) } : { ...pos };

      // Enhanced snap detection - same as wall drawing
      const POINT_SNAP_DIST = isMobile ? 50 : 20;
      const NEAREST_SNAP_DIST = isMobile ? 35 : 12;

      // Collect all snap candidates
      const snapCandidates = [];
      const walls = activeFloor?.walls || [];

      // Get the other endpoint of the wall being edited (to avoid snapping to self)
      // Use the stored original other endpoint for consistent guideline calculation
      const otherEndpoint = activeGrip.originalOtherEndpoint || (
        activeGrip.endpoint === 'start' ? activeGrip.wall.end : activeGrip.wall.start
      );

      walls.forEach(wall => {
        // Skip the wall being edited
        if (wall.id === activeGrip.wall.id) return;

        // Check if point is too close to the other endpoint of this wall
        const isNearOtherEnd = (pt) =>
          Math.abs(pt.x - otherEndpoint.x) < 5 && Math.abs(pt.y - otherEndpoint.y) < 5;

        // Endpoint snaps
        if (snaps.endpoint) {
          if (!isNearOtherEnd(wall.start)) {
            snapCandidates.push({
              x: wall.start.x,
              y: wall.start.y,
              type: 'endpoint',
              wall
            });
          }
          if (!isNearOtherEnd(wall.end)) {
            snapCandidates.push({
              x: wall.end.x,
              y: wall.end.y,
              type: 'endpoint',
              wall
            });
          }
        }

        // Midpoint snaps
        if (snaps.midpoint) {
          const mid = {
            x: (wall.start.x + wall.end.x) / 2,
            y: (wall.start.y + wall.end.y) / 2
          };
          if (!isNearOtherEnd(mid)) {
            snapCandidates.push({
              ...mid,
              type: 'midpoint',
              wall
            });
          }
        }

        // Nearest point snap - closest point on wall
        if (snaps.nearest) {
          const nearest = closestPointOnLine(snappedPos, wall.start, wall.end);
          if (!isNearOtherEnd(nearest)) {
            const d = distance(snappedPos, nearest);
            if (d < NEAREST_SNAP_DIST) {
              snapCandidates.push({
                ...nearest,
                type: 'nearest',
                wall,
                priority: 1 // Lower priority
              });
            }
          }
        }
      });

      // Find best snap candidate
      // Priority: endpoint/midpoint > nearest
      let bestSnap = null;
      let bestDist = POINT_SNAP_DIST;

      // First pass: check endpoints and midpoints (highest priority)
      snapCandidates
        .filter(c => c.type === 'endpoint' || c.type === 'midpoint')
        .forEach(candidate => {
          const d = distance(snappedPos, candidate);
          if (d < bestDist) {
            bestDist = d;
            bestSnap = candidate;
          }
        });

      // Second pass: check nearest if no point snap found
      if (!bestSnap) {
        bestDist = NEAREST_SNAP_DIST;
        snapCandidates
          .filter(c => c.type === 'nearest')
          .forEach(candidate => {
            const d = distance(snappedPos, candidate);
            if (d < bestDist) {
              bestDist = d;
              bestSnap = candidate;
            }
          });
      }

      // Apply the best snap if found
      if (bestSnap) {
        snappedPos = { x: bestSnap.x, y: bestSnap.y };
        setActiveSnap({
          type: bestSnap.type,
          point: { x: bestSnap.x, y: bestSnap.y },
          wall: bestSnap.wall
        });
      } else {
        setActiveSnap(null);
      }

      // Generate grip alignment guidelines
      const ALIGN_TOLERANCE = 12; // pixels tolerance for alignment
      const gripGuidelines = [];

      // Get original position (the endpoint we started dragging from)
      // Must use the stored originalPosition since activeGrip.wall gets updated during drag
      const originalPos = activeGrip.originalPosition;

      // Only apply alignment snapping after moving at least 20 pixels from original
      // This prevents the grip from being "stuck" at the start of a drag
      const gripMovement = originalPos ? Math.sqrt(
        Math.pow(snappedPos.x - originalPos.x, 2) +
        Math.pow(snappedPos.y - originalPos.y, 2)
      ) : 0;
      const MIN_MOVEMENT_FOR_SNAP = 20;

      // Only show guidelines if we have a valid original position and have moved enough
      if (originalPos && gripMovement > MIN_MOVEMENT_FOR_SNAP) {
        // Check horizontal alignment with original position
        if (Math.abs(snappedPos.y - originalPos.y) < ALIGN_TOLERANCE) {
          snappedPos.y = originalPos.y; // Snap to horizontal
          gripGuidelines.push({
            type: 'horizontal',
            y: originalPos.y,
            pointType: 'grip-align',
            alignedPoint: { ...originalPos },
            snappedTo: true
          });
        }

        // Check vertical alignment with original position
        if (Math.abs(snappedPos.x - originalPos.x) < ALIGN_TOLERANCE) {
          snappedPos.x = originalPos.x; // Snap to vertical
          gripGuidelines.push({
            type: 'vertical',
            x: originalPos.x,
            pointType: 'grip-align',
            alignedPoint: { ...originalPos },
            snappedTo: true
          });
        }
      }

      // Check alignment along the wall direction (extension line)
      // Use stored original wall angle for consistent guideline direction
      // Only apply after moving enough to avoid locking at start
      const originalWallAngle = activeGrip.originalWallAngle;

      if (originalWallAngle !== undefined && originalWallAngle !== null && gripMovement > MIN_MOVEMENT_FOR_SNAP) {
        // Use the stored original wall direction
        const dirX = Math.cos(originalWallAngle);
        const dirY = Math.sin(originalWallAngle);

        // Vector from other endpoint to cursor
        const toCursorX = snappedPos.x - otherEndpoint.x;
        const toCursorY = snappedPos.y - otherEndpoint.y;

        // Project cursor onto wall line
        const projection = toCursorX * dirX + toCursorY * dirY;
        const projectedX = otherEndpoint.x + projection * dirX;
        const projectedY = otherEndpoint.y + projection * dirY;

        // Distance from cursor to projected point (perpendicular distance to wall line)
        const perpDist = Math.sqrt(
          Math.pow(snappedPos.x - projectedX, 2) +
          Math.pow(snappedPos.y - projectedY, 2)
        );

        // If close to the wall line extension, snap to it and show guideline
        if (perpDist < ALIGN_TOLERANCE && perpDist > 0.1) {
          snappedPos.x = projectedX;
          snappedPos.y = projectedY;
          gripGuidelines.push({
            type: 'wall-extension',
            start: otherEndpoint,
            angle: originalWallAngle,
            pointType: 'wall-align',
            snappedTo: true
          });
        }
      }

      // Check alignment with the other endpoint (horizontal/vertical to other end)
      // Only apply after moving enough
      if (gripMovement > MIN_MOVEMENT_FOR_SNAP && Math.abs(snappedPos.y - otherEndpoint.y) < ALIGN_TOLERANCE) {
        // Only snap if not already snapped horizontally
        if (!gripGuidelines.some(g => g.type === 'horizontal')) {
          snappedPos.y = otherEndpoint.y; // Snap to horizontal alignment with other endpoint
          gripGuidelines.push({
            type: 'horizontal',
            y: otherEndpoint.y,
            pointType: 'other-endpoint',
            alignedPoint: otherEndpoint,
            snappedTo: true
          });
        }
      }
      if (gripMovement > MIN_MOVEMENT_FOR_SNAP && Math.abs(snappedPos.x - otherEndpoint.x) < ALIGN_TOLERANCE) {
        // Only snap if not already snapped vertically
        if (!gripGuidelines.some(g => g.type === 'vertical')) {
          snappedPos.x = otherEndpoint.x; // Snap to vertical alignment with other endpoint
          gripGuidelines.push({
            type: 'vertical',
            x: otherEndpoint.x,
            pointType: 'other-endpoint',
            alignedPoint: otherEndpoint,
            snappedTo: true
          });
        }
      }

      setSnapGuidelines(gripGuidelines.length > 0 ? gripGuidelines : null);
      setGripCursorPosition(snappedPos); // Track cursor position for guideline rendering

      // Calculate the updated wall
      const updatedWall = {
        ...activeGrip.wall,
        [activeGrip.endpoint]: snappedPos,
      };

      // Update the wall endpoint in floor data
      updateActiveFloor(f => ({
        ...f,
        walls: f.walls.map(w => {
          if (w.id === activeGrip.wall.id) {
            return updatedWall;
          }
          return w;
        }),
      }));

      // Update selectedItems to keep in sync
      setSelectedItems(prev => prev.map(s => {
        if (s.type === 'wall' && s.item?.id === activeGrip.wall.id) {
          return { ...s, item: updatedWall };
        }
        return s;
      }));

      // Update the activeGrip reference to the new wall position
      setActiveGrip(prev => ({
        ...prev,
        wall: updatedWall,
      }));
      return;
    }

    // Handle grip dragging for roof corner points
    if (activeGrip && activeGrip.type === 'roof' && tool === 'select') {
      const pos = getPointerPos(e);
      let snappedPos = snaps.grid ? { x: snap(pos.x), y: snap(pos.y) } : { ...pos };

      // Snap detection for roof corners
      const POINT_SNAP_DIST = isMobile ? 50 : 20;
      const walls = activeFloor?.walls || [];
      const roofs = activeFloor?.roofs || [];

      // Collect snap candidates from wall endpoints
      const snapCandidates = [];

      if (snaps.endpoint) {
        walls.forEach(wall => {
          snapCandidates.push({ x: wall.start.x, y: wall.start.y, type: 'endpoint', wall });
          snapCandidates.push({ x: wall.end.x, y: wall.end.y, type: 'endpoint', wall });
        });

        // Also snap to other roof corners
        roofs.forEach(roof => {
          if (roof.id === activeGrip.roof.id) return; // Skip current roof
          const pts = getRoofPoints(roof);
          pts.forEach((pt, i) => {
            snapCandidates.push({ x: pt.x, y: pt.y, type: 'endpoint', roof, pointIndex: i });
          });
        });

        // Snap to other corners of the same roof (except the one being dragged)
        const currentRoofPoints = getRoofPoints(activeGrip.roof);
        currentRoofPoints.forEach((pt, i) => {
          if (i === activeGrip.pointIndex) return; // Skip the point being dragged
          snapCandidates.push({ x: pt.x, y: pt.y, type: 'endpoint' });
        });
      }

      // Find best snap
      let bestSnap = null;
      let bestDist = POINT_SNAP_DIST;

      snapCandidates.forEach(candidate => {
        const d = distance(snappedPos, candidate);
        if (d < bestDist) {
          bestDist = d;
          bestSnap = candidate;
        }
      });

      if (bestSnap) {
        snappedPos = { x: bestSnap.x, y: bestSnap.y };
        setActiveSnap({
          type: bestSnap.type,
          point: { x: bestSnap.x, y: bestSnap.y },
        });
      } else {
        setActiveSnap(null);
      }

      // Update the roof point
      const currentPoints = getRoofPoints(activeGrip.roof);
      const newPoints = currentPoints.map((pt, i) =>
        i === activeGrip.pointIndex ? { x: snappedPos.x, y: snappedPos.y } : pt
      );

      const updatedRoof = {
        ...activeGrip.roof,
        points: newPoints,
      };

      // Update the roof in floor data
      updateActiveFloor(f => ({
        ...f,
        roofs: f.roofs.map(r => r.id === activeGrip.roof.id ? updatedRoof : r),
      }));

      // Update selectedItems to keep in sync
      setSelectedItems(prev => prev.map(s => {
        if (s.type === 'roof' && s.item?.id === activeGrip.roof.id) {
          return { ...s, item: updatedRoof };
        }
        return s;
      }));

      // Update the activeGrip reference
      setActiveGrip(prev => ({
        ...prev,
        roof: updatedRoof,
      }));
      return;
    }

    // Handle grip dragging for dimension endpoints
    if (activeGrip && activeGrip.type === 'dimension' && tool === 'select') {
      const pos = getPointerPos(e);
      let snappedPos = snaps.grid ? { x: snap(pos.x), y: snap(pos.y) } : { ...pos };

      // Snap to wall endpoints
      const POINT_SNAP_DIST = isMobile ? 50 : 20;
      const walls = activeFloor?.walls || [];
      const snapCandidates = [];

      if (snaps.endpoint) {
        walls.forEach(wall => {
          snapCandidates.push({ x: wall.start.x, y: wall.start.y, type: 'endpoint', wall });
          snapCandidates.push({ x: wall.end.x, y: wall.end.y, type: 'endpoint', wall });
        });
      }

      if (snaps.midpoint) {
        walls.forEach(wall => {
          const mid = {
            x: (wall.start.x + wall.end.x) / 2,
            y: (wall.start.y + wall.end.y) / 2
          };
          snapCandidates.push({ ...mid, type: 'midpoint', wall });

          // Door midpoint snaps
          const wallDoors = (activeFloor?.doors || []).filter(d => d.wallId === wall.id);
          if (wallDoors.length > 0) {
            const wallDx = wall.end.x - wall.start.x;
            const wallDy = wall.end.y - wall.start.y;
            const wallLength = Math.sqrt(wallDx * wallDx + wallDy * wallDy);

            wallDoors.forEach(door => {
              const doorCenterPos = door.position * wallLength;
              const doorMid = {
                x: wall.start.x + (doorCenterPos / wallLength) * wallDx,
                y: wall.start.y + (doorCenterPos / wallLength) * wallDy
              };
              snapCandidates.push({ ...doorMid, type: 'door-midpoint', wall, door });
            });
          }

          // Window midpoint snaps
          const wallWindows = (activeFloor?.windows || []).filter(w => w.wallId === wall.id);
          if (wallWindows.length > 0) {
            const wallDx = wall.end.x - wall.start.x;
            const wallDy = wall.end.y - wall.start.y;
            const wallLength = Math.sqrt(wallDx * wallDx + wallDy * wallDy);

            wallWindows.forEach(window => {
              const windowCenterPos = window.position * wallLength;
              const windowMid = {
                x: wall.start.x + (windowCenterPos / wallLength) * wallDx,
                y: wall.start.y + (windowCenterPos / wallLength) * wallDy
              };
              snapCandidates.push({ ...windowMid, type: 'window-midpoint', wall, window });
            });
          }
        });
      }

      // Find best snap
      let bestSnap = null;
      let bestDist = POINT_SNAP_DIST;

      snapCandidates.forEach(candidate => {
        const d = distance(snappedPos, candidate);
        if (d < bestDist) {
          bestDist = d;
          bestSnap = candidate;
        }
      });

      if (bestSnap) {
        snappedPos = { x: bestSnap.x, y: bestSnap.y };
        setActiveSnap({
          type: bestSnap.type,
          point: { x: bestSnap.x, y: bestSnap.y },
        });
      } else {
        setActiveSnap(null);
      }

      // Update the dimension endpoint
      const updatedDimension = {
        ...activeGrip.dimension,
        [activeGrip.endpoint]: { x: snappedPos.x, y: snappedPos.y },
      };

      updateActiveFloor(f => ({
        ...f,
        dimensions: (f.dimensions || []).map(d =>
          d.id === activeGrip.dimension.id ? updatedDimension : d
        ),
      }));

      // Update selectedItems to keep in sync
      setSelectedItems(prev => prev.map(s => {
        if (s.type === 'dimension' && s.item?.id === activeGrip.dimension.id) {
          return { ...s, item: updatedDimension };
        }
        return s;
      }));

      // Update activeGrip reference
      setActiveGrip(prev => ({
        ...prev,
        dimension: updatedDimension,
      }));
      return;
    }

    // Handle grip dragging for dimension offset (diamond grip at midpoint)
    if (activeGrip && activeGrip.type === 'dimension-offset' && tool === 'select') {
      const pos = getPointerPos(e);
      const dim = activeGrip.dimension;

      // Calculate perpendicular distance from cursor to the reference line (start to end)
      const dx = dim.end.x - dim.start.x;
      const dy = dim.end.y - dim.start.y;
      const lineLength = Math.sqrt(dx * dx + dy * dy);

      if (lineLength > 0) {
        // Perpendicular unit vector (pointing in offset direction)
        const perpX = -dy / lineLength;
        const perpY = dx / lineLength;

        // Vector from start to cursor
        const toCursorX = pos.x - dim.start.x;
        const toCursorY = pos.y - dim.start.y;

        // Project onto perpendicular to get new offset
        let newOffset = toCursorX * perpX + toCursorY * perpY;

        // Snap to grid
        if (snaps.grid) {
          newOffset = snap(newOffset);
        }

        // Snap to offsets of nearby dimensions
        const dimensions = activeFloor?.dimensions || [];
        const OFFSET_SNAP_DIST = 15;

        dimensions.forEach(otherDim => {
          if (otherDim.id === dim.id) return;
          const otherOffset = otherDim.offset || 30;
          if (Math.abs(newOffset - otherOffset) < OFFSET_SNAP_DIST) {
            newOffset = otherOffset;
            setActiveSnap({
              type: 'offset-align',
              point: { x: pos.x, y: pos.y },
            });
          }
        });

        // Update the dimension offset
        const updatedDimension = {
          ...dim,
          offset: newOffset,
        };

        updateActiveFloor(f => ({
          ...f,
          dimensions: (f.dimensions || []).map(d =>
            d.id === dim.id ? updatedDimension : d
          ),
        }));

        // Update selectedItems to keep in sync
        setSelectedItems(prev => prev.map(s => {
          if (s.type === 'dimension' && s.item?.id === dim.id) {
            return { ...s, item: updatedDimension };
          }
          return s;
        }));

        // Update activeGrip reference
        setActiveGrip(prev => ({
          ...prev,
          dimension: updatedDimension,
        }));
      }
      return;
    }

    // Handle grip dragging for annotation line endpoints
    if (activeGrip && activeGrip.type === 'line' && tool === 'select') {
      const pos = getPointerPos(e);
      let snappedPos = snaps.grid ? { x: snap(pos.x), y: snap(pos.y) } : { ...pos };

      // Snap to wall endpoints
      const POINT_SNAP_DIST = isMobile ? 50 : 20;
      const walls = activeFloor?.walls || [];
      const snapCandidates = [];

      if (snaps.endpoint) {
        walls.forEach(wall => {
          snapCandidates.push({ x: wall.start.x, y: wall.start.y, type: 'endpoint', wall });
          snapCandidates.push({ x: wall.end.x, y: wall.end.y, type: 'endpoint', wall });
        });
      }

      // Find best snap
      let bestSnap = null;
      let bestDist = POINT_SNAP_DIST;

      snapCandidates.forEach(candidate => {
        const d = distance(snappedPos, candidate);
        if (d < bestDist) {
          bestDist = d;
          bestSnap = candidate;
        }
      });

      if (bestSnap) {
        snappedPos = { x: bestSnap.x, y: bestSnap.y };
        setActiveSnap({
          type: bestSnap.type,
          point: { x: bestSnap.x, y: bestSnap.y },
        });
      } else {
        setActiveSnap(null);
      }

      // Update the line endpoint
      const updatedLine = {
        ...activeGrip.line,
        [activeGrip.endpoint]: { x: snappedPos.x, y: snappedPos.y },
      };

      updateActiveFloor(f => ({
        ...f,
        lines: (f.lines || []).map(l =>
          l.id === activeGrip.line.id ? updatedLine : l
        ),
      }));

      // Update selectedItems to keep in sync
      setSelectedItems(prev => prev.map(s => {
        if (s.type === 'line' && s.item?.id === activeGrip.line.id) {
          return { ...s, item: updatedLine };
        }
        return s;
      }));

      // Update activeGrip reference
      setActiveGrip(prev => ({
        ...prev,
        line: updatedLine,
      }));
      return;
    }

    // Handle grip dragging for polyline vertices
    if (activeGrip && activeGrip.type === 'polyline' && tool === 'select') {
      const pos = getPointerPos(e);
      let snappedPos = snaps.grid ? { x: snap(pos.x), y: snap(pos.y) } : { ...pos };

      // Snap to wall endpoints and other polyline vertices
      const POINT_SNAP_DIST = isMobile ? 50 : 20;
      const walls = activeFloor?.walls || [];
      const snapCandidates = [];

      if (snaps.endpoint) {
        walls.forEach(wall => {
          snapCandidates.push({ x: wall.start.x, y: wall.start.y, type: 'endpoint', wall });
          snapCandidates.push({ x: wall.end.x, y: wall.end.y, type: 'endpoint', wall });
        });

        // Also snap to other polyline vertices (not the one being dragged)
        (activeFloor?.polylines || []).forEach(pl => {
          if (!pl.points) return;
          pl.points.forEach((pt, idx) => {
            // Skip the point being dragged
            if (pl.id === activeGrip.polyline.id && idx === activeGrip.pointIndex) return;
            snapCandidates.push({ x: pt.x, y: pt.y, type: 'endpoint' });
          });
        });
      }

      // Find best snap
      let bestSnap = null;
      let bestDist = POINT_SNAP_DIST;

      snapCandidates.forEach(candidate => {
        const d = distance(snappedPos, candidate);
        if (d < bestDist) {
          bestDist = d;
          bestSnap = candidate;
        }
      });

      if (bestSnap) {
        snappedPos = { x: bestSnap.x, y: bestSnap.y };
        setActiveSnap({
          type: bestSnap.type,
          point: { x: bestSnap.x, y: bestSnap.y },
        });
      } else {
        setActiveSnap(null);
      }

      // Update the polyline vertex
      const newPoints = activeGrip.polyline.points.map((pt, idx) =>
        idx === activeGrip.pointIndex ? { x: snappedPos.x, y: snappedPos.y } : pt
      );

      const updatedPolyline = {
        ...activeGrip.polyline,
        points: newPoints,
      };

      updateActiveFloor(f => ({
        ...f,
        polylines: (f.polylines || []).map(pl =>
          pl.id === activeGrip.polyline.id ? updatedPolyline : pl
        ),
      }));

      // Update selectedItems to keep in sync
      setSelectedItems(prev => prev.map(s => {
        if (s.type === 'polyline' && s.item?.id === activeGrip.polyline.id) {
          return { ...s, item: updatedPolyline };
        }
        return s;
      }));

      // Update activeGrip reference
      setActiveGrip(prev => ({
        ...prev,
        polyline: updatedPolyline,
      }));
      return;
    }

    // Handle grip dragging for hatch vertices
    if (activeGrip && activeGrip.type === 'hatch' && tool === 'select') {
      const pos = getPointerPos(e);
      let snappedPos = snaps.grid ? { x: snap(pos.x), y: snap(pos.y) } : { ...pos };

      // Snap to wall endpoints and other vertices
      const POINT_SNAP_DIST = isMobile ? 50 : 20;
      const walls = activeFloor?.walls || [];
      const snapCandidates = [];

      if (snaps.endpoint) {
        walls.forEach(wall => {
          snapCandidates.push({ x: wall.start.x, y: wall.start.y, type: 'endpoint', wall });
          snapCandidates.push({ x: wall.end.x, y: wall.end.y, type: 'endpoint', wall });
        });

        // Also snap to other hatch vertices (not the one being dragged)
        (activeFloor?.hatches || []).forEach(h => {
          if (!h.points) return;
          h.points.forEach((pt, idx) => {
            // Skip the point being dragged
            if (h.id === activeGrip.hatch.id && idx === activeGrip.pointIndex) return;
            snapCandidates.push({ x: pt.x, y: pt.y, type: 'endpoint' });
          });
        });

        // Also snap to polyline vertices
        (activeFloor?.polylines || []).forEach(pl => {
          if (!pl.points) return;
          pl.points.forEach(pt => {
            snapCandidates.push({ x: pt.x, y: pt.y, type: 'endpoint' });
          });
        });
      }

      // Find best snap
      let bestSnap = null;
      let bestDist = POINT_SNAP_DIST;

      snapCandidates.forEach(candidate => {
        const d = distance(snappedPos, candidate);
        if (d < bestDist) {
          bestDist = d;
          bestSnap = candidate;
        }
      });

      if (bestSnap) {
        snappedPos = { x: bestSnap.x, y: bestSnap.y };
        setActiveSnap({
          type: bestSnap.type,
          point: { x: bestSnap.x, y: bestSnap.y },
        });
      } else {
        setActiveSnap(null);
      }

      // Update the hatch vertex
      const newPoints = activeGrip.hatch.points.map((pt, idx) =>
        idx === activeGrip.pointIndex ? { x: snappedPos.x, y: snappedPos.y } : pt
      );

      const updatedHatch = {
        ...activeGrip.hatch,
        points: newPoints,
      };

      updateActiveFloor(f => ({
        ...f,
        hatches: (f.hatches || []).map(h =>
          h.id === activeGrip.hatch.id ? updatedHatch : h
        ),
      }));

      // Update selectedItems to keep in sync
      setSelectedItems(prev => prev.map(s => {
        if (s.type === 'hatch' && s.item?.id === activeGrip.hatch.id) {
          return { ...s, item: updatedHatch };
        }
        return s;
      }));

      // Update activeGrip reference
      setActiveGrip(prev => ({
        ...prev,
        hatch: updatedHatch,
      }));
      return;
    }

    // Handle grip dragging for room vertices
    if (activeGrip && activeGrip.type === 'room' && tool === 'select') {
      const pos = getPointerPos(e);
      let snappedPos = snaps.grid ? { x: snap(pos.x), y: snap(pos.y) } : { ...pos };

      // Snap to wall endpoints and other vertices
      const POINT_SNAP_DIST = isMobile ? 50 : 20;
      const walls = activeFloor?.walls || [];
      const snapCandidates = [];

      if (snaps.endpoint) {
        walls.forEach(wall => {
          snapCandidates.push({ x: wall.start.x, y: wall.start.y, type: 'endpoint', wall });
          snapCandidates.push({ x: wall.end.x, y: wall.end.y, type: 'endpoint', wall });
        });

        // Also snap to other room vertices (not the one being dragged)
        (activeFloor?.rooms || []).forEach(r => {
          if (!r.points) return;
          r.points.forEach((pt, idx) => {
            // Skip the point being dragged
            if (r.id === activeGrip.room.id && idx === activeGrip.pointIndex) return;
            snapCandidates.push({ x: pt.x, y: pt.y, type: 'endpoint' });
          });
        });

        // Also snap to hatch vertices
        (activeFloor?.hatches || []).forEach(h => {
          if (!h.points) return;
          h.points.forEach(pt => {
            snapCandidates.push({ x: pt.x, y: pt.y, type: 'endpoint' });
          });
        });

        // Also snap to polyline vertices
        (activeFloor?.polylines || []).forEach(pl => {
          if (!pl.points) return;
          pl.points.forEach(pt => {
            snapCandidates.push({ x: pt.x, y: pt.y, type: 'endpoint' });
          });
        });
      }

      // Find best snap
      let bestSnap = null;
      let bestDist = POINT_SNAP_DIST;

      snapCandidates.forEach(candidate => {
        const d = distance(snappedPos, candidate);
        if (d < bestDist) {
          bestDist = d;
          bestSnap = candidate;
        }
      });

      if (bestSnap) {
        snappedPos = { x: bestSnap.x, y: bestSnap.y };
        setActiveSnap({
          type: bestSnap.type,
          point: { x: bestSnap.x, y: bestSnap.y },
        });
      } else {
        setActiveSnap(null);
      }

      // Update the room vertex
      const newPoints = activeGrip.room.points.map((pt, idx) =>
        idx === activeGrip.pointIndex ? { x: snappedPos.x, y: snappedPos.y } : pt
      );

      const updatedRoom = {
        ...activeGrip.room,
        points: newPoints,
      };

      updateActiveFloor(f => ({
        ...f,
        rooms: (f.rooms || []).map(r =>
          r.id === activeGrip.room.id ? updatedRoom : r
        ),
      }));

      // Update selectedItems to keep in sync
      setSelectedItems(prev => prev.map(s => {
        if (s.type === 'room' && s.item?.id === activeGrip.room.id) {
          return { ...s, item: updatedRoom };
        }
        return s;
      }));

      // Update activeGrip reference
      setActiveGrip(prev => ({
        ...prev,
        room: updatedRoom,
      }));
      return;
    }

    if (dragItem && tool === 'select') {
      const pos = getPointerPos(e);
      const itemType = selectedItems[0]?.type;

      if (itemType === 'wall') {
        // Move entire wall by dragging - smooth movement with visual snap feedback
        const deltaX = pos.x - dragOffset.x;
        const deltaY = pos.y - dragOffset.y;

        // Get the current wall from dragItem and apply delta
        const currentWall = dragItem;
        const newStart = {
          x: currentWall.start.x + deltaX,
          y: currentWall.start.y + deltaY
        };
        const newEnd = {
          x: currentWall.end.x + deltaX,
          y: currentWall.end.y + deltaY
        };

        // Check for snap points near the wall endpoints (for visual feedback)
        const SNAP_DIST = isMobile ? 40 : 20;
        const walls = activeFloor?.walls || [];
        let bestSnap = null;
        let bestDist = SNAP_DIST;

        // Check both endpoints of the dragged wall against other wall endpoints
        walls.forEach(wall => {
          if (wall.id === currentWall.id) return;

          // Check snap to endpoints
          if (snaps.endpoint) {
            [wall.start, wall.end].forEach(pt => {
              // Check against new start
              const dStart = distance(newStart, pt);
              if (dStart < bestDist) {
                bestDist = dStart;
                bestSnap = { type: 'endpoint', point: pt, dragEndpoint: 'start' };
              }
              // Check against new end
              const dEnd = distance(newEnd, pt);
              if (dEnd < bestDist) {
                bestDist = dEnd;
                bestSnap = { type: 'endpoint', point: pt, dragEndpoint: 'end' };
              }
            });
          }

          // Check snap to midpoints
          if (snaps.midpoint) {
            const mid = { x: (wall.start.x + wall.end.x) / 2, y: (wall.start.y + wall.end.y) / 2 };
            const dStart = distance(newStart, mid);
            if (dStart < bestDist) {
              bestDist = dStart;
              bestSnap = { type: 'midpoint', point: mid, dragEndpoint: 'start' };
            }
            const dEnd = distance(newEnd, mid);
            if (dEnd < bestDist) {
              bestDist = dEnd;
              bestSnap = { type: 'midpoint', point: mid, dragEndpoint: 'end' };
            }
          }
        });

        // Show snap indicator during drag
        if (bestSnap) {
          setActiveSnap({
            type: bestSnap.type,
            point: bestSnap.point,
            dragEndpoint: bestSnap.dragEndpoint
          });
        } else {
          setActiveSnap(null);
        }

        // Generate alignment guidelines for wall dragging
        const ALIGN_TOLERANCE = 12;
        const dragGuidelines = [];
        let snappedStart = { ...newStart };
        let snappedEnd = { ...newEnd };

        // Only apply alignment snapping after moving at least 20 pixels from original
        // This prevents the wall from being "stuck" at the start of a drag
        const totalMovement = dragOriginalPositions ? Math.sqrt(
          Math.pow(newStart.x - dragOriginalPositions.start.x, 2) +
          Math.pow(newStart.y - dragOriginalPositions.start.y, 2)
        ) : 0;
        const MIN_MOVEMENT_FOR_SNAP = 20;

        if (dragOriginalPositions && totalMovement > MIN_MOVEMENT_FOR_SNAP) {
          const origStart = dragOriginalPositions.start;
          const origEnd = dragOriginalPositions.end;

          // Check horizontal alignment for start point
          if (Math.abs(newStart.y - origStart.y) < ALIGN_TOLERANCE) {
            const snapDelta = origStart.y - newStart.y;
            snappedStart.y = origStart.y;
            snappedEnd.y = newEnd.y + snapDelta;
            dragGuidelines.push({
              type: 'horizontal',
              y: origStart.y,
              pointType: 'grip-align',
              alignedPoint: { ...origStart },
              snappedTo: true
            });
          }

          // Check vertical alignment for start point
          if (Math.abs(newStart.x - origStart.x) < ALIGN_TOLERANCE) {
            const snapDelta = origStart.x - newStart.x;
            snappedStart.x = origStart.x;
            snappedEnd.x = newEnd.x + snapDelta;
            dragGuidelines.push({
              type: 'vertical',
              x: origStart.x,
              pointType: 'grip-align',
              alignedPoint: { ...origStart },
              snappedTo: true
            });
          }

          // Check horizontal alignment for end point (only if start didn't snap horizontally)
          if (!dragGuidelines.some(g => g.type === 'horizontal') && Math.abs(newEnd.y - origEnd.y) < ALIGN_TOLERANCE) {
            const snapDelta = origEnd.y - newEnd.y;
            snappedStart.y = newStart.y + snapDelta;
            snappedEnd.y = origEnd.y;
            dragGuidelines.push({
              type: 'horizontal',
              y: origEnd.y,
              pointType: 'other-endpoint',
              alignedPoint: { ...origEnd },
              snappedTo: true
            });
          }

          // Check vertical alignment for end point (only if start didn't snap vertically)
          if (!dragGuidelines.some(g => g.type === 'vertical') && Math.abs(newEnd.x - origEnd.x) < ALIGN_TOLERANCE) {
            const snapDelta = origEnd.x - newEnd.x;
            snappedStart.x = newStart.x + snapDelta;
            snappedEnd.x = origEnd.x;
            dragGuidelines.push({
              type: 'vertical',
              x: origEnd.x,
              pointType: 'other-endpoint',
              alignedPoint: { ...origEnd },
              snappedTo: true
            });
          }
        }

        setSnapGuidelines(dragGuidelines.length > 0 ? dragGuidelines : null);
        setGripCursorPosition(snappedStart); // Use start point for guideline rendering

        const updatedWall = { ...currentWall, start: snappedStart, end: snappedEnd };

        updateActiveFloor(f => ({
          ...f,
          walls: f.walls.map(w => w.id === currentWall.id ? updatedWall : w)
        }));

        // Update selectedItems to keep in sync
        setSelectedItems(prev => prev.map(s => {
          if (s.type === 'wall' && s.item?.id === currentWall.id) {
            return { ...s, item: updatedWall };
          }
          return s;
        }));

        // Update drag reference for next move
        setDragOffset({ x: pos.x, y: pos.y });
        setDragItem(updatedWall);
      } else if (itemType === 'furniture') {
        // Move furniture - smooth movement with visual snap feedback
        const newX = pos.x - dragOffset.x;
        const newY = pos.y - dragOffset.y;

        // Check for snap points (furniture center to wall endpoints/midpoints)
        const SNAP_DIST = isMobile ? 40 : 20;
        const walls = activeFloor?.walls || [];
        let bestSnap = null;
        let bestDist = SNAP_DIST;

        walls.forEach(wall => {
          if (snaps.endpoint) {
            [wall.start, wall.end].forEach(pt => {
              const d = distance({ x: newX, y: newY }, pt);
              if (d < bestDist) {
                bestDist = d;
                bestSnap = { type: 'endpoint', point: pt };
              }
            });
          }
          if (snaps.midpoint) {
            const mid = { x: (wall.start.x + wall.end.x) / 2, y: (wall.start.y + wall.end.y) / 2 };
            const d = distance({ x: newX, y: newY }, mid);
            if (d < bestDist) {
              bestDist = d;
              bestSnap = { type: 'midpoint', point: mid };
            }
          }
        });

        if (bestSnap) {
          setActiveSnap({ type: bestSnap.type, point: bestSnap.point });
        } else {
          setActiveSnap(null);
        }
        updateActiveFloor(f => ({
          ...f,
          furniture: f.furniture.map(furn =>
            furn.id === dragItem.id ? { ...furn, x: newX, y: newY } : furn
          )
        }));
      } else if (itemType === 'door' || itemType === 'window') {
        // Slide along wall
        const item = itemType === 'door'
          ? activeFloor.doors?.find(d => d.id === dragItem.id)
          : activeFloor.windows?.find(w => w.id === dragItem.id);
        const wall = activeFloor.walls?.find(w => w.id === item?.wallId);

        if (wall && item) {
          const dx = wall.end.x - wall.start.x;
          const dy = wall.end.y - wall.start.y;
          const wallLength = Math.sqrt(dx * dx + dy * dy);
          const t = ((pos.x - wall.start.x) * dx + (pos.y - wall.start.y) * dy) / (wallLength * wallLength);
          const newPosition = Math.max(0.05, Math.min(0.95, t));

          const collection = itemType === 'door' ? 'doors' : 'windows';
          updateActiveFloor(f => ({
            ...f,
            [collection]: f[collection].map(i =>
              i.id === dragItem.id ? { ...i, position: newPosition } : i
            )
          }));

          // Also update selectedItems so TempDimensionEditor updates in real-time
          setSelectedItems(prev => prev.map(s => {
            if (s.type === itemType && s.item?.id === dragItem.id) {
              return { ...s, item: { ...s.item, position: newPosition } };
            }
            return s;
          }));
        }
      } else if (itemType === 'text') {
        // Move text annotation
        const newX = pos.x - dragOffset.x;
        const newY = pos.y - dragOffset.y;

        const updatedText = { ...dragItem, position: { x: newX, y: newY } };

        updateActiveFloor(f => ({
          ...f,
          texts: (f.texts || []).map(t =>
            t.id === dragItem.id ? updatedText : t
          )
        }));

        // Update selectedItems to keep in sync
        setSelectedItems(prev => prev.map(s => {
          if (s.type === 'text' && s.item?.id === dragItem.id) {
            return { ...s, item: updatedText };
          }
          return s;
        }));
      }
      // Note: dimensions and lines use grip editing for endpoints, not whole-item dragging
    }
  }, [isPanning, isDrawing, drawStart, tool, getPointerPos, snap, snapAngle, dragItem, selectedItems, dragOffset, activeFloor, updateActiveFloor, pinchStart, setScale, setOffset, offset, canvasRef, isMobile, activeGrip, setSelectedItems, snaps, polylinePoints, hatchPoints, roomPoints]);

  // Handle pointer up
  const handlePointerUp = useCallback((e) => {
    if (isPanning) {
      setIsPanning(false);
    }

    // Clear pinch state
    if (pinchStart) {
      setPinchStart(null);
    }

    if (isDrawing && drawStart && drawEnd) {
      const dx = drawEnd.x - drawStart.x;
      const dy = drawEnd.y - drawStart.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (tool === 'wall' && length > 10) {
        // Create wall
        const newWall = {
          id: generateId(),
          start: { ...drawStart },
          end: { ...drawEnd },
          type: wallType,
          height: WALL_THICKNESS_OPTIONS[wallType]?.defaultHeight || 96,
        };
        updateActiveFloor(f => ({ ...f, walls: [...f.walls, newWall] }));
        setSelectedItems([{ type: 'wall', item: newWall }]);
        setSelectionSource?.('draw');
      } else if (tool === 'roof' && Math.abs(dx) > 10 && Math.abs(dy) > 10) {
        // Create roof with points array (clockwise from top-left)
        const minX = Math.min(drawStart.x, drawEnd.x);
        const minY = Math.min(drawStart.y, drawEnd.y);
        const maxX = Math.max(drawStart.x, drawEnd.x);
        const maxY = Math.max(drawStart.y, drawEnd.y);
        const newRoof = {
          id: generateId(),
          points: [
            { x: minX, y: minY },  // Top-left
            { x: maxX, y: minY },  // Top-right
            { x: maxX, y: maxY },  // Bottom-right
            { x: minX, y: maxY },  // Bottom-left
          ],
          type: 'gable',
          pitch: '6:12',
          ridgeDirection: Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical',
          overhang: 12,
        };
        updateActiveFloor(f => ({ ...f, roofs: [...(f.roofs || []), newRoof] }));
        setSelectedItems([{ type: 'roof', item: newRoof }]);
        setSelectionSource?.('draw');
      } else if (tool === 'dimension' && length > 10) {
        // Create dimension line
        const newDimension = {
          id: generateId(),
          start: { ...drawStart },
          end: { ...drawEnd },
          offset: 30, // Offset from the line being measured
          style: 'architectural',
        };
        updateActiveFloor(f => ({ ...f, dimensions: [...(f.dimensions || []), newDimension] }));
        setSelectedItems([{ type: 'dimension', item: newDimension }]);
        setSelectionSource?.('draw');
      } else if (tool === 'line' && length > 5) {
        // Create annotation line
        const newLine = {
          id: generateId(),
          start: { ...drawStart },
          end: { ...drawEnd },
          lineType: 'solid',
          color: '#00c8ff',
          lineWidth: 1,
        };
        updateActiveFloor(f => ({ ...f, lines: [...(f.lines || []), newLine] }));
        setSelectedItems([{ type: 'line', item: newLine }]);
        setSelectionSource?.('draw');
      } else if (tool === 'polyline') {
        // Don't finish polyline on mouse up - wait for double-click or Escape
        // Just keep the drawing state active
        return;
      }

      setIsDrawing(false);
      setDrawStart(null);
      setDrawEnd(null);
      setSnapGuidelines(null);
      setActiveSnap(null);
      setPolarAngle(null);
      setStartingLineAngle(null);
    }

    // Snap items when drag ends - either to snap point or grid
    if (dragItem) {
      const itemType = selectedItems[0]?.type;

      if (itemType === 'wall') {
        const wall = activeFloor?.walls?.find(w => w.id === dragItem.id);
        if (wall) {
          let snappedStart = { ...wall.start };
          let snappedEnd = { ...wall.end };

          // If we have an active snap point, snap to it
          if (activeSnap?.point && activeSnap?.dragEndpoint) {
            const snapPt = activeSnap.point;
            if (activeSnap.dragEndpoint === 'start') {
              // Snap start endpoint - move entire wall to align
              const offsetX = snapPt.x - wall.start.x;
              const offsetY = snapPt.y - wall.start.y;
              snappedStart = { x: snapPt.x, y: snapPt.y };
              snappedEnd = { x: wall.end.x + offsetX, y: wall.end.y + offsetY };
            } else {
              // Snap end endpoint - move entire wall to align
              const offsetX = snapPt.x - wall.end.x;
              const offsetY = snapPt.y - wall.end.y;
              snappedStart = { x: wall.start.x + offsetX, y: wall.start.y + offsetY };
              snappedEnd = { x: snapPt.x, y: snapPt.y };
            }
          } else if (gridSize !== 'off') {
            // Fall back to grid snapping
            snappedStart = { x: snap(wall.start.x), y: snap(wall.start.y) };
            snappedEnd = { x: snap(wall.end.x), y: snap(wall.end.y) };
          }

          const updatedWall = { ...wall, start: snappedStart, end: snappedEnd };

          updateActiveFloor(f => ({
            ...f,
            walls: f.walls.map(w => w.id === wall.id ? updatedWall : w)
          }));

          setSelectedItems(prev => prev.map(s => {
            if (s.type === 'wall' && s.item?.id === wall.id) {
              return { ...s, item: updatedWall };
            }
            return s;
          }));
        }
      } else if (itemType === 'furniture') {
        const furniture = activeFloor?.furniture?.find(f => f.id === dragItem.id);
        if (furniture) {
          let snappedX = furniture.x;
          let snappedY = furniture.y;

          // If we have an active snap point, snap to it
          if (activeSnap?.point) {
            snappedX = activeSnap.point.x;
            snappedY = activeSnap.point.y;
          } else if (gridSize !== 'off') {
            // Fall back to grid snapping
            snappedX = snap(furniture.x);
            snappedY = snap(furniture.y);
          }

          updateActiveFloor(f => ({
            ...f,
            furniture: f.furniture.map(furn =>
              furn.id === furniture.id ? { ...furn, x: snappedX, y: snappedY } : furn
            )
          }));
        }
      }
    }

    setDragItem(null);
    setDragOriginalPositions(null);
    // Clear active snap and guidelines when dragging ends
    if (activeGrip || dragItem) {
      setActiveSnap(null);
      setSnapGuidelines(null);
      setGripCursorPosition(null);
    }
    setActiveGrip(null);
  }, [isPanning, isDrawing, drawStart, drawEnd, tool, wallType, updateActiveFloor, setSelectedItems, pinchStart, activeGrip, dragItem, selectedItems, gridSize, snap, activeFloor, activeSnap]);

  // Handle double-click - finish polyline
  const handleDoubleClick = useCallback((e) => {
    if (tool === 'polyline' && polylinePoints.length >= 2) {
      // Finish the polyline
      const newPolyline = {
        id: generateId(),
        points: [...polylinePoints],
        lineType: 'solid',
        color: '#00c8ff',
        lineWidth: 1,
        closed: false,
      };
      updateActiveFloor(f => ({ ...f, polylines: [...(f.polylines || []), newPolyline] }));
      setSelectedItems([{ type: 'polyline', item: newPolyline }]);
      setSelectionSource?.('draw');

      // Reset polyline state
      setPolylinePoints([]);
      setIsDrawing(false);
      setDrawEnd(null);
      setSnapGuidelines(null);
      setActiveSnap(null);
    }
  }, [tool, polylinePoints, updateActiveFloor, setSelectedItems, setSelectionSource]);

  // Cancel polyline drawing (call this from parent on Escape key)
  const cancelPolyline = useCallback(() => {
    if (tool === 'polyline' && polylinePoints.length > 0) {
      setPolylinePoints([]);
      setIsDrawing(false);
      setDrawEnd(null);
      setSnapGuidelines(null);
      setActiveSnap(null);
    }
  }, [tool, polylinePoints]);

  // Cancel hatch drawing (call this from parent on Escape key)
  const cancelHatch = useCallback(() => {
    if (tool === 'hatch' && hatchPoints.length > 0) {
      setHatchPoints([]);
      setIsDrawing(false);
      setDrawEnd(null);
      setSnapGuidelines(null);
      setActiveSnap(null);
    }
  }, [tool, hatchPoints]);

  // Cancel room drawing (call this from parent on Escape key)
  const cancelRoom = useCallback(() => {
    if (tool === 'room' && roomPoints.length > 0) {
      setRoomPoints([]);
      setIsDrawing(false);
      setDrawEnd(null);
      setSnapGuidelines(null);
      setActiveSnap(null);
    }
  }, [tool, roomPoints]);

  return {
    // State
    isDrawing,
    drawStart,
    drawEnd,
    isPanning,
    dragItem,
    activeGrip,

    // Polyline state
    polylinePoints,

    // Hatch state
    hatchPoints,

    // Room state
    roomPoints,

    // Move tool state
    moveBasePoint,
    movePreviewPoint,

    // Rotate tool state
    rotateCenter,
    rotateStartAngle,
    rotatePreviewAngle,

    // Snap state for visual feedback
    snapGuidelines,
    activeSnap,

    // Polar tracking state
    polarAngle,
    startingLineAngle,

    // Grip editing cursor position (for guideline rendering)
    gripCursorPosition,

    // Event handlers
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
    cancelPolyline,
    cancelHatch,
    cancelRoom,

    // Utilities
    screenToCanvas,
    snap,
    findItemAt,
    findNearestWall,
  };
};

export default useCanvasInteraction;
