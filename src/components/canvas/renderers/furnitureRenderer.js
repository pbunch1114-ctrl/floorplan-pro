/**
 * Furniture Renderer - Draws furniture items with various shapes
 */

import { GRID_SIZE } from '../../../constants/grid';

export function drawFurniture(ctx, furniture, isSelected = false, scale = 1) {
  const { x, y, width, height, rotation = 0, shape, name, icon } = furniture;

  // Convert inches to pixels
  const pxWidth = width * (GRID_SIZE / 6);
  const pxHeight = height * (GRID_SIZE / 6);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  // Draw based on shape type
  switch (shape) {
    case 'bed':
      drawBed(ctx, pxWidth, pxHeight, isSelected);
      break;
    case 'sofa':
      drawSofa(ctx, pxWidth, pxHeight, isSelected);
      break;
    case 'chair':
      drawChair(ctx, pxWidth, pxHeight, isSelected);
      break;
    case 'table':
      drawTable(ctx, pxWidth, pxHeight, isSelected);
      break;
    case 'cabinet':
      drawCabinet(ctx, pxWidth, pxHeight, isSelected);
      break;
    case 'appliance':
      drawAppliance(ctx, pxWidth, pxHeight, isSelected);
      break;
    case 'stove':
      drawStove(ctx, pxWidth, pxHeight, isSelected);
      break;
    case 'sink':
      drawSink(ctx, pxWidth, pxHeight, isSelected);
      break;
    case 'toilet':
      drawToilet(ctx, pxWidth, pxHeight, isSelected);
      break;
    case 'tub':
      drawTub(ctx, pxWidth, pxHeight, isSelected);
      break;
    case 'shower':
      drawShower(ctx, pxWidth, pxHeight, isSelected);
      break;
    case 'counter':
      drawCounter(ctx, pxWidth, pxHeight, isSelected);
      break;
    case 'counter-corner':
      drawCornerCounter(ctx, pxWidth, pxHeight, isSelected);
      break;
    case 'island':
      drawIsland(ctx, pxWidth, pxHeight, isSelected);
      break;
    default:
      drawDefaultFurniture(ctx, pxWidth, pxHeight, isSelected, name);
  }

  // Selection highlight
  if (isSelected) {
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(-pxWidth / 2 - 4, -pxHeight / 2 - 4, pxWidth + 8, pxHeight + 8);
    ctx.setLineDash([]);

    // Draw rotation handle
    const handleDistance = pxHeight / 2 + 20;
    ctx.fillStyle = '#00ffaa';
    ctx.beginPath();
    ctx.arc(0, -handleDistance, 6 / scale, 0, Math.PI * 2);
    ctx.fill();

    // Line to rotation handle
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, -pxHeight / 2);
    ctx.lineTo(0, -handleDistance);
    ctx.stroke();
  }

  ctx.restore();
}

function drawDefaultFurniture(ctx, width, height, isSelected, name) {
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.3)' : 'rgba(139,90,43,0.4)';
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#8B7355';
  ctx.lineWidth = 1.5;

  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.strokeRect(-width / 2, -height / 2, width, height);

  // Label
  if (name) {
    ctx.fillStyle = isSelected ? '#00ffaa' : '#8B7355';
    ctx.font = '10px "SF Pro", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 0, 0);
  }
}

function drawBed(ctx, width, height, isSelected) {
  // Mattress
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.2)' : 'rgba(200,180,160,0.5)';
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#8B7355';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.strokeRect(-width / 2, -height / 2, width, height);

  // Pillows
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.3)' : 'rgba(220,210,200,0.6)';
  const pillowHeight = height * 0.15;
  ctx.fillRect(-width / 2 + 4, -height / 2 + 4, width / 2 - 6, pillowHeight);
  ctx.fillRect(2, -height / 2 + 4, width / 2 - 6, pillowHeight);
  ctx.strokeRect(-width / 2 + 4, -height / 2 + 4, width / 2 - 6, pillowHeight);
  ctx.strokeRect(2, -height / 2 + 4, width / 2 - 6, pillowHeight);

  // Headboard
  ctx.fillStyle = isSelected ? '#00ffaa' : '#6B5344';
  ctx.fillRect(-width / 2, -height / 2 - 4, width, 4);
}

function drawSofa(ctx, width, height, isSelected) {
  // Base
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.2)' : 'rgba(100,120,140,0.5)';
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#666';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.strokeRect(-width / 2, -height / 2, width, height);

  // Back cushion
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.3)' : 'rgba(80,100,120,0.6)';
  ctx.fillRect(-width / 2 + 2, -height / 2 + 2, width - 4, height * 0.25);

  // Seat cushions
  const cushionWidth = (width - 8) / 3;
  for (let i = 0; i < 3; i++) {
    ctx.strokeRect(-width / 2 + 4 + i * cushionWidth, -height / 2 + height * 0.3, cushionWidth - 2, height * 0.6);
  }

  // Arms
  ctx.fillStyle = isSelected ? '#00ffaa' : '#555';
  ctx.fillRect(-width / 2, -height / 2, 4, height);
  ctx.fillRect(width / 2 - 4, -height / 2, 4, height);
}

function drawChair(ctx, width, height, isSelected) {
  // Seat
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.2)' : 'rgba(139,90,43,0.5)';
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#8B7355';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-width / 2, -height / 2 + height * 0.2, width, height * 0.8);
  ctx.strokeRect(-width / 2, -height / 2 + height * 0.2, width, height * 0.8);

  // Back
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.3)' : 'rgba(100,70,40,0.6)';
  ctx.fillRect(-width / 2, -height / 2, width, height * 0.25);
  ctx.strokeRect(-width / 2, -height / 2, width, height * 0.25);
}

function drawTable(ctx, width, height, isSelected) {
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.2)' : 'rgba(139,90,43,0.4)';
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#8B7355';
  ctx.lineWidth = 2;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.strokeRect(-width / 2, -height / 2, width, height);

  // Table legs (corners)
  ctx.fillStyle = isSelected ? '#00ffaa' : '#6B5344';
  const legSize = 4;
  ctx.fillRect(-width / 2, -height / 2, legSize, legSize);
  ctx.fillRect(width / 2 - legSize, -height / 2, legSize, legSize);
  ctx.fillRect(-width / 2, height / 2 - legSize, legSize, legSize);
  ctx.fillRect(width / 2 - legSize, height / 2 - legSize, legSize, legSize);
}

function drawCabinet(ctx, width, height, isSelected) {
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.2)' : 'rgba(139,90,43,0.5)';
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#8B7355';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.strokeRect(-width / 2, -height / 2, width, height);

  // Doors/drawers
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -height / 2);
  ctx.lineTo(0, height / 2);
  ctx.stroke();

  // Handles
  ctx.fillStyle = isSelected ? '#00ffaa' : '#666';
  ctx.fillRect(-4, -2, 3, 4);
  ctx.fillRect(1, -2, 3, 4);
}

function drawAppliance(ctx, width, height, isSelected) {
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.2)' : 'rgba(200,200,210,0.5)';
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#888';
  ctx.lineWidth = 2;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.strokeRect(-width / 2, -height / 2, width, height);

  // Control panel area
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.3)' : 'rgba(50,50,60,0.5)';
  ctx.fillRect(-width / 2 + 4, -height / 2 + 4, width - 8, 8);
}

function drawStove(ctx, width, height, isSelected) {
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.2)' : 'rgba(50,50,60,0.6)';
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#666';
  ctx.lineWidth = 2;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.strokeRect(-width / 2, -height / 2, width, height);

  // Burners
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#888';
  ctx.lineWidth = 2;
  const burnerRadius = Math.min(width, height) * 0.15;
  ctx.beginPath();
  ctx.arc(-width / 4, -height / 4, burnerRadius, 0, Math.PI * 2);
  ctx.arc(width / 4, -height / 4, burnerRadius, 0, Math.PI * 2);
  ctx.arc(-width / 4, height / 4, burnerRadius, 0, Math.PI * 2);
  ctx.arc(width / 4, height / 4, burnerRadius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawSink(ctx, width, height, isSelected) {
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.2)' : 'rgba(200,200,210,0.5)';
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#888';
  ctx.lineWidth = 2;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.strokeRect(-width / 2, -height / 2, width, height);

  // Basin
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.3)' : 'rgba(150,150,160,0.5)';
  ctx.fillRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8);
  ctx.strokeRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8);

  // Drain
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.stroke();

  // Faucet
  ctx.fillStyle = isSelected ? '#00ffaa' : '#666';
  ctx.fillRect(-3, -height / 2 + 2, 6, 4);
}

function drawToilet(ctx, width, height, isSelected) {
  // Tank
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.2)' : 'rgba(240,240,245,0.6)';
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#aaa';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-width / 2, -height / 2, width, height * 0.3);
  ctx.strokeRect(-width / 2, -height / 2, width, height * 0.3);

  // Bowl (oval)
  ctx.beginPath();
  ctx.ellipse(0, height * 0.15, width / 2 - 2, height * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Seat
  ctx.beginPath();
  ctx.ellipse(0, height * 0.15, width / 2 - 5, height * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawTub(ctx, width, height, isSelected) {
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.2)' : 'rgba(240,240,245,0.6)';
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#aaa';
  ctx.lineWidth = 2;

  // Outer tub shape with rounded corners
  const radius = 8;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2, width, height, radius);
  ctx.fill();
  ctx.stroke();

  // Inner basin
  ctx.strokeStyle = isSelected ? 'rgba(0,255,170,0.5)' : '#ccc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8, radius - 2);
  ctx.stroke();

  // Drain
  ctx.beginPath();
  ctx.arc(0, height / 4, 4, 0, Math.PI * 2);
  ctx.stroke();

  // Faucet
  ctx.fillStyle = isSelected ? '#00ffaa' : '#888';
  ctx.fillRect(-6, -height / 2 + 6, 12, 6);
}

function drawShower(ctx, width, height, isSelected) {
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.15)' : 'rgba(135,206,235,0.2)';
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#87CEEB';
  ctx.lineWidth = 2;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.strokeRect(-width / 2, -height / 2, width, height);

  // Tile pattern
  ctx.strokeStyle = isSelected ? 'rgba(0,255,170,0.3)' : 'rgba(135,206,235,0.3)';
  ctx.lineWidth = 0.5;
  const tileSize = 12;
  for (let x = -width / 2; x < width / 2; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, -height / 2);
    ctx.lineTo(x, height / 2);
    ctx.stroke();
  }
  for (let y = -height / 2; y < height / 2; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(-width / 2, y);
    ctx.lineTo(width / 2, y);
    ctx.stroke();
  }

  // Shower head
  ctx.fillStyle = isSelected ? '#00ffaa' : '#888';
  ctx.beginPath();
  ctx.arc(0, -height / 2 + 10, 6, 0, Math.PI * 2);
  ctx.fill();

  // Drain
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#666';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, height / 4, 5, 0, Math.PI * 2);
  ctx.stroke();
}

function drawCounter(ctx, width, height, isSelected) {
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.2)' : 'rgba(160,140,120,0.5)';
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#8B7355';
  ctx.lineWidth = 2;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.strokeRect(-width / 2, -height / 2, width, height);

  // Cabinet below
  ctx.strokeStyle = isSelected ? 'rgba(0,255,170,0.5)' : '#6B5344';
  ctx.lineWidth = 1;
  ctx.strokeRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4);

  // Door division
  ctx.beginPath();
  ctx.moveTo(0, -height / 2 + 2);
  ctx.lineTo(0, height / 2 - 2);
  ctx.stroke();
}

function drawCornerCounter(ctx, width, height, isSelected) {
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.2)' : 'rgba(160,140,120,0.5)';
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#8B7355';
  ctx.lineWidth = 2;

  // L-shaped counter
  ctx.beginPath();
  ctx.moveTo(-width / 2, -height / 2);
  ctx.lineTo(width / 2, -height / 2);
  ctx.lineTo(width / 2, 0);
  ctx.lineTo(0, 0);
  ctx.lineTo(0, height / 2);
  ctx.lineTo(-width / 2, height / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawIsland(ctx, width, height, isSelected) {
  ctx.fillStyle = isSelected ? 'rgba(0,255,170,0.2)' : 'rgba(160,140,120,0.5)';
  ctx.strokeStyle = isSelected ? '#00ffaa' : '#8B7355';
  ctx.lineWidth = 2;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.strokeRect(-width / 2, -height / 2, width, height);

  // Counter overhang lines
  ctx.strokeStyle = isSelected ? 'rgba(0,255,170,0.5)' : '#6B5344';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(-width / 2 + 6, -height / 2 + 6, width - 12, height - 12);
  ctx.setLineDash([]);
}
