// Drawing utilities for canvas operations
import { HATCH_PATTERNS } from '../constants/styles';
import { parseColorToRGB } from './colors';

// Draw hatch pattern in a polygon
export const drawHatchPattern = (ctx, points, pattern, patternScale = 1, fillOpacity = 0.5) => {
  if (points.length < 3) return;

  const patternDef = HATCH_PATTERNS[pattern] || HATCH_PATTERNS.concrete;
  const spacing = 12 * patternScale;

  // Get bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  points.forEach(p => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });

  ctx.save();

  // Clip to polygon
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.clip();

  // Get RGB components
  const { r, g, b } = parseColorToRGB(patternDef.color);

  // Fill background
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${fillOpacity * 0.3})`;
  ctx.fill();

  // Draw pattern
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${fillOpacity})`;
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${fillOpacity})`;
  ctx.lineWidth = 1;

  switch (patternDef.type) {
    case 'diagonal':
      // Diagonal lines
      for (let x = minX - (maxY - minY); x < maxX + spacing; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, minY);
        ctx.lineTo(x + (maxY - minY), maxY);
        ctx.stroke();
      }
      break;

    case 'dots':
    case 'stipple':
      // Random dots for concrete/stipple
      const dotSpacing = spacing * 0.8;
      for (let x = minX; x < maxX; x += dotSpacing) {
        for (let y = minY; y < maxY; y += dotSpacing) {
          const ox = (Math.random() - 0.5) * dotSpacing * 0.5;
          const oy = (Math.random() - 0.5) * dotSpacing * 0.5;
          ctx.beginPath();
          ctx.arc(x + ox, y + oy, patternDef.type === 'stipple' ? 1.5 : 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;

    case 'gravel':
      // Irregular small circles
      const gravelSpacing = spacing * 1.2;
      for (let x = minX; x < maxX; x += gravelSpacing) {
        for (let y = minY; y < maxY; y += gravelSpacing) {
          const ox = (Math.random() - 0.5) * gravelSpacing * 0.6;
          const oy = (Math.random() - 0.5) * gravelSpacing * 0.6;
          const size = 2 + Math.random() * 3;
          ctx.beginPath();
          ctx.arc(x + ox, y + oy, size, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      break;

    case 'grass':
      // Short lines pointing up
      const grassSpacing = spacing * 0.6;
      for (let x = minX; x < maxX; x += grassSpacing) {
        for (let y = minY; y < maxY; y += grassSpacing * 1.5) {
          const ox = (Math.random() - 0.5) * grassSpacing * 0.5;
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
          const len = 4 + Math.random() * 4;
          ctx.beginPath();
          ctx.moveTo(x + ox, y);
          ctx.lineTo(x + ox + Math.cos(angle) * len, y + Math.sin(angle) * len);
          ctx.stroke();
        }
      }
      break;

    case 'waves':
      // Wavy horizontal lines
      for (let y = minY; y < maxY; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(minX, y);
        for (let x = minX; x < maxX; x += 10) {
          ctx.lineTo(x, y + Math.sin((x - minX) / 15) * 3);
        }
        ctx.stroke();
      }
      break;

    case 'earth':
      // Diagonal with dots
      for (let x = minX - (maxY - minY); x < maxX + spacing; x += spacing * 2) {
        ctx.beginPath();
        ctx.moveTo(x, minY);
        ctx.lineTo(x + (maxY - minY), maxY);
        ctx.stroke();
      }
      for (let x = minX; x < maxX; x += spacing) {
        for (let y = minY; y < maxY; y += spacing) {
          if (Math.random() > 0.5) {
            ctx.beginPath();
            ctx.arc(x + Math.random() * 5, y + Math.random() * 5, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      break;

    case 'brick':
      // Brick pattern
      const brickW = spacing * 2;
      const brickH = spacing * 0.8;
      let row = 0;
      for (let y = minY; y < maxY; y += brickH) {
        const offset = (row % 2) * brickW / 2;
        for (let x = minX - brickW + offset; x < maxX; x += brickW) {
          ctx.strokeRect(x, y, brickW, brickH);
        }
        row++;
      }
      break;

    case 'tile':
      // Square tiles
      for (let x = minX; x < maxX; x += spacing) {
        for (let y = minY; y < maxY; y += spacing) {
          ctx.strokeRect(x, y, spacing - 2, spacing - 2);
        }
      }
      break;

    case 'wood':
      // Wood grain lines
      for (let y = minY; y < maxY; y += spacing * 0.4) {
        ctx.beginPath();
        ctx.moveTo(minX, y);
        for (let x = minX; x < maxX; x += 20) {
          ctx.lineTo(x, y + (Math.random() - 0.5) * 2);
        }
        ctx.stroke();
      }
      break;

    case 'insulation':
      // Wavy zigzag
      for (let y = minY; y < maxY; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(minX, y);
        for (let x = minX; x < maxX; x += 8) {
          ctx.lineTo(x, y + ((Math.floor(x / 8) % 2) * 2 - 1) * 4);
        }
        ctx.stroke();
      }
      break;

    case 'stone':
      // Irregular polygons
      const stoneSpacing = spacing * 2;
      for (let x = minX; x < maxX; x += stoneSpacing) {
        for (let y = minY; y < maxY; y += stoneSpacing) {
          ctx.beginPath();
          const cx = x + stoneSpacing / 2 + (Math.random() - 0.5) * stoneSpacing * 0.3;
          const cy = y + stoneSpacing / 2 + (Math.random() - 0.5) * stoneSpacing * 0.3;
          const sides = 5 + Math.floor(Math.random() * 3);
          for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const rad = stoneSpacing * 0.3 + Math.random() * stoneSpacing * 0.2;
            const px = cx + Math.cos(angle) * rad;
            const py = cy + Math.sin(angle) * rad;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
  }

  ctx.restore();

  // Draw outline
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.stroke();
};

// Draw a sketchy line (for artistic elevation views)
export const drawSketchyLine = (ctx, x1, y1, x2, y2, segments = 3) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);

  ctx.beginPath();
  ctx.moveTo(x1, y1);

  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    const offset = (Math.random() - 0.5) * Math.min(len * 0.02, 3);
    const perpX = -dy / len * offset;
    const perpY = dx / len * offset;
    ctx.lineTo(px + perpX, py + perpY);
  }

  ctx.stroke();
};

// Draw a sketchy rectangle
export const drawSketchyRect = (ctx, x, y, width, height) => {
  drawSketchyLine(ctx, x, y, x + width, y);
  drawSketchyLine(ctx, x + width, y, x + width, y + height);
  drawSketchyLine(ctx, x + width, y + height, x, y + height);
  drawSketchyLine(ctx, x, y + height, x, y);
};

// Convert decimal inches to fraction string (to nearest 1/16)
export const inchesToFraction = (decimalInches) => {
  const whole = Math.floor(decimalInches);
  const remainder = decimalInches - whole;

  if (remainder < 0.03125) return whole === 0 ? '0' : String(whole);

  // Common fractions and their decimal equivalents
  const fractions = [
    { dec: 0.0625, str: '1/16' },
    { dec: 0.125, str: '1/8' },
    { dec: 0.1875, str: '3/16' },
    { dec: 0.25, str: '1/4' },
    { dec: 0.3125, str: '5/16' },
    { dec: 0.375, str: '3/8' },
    { dec: 0.4375, str: '7/16' },
    { dec: 0.5, str: '1/2' },
    { dec: 0.5625, str: '9/16' },
    { dec: 0.625, str: '5/8' },
    { dec: 0.6875, str: '11/16' },
    { dec: 0.75, str: '3/4' },
    { dec: 0.8125, str: '13/16' },
    { dec: 0.875, str: '7/8' },
    { dec: 0.9375, str: '15/16' },
  ];

  // Find closest fraction
  let closest = fractions[0];
  let minDiff = Math.abs(remainder - fractions[0].dec);

  for (const frac of fractions) {
    const diff = Math.abs(remainder - frac.dec);
    if (diff < minDiff) {
      minDiff = diff;
      closest = frac;
    }
  }

  // If very close to 1, round up
  if (remainder > 0.96875) {
    return String(whole + 1);
  }

  if (whole === 0) {
    return closest.str;
  }
  return `${whole} ${closest.str}`;
};

// Format decimal feet to feet-inches string with fractions
export const formatToFeetInches = (value) => {
  const feet = Math.floor(value);
  const totalInches = (value - feet) * 12;
  const inchStr = inchesToFraction(totalInches);

  if (inchStr === '0') {
    return `${feet}'`;
  }
  return `${feet}'-${inchStr}"`;
};
