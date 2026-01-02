// Geometry utilities

// Calculate distance between two points
export const distance = (p1, p2) => Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

// Calculate angle between two points (in radians)
export const angle = (p1, p2) => Math.atan2(p2.y - p1.y, p2.x - p1.x);

// Calculate angle in degrees
export const angleDegrees = (p1, p2) => angle(p1, p2) * 180 / Math.PI;

// Normalize angle to 0-360 range
export const normalizeAngle = (degrees) => {
  while (degrees < 0) degrees += 360;
  while (degrees >= 360) degrees -= 360;
  return degrees;
};

// Snap angle to nearest increment
export const snapAngle = (degrees, increment) => {
  if (increment <= 0) return degrees;
  return Math.round(degrees / increment) * increment;
};

// Get point on line at distance t (0-1) from start to end
export const lerp = (p1, p2, t) => ({
  x: p1.x + (p2.x - p1.x) * t,
  y: p1.y + (p2.y - p1.y) * t,
});

// Get perpendicular vector (normalized)
export const perpendicular = (p1, p2) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  return { x: -dy / len, y: dx / len };
};

// Offset point along perpendicular direction
export const offsetPoint = (p1, p2, point, offset) => {
  const perp = perpendicular(p1, p2);
  return {
    x: point.x + perp.x * offset,
    y: point.y + perp.y * offset,
  };
};

// Check if point is inside polygon
export const pointInPolygon = (point, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y))
      && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Check if point is inside rectangle
export const pointInRect = (point, rect) => {
  return point.x >= rect.x && point.x <= rect.x + rect.width
    && point.y >= rect.y && point.y <= rect.y + rect.height;
};

// Get bounding box of points
export const getBoundingBox = (points) => {
  if (!points || points.length === 0) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  points.forEach(p => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

// Get center of points
export const getCenter = (points) => {
  if (!points || points.length === 0) return { x: 0, y: 0 };

  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  };
};

// Rotate point around center
export const rotatePoint = (point, center, angleDeg) => {
  const rad = angleDeg * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
};

// Get closest point on line segment to point
export const closestPointOnLine = (point, lineStart, lineEnd) => {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const len2 = dx * dx + dy * dy;

  if (len2 === 0) return lineStart;

  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));

  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };
};

// Distance from point to line segment
export const distanceToLine = (point, lineStart, lineEnd) => {
  const closest = closestPointOnLine(point, lineStart, lineEnd);
  return distance(point, closest);
};

// Check if two line segments intersect
export const lineSegmentsIntersect = (p1, p2, p3, p4) => {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  if (d1 === 0 && onSegment(p3, p4, p1)) return true;
  if (d2 === 0 && onSegment(p3, p4, p2)) return true;
  if (d3 === 0 && onSegment(p1, p2, p3)) return true;
  if (d4 === 0 && onSegment(p1, p2, p4)) return true;

  return false;
};

// Helper for line intersection
const direction = (p1, p2, p3) => {
  return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
};

// Helper for line intersection
const onSegment = (p1, p2, p) => {
  return Math.min(p1.x, p2.x) <= p.x && p.x <= Math.max(p1.x, p2.x) &&
         Math.min(p1.y, p2.y) <= p.y && p.y <= Math.max(p1.y, p2.y);
};

// Get intersection point of two lines (not segments)
export const lineIntersection = (p1, p2, p3, p4) => {
  const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(denom) < 0.0001) return null; // parallel lines

  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;

  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
  };
};

// Adjust color brightness
export const adjustColor = (color, amount) => {
  // Parse hex color
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const newR = Math.max(0, Math.min(255, r + amount));
  const newG = Math.max(0, Math.min(255, g + amount));
  const newB = Math.max(0, Math.min(255, b + amount));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};
