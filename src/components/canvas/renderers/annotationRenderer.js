/**
 * Annotation Renderer - Renders markup annotations on the canvas
 * Supports: arrow, freehand, circle, rectangle, stamp, cloud, callout
 */

// Stamp definitions
export const STAMP_TYPES = {
  demo: { text: 'DEMO', color: '#ff0000', bgColor: 'rgba(255,0,0,0.1)' },
  new: { text: 'NEW', color: '#00aa00', bgColor: 'rgba(0,170,0,0.1)' },
  verify: { text: 'VERIFY', color: '#ff8800', bgColor: 'rgba(255,136,0,0.1)' },
  approved: { text: '✓ APPROVED', color: '#00aa00', bgColor: 'rgba(0,170,0,0.15)' },
  rejected: { text: '✗ REJECTED', color: '#ff0000', bgColor: 'rgba(255,0,0,0.15)' },
  electrical: { text: '⚡ ELECTRICAL', color: '#ffcc00', bgColor: 'rgba(255,204,0,0.15)' },
  plumbing: { text: '💧 PLUMBING', color: '#0088ff', bgColor: 'rgba(0,136,255,0.15)' },
};

/**
 * Draw all annotations
 */
export function drawAnnotations(ctx, annotations, selectedIds = [], scale = 1) {
  if (!annotations || annotations.length === 0) return;

  annotations.forEach(annotation => {
    const isSelected = selectedIds.includes(annotation.id);

    switch (annotation.type) {
      case 'arrow':
        drawArrow(ctx, annotation, isSelected, scale);
        break;
      case 'freehand':
        drawFreehand(ctx, annotation, isSelected, scale);
        break;
      case 'circle':
        drawCircle(ctx, annotation, isSelected, scale);
        break;
      case 'rectangle':
        drawRectangle(ctx, annotation, isSelected, scale);
        break;
      case 'stamp':
        drawStamp(ctx, annotation, isSelected, scale);
        break;
      case 'cloud':
        drawCloud(ctx, annotation, isSelected, scale);
        break;
      case 'callout':
        drawCallout(ctx, annotation, isSelected, scale);
        break;
      default:
        break;
    }
  });
}

/**
 * Draw an arrow annotation
 */
function drawArrow(ctx, annotation, isSelected, scale) {
  const { start, end, color = '#ff0000', thickness = 4 } = annotation;
  if (!start || !end) return;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const angle = Math.atan2(dy, dx);
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < 5) return;

  ctx.save();

  // Selection highlight
  if (isSelected) {
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = thickness + 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  // Main line
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  // Arrowhead
  const headLength = Math.min(20, length * 0.3);
  const headAngle = Math.PI / 6;

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle - headAngle),
    end.y - headLength * Math.sin(angle - headAngle)
  );
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle + headAngle),
    end.y - headLength * Math.sin(angle + headAngle)
  );
  ctx.stroke();

  // Draw grip points when selected
  if (isSelected) {
    drawGrip(ctx, start.x, start.y, scale);
    drawGrip(ctx, end.x, end.y, scale);
  }

  ctx.restore();
}

/**
 * Draw a freehand annotation
 */
function drawFreehand(ctx, annotation, isSelected, scale) {
  const { points, color = '#ff0000', thickness = 4 } = annotation;
  if (!points || points.length < 2) return;

  ctx.save();

  // Selection highlight
  if (isSelected) {
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = thickness + 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  // Main stroke
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  // Use quadratic curves for smoother lines
  if (points.length > 2) {
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    // Last point
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  } else {
    ctx.lineTo(points[1].x, points[1].y);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a circle annotation
 */
function drawCircle(ctx, annotation, isSelected, scale) {
  const { center, radiusX, radiusY, color = '#ff0000', thickness = 4 } = annotation;
  if (!center) return;

  const rx = radiusX || 50;
  const ry = radiusY || rx;

  ctx.save();

  // Selection highlight
  if (isSelected) {
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = thickness + 4;
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Main stroke
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.fillStyle = `${color}15`; // Very transparent fill

  ctx.beginPath();
  ctx.ellipse(center.x, center.y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw grip points when selected
  if (isSelected) {
    drawGrip(ctx, center.x - rx, center.y, scale);
    drawGrip(ctx, center.x + rx, center.y, scale);
    drawGrip(ctx, center.x, center.y - ry, scale);
    drawGrip(ctx, center.x, center.y + ry, scale);
  }

  ctx.restore();
}

/**
 * Draw a rectangle annotation
 */
function drawRectangle(ctx, annotation, isSelected, scale) {
  const { start, end, color = '#ff0000', thickness = 4, filled = false } = annotation;
  if (!start || !end) return;

  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  ctx.save();

  // Selection highlight
  if (isSelected) {
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = thickness + 4;
    ctx.strokeRect(x, y, width, height);
  }

  // Main stroke
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.fillStyle = filled ? `${color}30` : `${color}10`;

  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);

  // Draw grip points when selected
  if (isSelected) {
    drawGrip(ctx, start.x, start.y, scale);
    drawGrip(ctx, end.x, start.y, scale);
    drawGrip(ctx, start.x, end.y, scale);
    drawGrip(ctx, end.x, end.y, scale);
  }

  ctx.restore();
}

/**
 * Draw a stamp annotation
 */
function drawStamp(ctx, annotation, isSelected, scale) {
  const { position, stampType = 'demo', rotation = 0 } = annotation;
  if (!position) return;

  const stamp = STAMP_TYPES[stampType] || STAMP_TYPES.demo;
  const fontSize = 16;
  const padding = 8;

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(rotation * Math.PI / 180);

  // Measure text
  ctx.font = `bold ${fontSize}px "SF Mono", monospace`;
  const textWidth = ctx.measureText(stamp.text).width;
  const boxWidth = textWidth + padding * 2;
  const boxHeight = fontSize + padding * 2;

  // Selection highlight
  if (isSelected) {
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(-boxWidth / 2 - 4, -boxHeight / 2 - 4, boxWidth + 8, boxHeight + 8);
  }

  // Background
  ctx.fillStyle = stamp.bgColor;
  ctx.fillRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);

  // Border
  ctx.strokeStyle = stamp.color;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 2]);
  ctx.strokeRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
  ctx.setLineDash([]);

  // Text
  ctx.fillStyle = stamp.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(stamp.text, 0, 0);

  ctx.restore();
}

/**
 * Draw a revision cloud annotation
 */
function drawCloud(ctx, annotation, isSelected, scale) {
  const { start, end, color = '#ff0000', thickness = 3 } = annotation;
  if (!start || !end) return;

  // Convert start/end to rectangle corners
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  if (width < 10 || height < 10) return;

  // Create corner points for the cloud rectangle
  const points = [
    { x: x, y: y },
    { x: x + width, y: y },
    { x: x + width, y: y + height },
    { x: x, y: y + height },
  ];

  ctx.save();

  // Selection highlight
  if (isSelected) {
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = thickness + 4;
    drawCloudPath(ctx, points);
    ctx.stroke();
  }

  // Main cloud
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.fillStyle = `${color}08`;

  drawCloudPath(ctx, points);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper to draw the cloud path with bumpy edges
 */
function drawCloudPath(ctx, points) {
  if (points.length < 3) return;

  ctx.beginPath();

  // Create bumpy edges between each pair of points
  const bumpSize = 12;

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const numBumps = Math.max(3, Math.floor(dist / (bumpSize * 2)));

    const angle = Math.atan2(dy, dx);
    const perpAngle = angle + Math.PI / 2;

    for (let j = 0; j < numBumps; j++) {
      const t1 = j / numBumps;
      const t2 = (j + 1) / numBumps;

      const x1 = p1.x + dx * t1;
      const y1 = p1.y + dy * t1;
      const x2 = p1.x + dx * t2;
      const y2 = p1.y + dy * t2;

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      // Alternate bump direction for cloud effect
      const bumpDir = (j % 2 === 0) ? 1 : -1;
      const cpX = midX + Math.cos(perpAngle) * bumpSize * bumpDir;
      const cpY = midY + Math.sin(perpAngle) * bumpSize * bumpDir;

      if (i === 0 && j === 0) {
        ctx.moveTo(x1, y1);
      }
      ctx.quadraticCurveTo(cpX, cpY, x2, y2);
    }
  }

  ctx.closePath();
}

/**
 * Draw a callout annotation
 */
function drawCallout(ctx, annotation, isSelected, scale) {
  const { position, number = 1, noteText = '' } = annotation;
  if (!position) return;

  const radius = 14;

  ctx.save();

  // Selection highlight
  if (isSelected) {
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Circle background
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ff0000';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Number
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px "SF Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(number), position.x, position.y);

  // Show note preview if exists
  if (noteText && noteText.length > 0) {
    const preview = noteText.substring(0, 20) + (noteText.length > 20 ? '...' : '');

    ctx.font = '10px "SF Mono", monospace';
    const textWidth = ctx.measureText(preview).width;

    // Note bubble
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillRect(position.x + radius + 8, position.y - 10, textWidth + 10, 20);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1;
    ctx.strokeRect(position.x + radius + 8, position.y - 10, textWidth + 10, 20);

    // Note text
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText(preview, position.x + radius + 13, position.y);
  }

  ctx.restore();
}

/**
 * Helper to draw a grip point
 */
function drawGrip(ctx, x, y, scale) {
  const size = 6 / scale;
  ctx.fillStyle = '#00c8ff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.fillRect(x - size / 2, y - size / 2, size, size);
  ctx.strokeRect(x - size / 2, y - size / 2, size, size);
}

/**
 * Hit test for annotations - returns the annotation at the given point
 */
export function hitTestAnnotation(annotations, x, y, scale = 1) {
  const hitRadius = 10 / scale;

  // Test in reverse order (top items first)
  for (let i = annotations.length - 1; i >= 0; i--) {
    const annotation = annotations[i];

    if (hitTestSingleAnnotation(annotation, x, y, hitRadius)) {
      return annotation;
    }
  }

  return null;
}

/**
 * Hit test a single annotation
 */
function hitTestSingleAnnotation(annotation, x, y, hitRadius) {
  switch (annotation.type) {
    case 'arrow':
      return hitTestLine(annotation.start, annotation.end, x, y, hitRadius);

    case 'freehand':
      if (!annotation.points || annotation.points.length < 2) return false;
      for (let i = 1; i < annotation.points.length; i++) {
        if (hitTestLine(annotation.points[i - 1], annotation.points[i], x, y, hitRadius)) {
          return true;
        }
      }
      return false;

    case 'circle':
      const rx = annotation.radiusX || 50;
      const ry = annotation.radiusY || rx;
      // Check if point is near the ellipse edge
      const dx = x - annotation.center.x;
      const dy = y - annotation.center.y;
      const normalizedDist = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
      return Math.abs(normalizedDist - 1) < 0.3 || normalizedDist < 1;

    case 'rectangle':
      const minX = Math.min(annotation.start.x, annotation.end.x);
      const maxX = Math.max(annotation.start.x, annotation.end.x);
      const minY = Math.min(annotation.start.y, annotation.end.y);
      const maxY = Math.max(annotation.start.y, annotation.end.y);
      return x >= minX - hitRadius && x <= maxX + hitRadius &&
             y >= minY - hitRadius && y <= maxY + hitRadius;

    case 'stamp':
      const stampRadius = 50; // Approximate stamp size
      return Math.abs(x - annotation.position.x) < stampRadius &&
             Math.abs(y - annotation.position.y) < 20;

    case 'cloud':
      // Cloud uses start/end like rectangle
      if (!annotation.start || !annotation.end) return false;
      const cloudMinX = Math.min(annotation.start.x, annotation.end.x);
      const cloudMaxX = Math.max(annotation.start.x, annotation.end.x);
      const cloudMinY = Math.min(annotation.start.y, annotation.end.y);
      const cloudMaxY = Math.max(annotation.start.y, annotation.end.y);
      return x >= cloudMinX - hitRadius && x <= cloudMaxX + hitRadius &&
             y >= cloudMinY - hitRadius && y <= cloudMaxY + hitRadius;

    case 'callout':
      const calloutRadius = 14;
      const distSq = Math.pow(x - annotation.position.x, 2) + Math.pow(y - annotation.position.y, 2);
      return distSq <= Math.pow(calloutRadius + hitRadius, 2);

    default:
      return false;
  }
}

/**
 * Hit test a line segment
 */
function hitTestLine(p1, p2, x, y, threshold) {
  if (!p1 || !p2) return false;

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.sqrt(Math.pow(x - p1.x, 2) + Math.pow(y - p1.y, 2)) <= threshold;
  }

  let t = ((x - p1.x) * dx + (y - p1.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = p1.x + t * dx;
  const closestY = p1.y + t * dy;
  const dist = Math.sqrt(Math.pow(x - closestX, 2) + Math.pow(y - closestY, 2));

  return dist <= threshold;
}

/**
 * Point in polygon test (for cloud)
 */
function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

export default { drawAnnotations, hitTestAnnotation, STAMP_TYPES };
