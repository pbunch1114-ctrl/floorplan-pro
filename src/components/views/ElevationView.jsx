import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GRID_SIZE, DEFAULT_WALL_HEIGHT } from '../../constants/grid';
import { ROOF_PITCHES } from '../../constants/roofs';
import { Button } from '../ui';

/**
 * ElevationView - Renders 2D elevation views of the floor plan
 * With full mobile support including pan, zoom, and fit-to-screen
 */
const ElevationView = ({
  activeFloor,
  isMobile = false,
  onClose,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [activeElevation, setActiveElevation] = useState('north');
  const [renderMode, setRenderMode] = useState('color'); // 'line', 'sketchy', 'color'
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  // Canvas dimensions - match legacy sizes for mobile (340x260 fits nicely)
  const canvasWidth = isMobile ? 340 : 800;
  const canvasHeight = isMobile ? 260 : 600;

  // Fit to screen
  const fitToScreen = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Pan handlers
  const handlePanStart = useCallback((clientX, clientY) => {
    setIsPanning(true);
    setPanStart({ x: clientX - pan.x, y: clientY - pan.y });
  }, [pan]);

  const handlePanMove = useCallback((clientX, clientY) => {
    if (!isPanning) return;
    setPan({
      x: clientX - panStart.x,
      y: clientY - panStart.y,
    });
  }, [isPanning, panStart]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Mouse handlers
  const handleMouseDown = (e) => handlePanStart(e.clientX, e.clientY);
  const handleMouseMove = (e) => handlePanMove(e.clientX, e.clientY);
  const handleMouseUp = () => handlePanEnd();

  // Mouse wheel zoom handler
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.25, Math.min(4, prev + delta)));
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      handlePanStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handlePanStart]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1 && isPanning) {
      e.preventDefault();
      handlePanMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handlePanMove, isPanning]);

  const handleTouchEnd = useCallback(() => handlePanEnd(), [handlePanEnd]);

  // Add touch event listeners with passive: false to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const touchStartHandler = (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        handlePanStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const touchMoveHandler = (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        setPan({
          x: touch.clientX - panStart.x,
          y: touch.clientY - panStart.y,
        });
      }
    };

    const touchEndHandler = () => {
      setIsPanning(false);
    };

    container.addEventListener('touchstart', touchStartHandler, { passive: false });
    container.addEventListener('touchmove', touchMoveHandler, { passive: false });
    container.addEventListener('touchend', touchEndHandler, { passive: false });

    return () => {
      container.removeEventListener('touchstart', touchStartHandler);
      container.removeEventListener('touchmove', touchMoveHandler);
      container.removeEventListener('touchend', touchEndHandler);
    };
  }, [handlePanStart, panStart]);

  // Helper function for sketchy lines
  const drawSketchyLine = useCallback((ctx, x1, y1, x2, y2) => {
    const segments = Math.max(3, Math.floor(Math.sqrt((x2-x1)**2 + (y2-y1)**2) / 20));
    ctx.beginPath();
    ctx.moveTo(x1 + (Math.random() - 0.5) * 2, y1 + (Math.random() - 0.5) * 2);
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 3;
      const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 3;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, []);

  const drawSketchyRect = useCallback((ctx, x, y, w, h) => {
    drawSketchyLine(ctx, x, y, x + w, y);
    drawSketchyLine(ctx, x + w, y, x + w, y + h);
    drawSketchyLine(ctx, x + w, y + h, x, y + h);
    drawSketchyLine(ctx, x, y + h, x, y);
  }, [drawSketchyLine]);

  // Render elevation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const isLineMode = renderMode === 'line';
    const isSketchyMode = renderMode === 'sketchy';
    const isColorMode = renderMode === 'color';

    // Clear canvas
    ctx.fillStyle = isColorMode ? '#f5f5f5' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Get walls
    const walls = activeFloor?.walls || [];
    if (walls.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = `${isMobile ? 16 : 20}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('No walls to display', width / 2, height / 2);
      ctx.font = `${isMobile ? 12 : 14}px Arial`;
      ctx.fillText('Draw some walls in Model Space first', width / 2, height / 2 + 30);
      return;
    }

    // Determine wall orientation
    const isHorizontalWall = (wall) => {
      if (!wall.start || !wall.end) return false;
      const dx = Math.abs(wall.end.x - wall.start.x);
      const dy = Math.abs(wall.end.y - wall.start.y);
      return dx > dy;
    };

    const isHorizontalElevation = activeElevation === 'north' || activeElevation === 'south';

    // Filter walls by orientation
    const orientedWalls = walls.filter(wall => {
      if (!wall.start || !wall.end) return false;
      return isHorizontalElevation ? isHorizontalWall(wall) : !isHorizontalWall(wall);
    });

    // Find bounds
    let allMinY = Infinity, allMaxY = -Infinity;
    let allMinX = Infinity, allMaxX = -Infinity;
    orientedWalls.forEach(wall => {
      allMinY = Math.min(allMinY, wall.start.y, wall.end.y);
      allMaxY = Math.max(allMaxY, wall.start.y, wall.end.y);
      allMinX = Math.min(allMinX, wall.start.x, wall.end.x);
      allMaxX = Math.max(allMaxX, wall.start.x, wall.end.x);
    });

    // Filter to walls on correct side
    const sideTolerance = 50;
    const elevationWalls = orientedWalls.filter(wall => {
      if (isHorizontalElevation) {
        const wallY = (wall.start.y + wall.end.y) / 2;
        if (activeElevation === 'north') {
          return wallY <= allMinY + sideTolerance;
        } else {
          return wallY >= allMaxY - sideTolerance;
        }
      } else {
        const wallX = (wall.start.x + wall.end.x) / 2;
        if (activeElevation === 'west') {
          return wallX <= allMinX + sideTolerance;
        } else {
          return wallX >= allMaxX - sideTolerance;
        }
      }
    });

    if (elevationWalls.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = `${isMobile ? 16 : 20}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(`No ${activeElevation} facing walls found`, width / 2, height / 2);
      ctx.font = `${isMobile ? 12 : 14}px Arial`;
      ctx.fillText('Try a different direction or draw more walls', width / 2, height / 2 + 30);
      return;
    }

    // Calculate bounds
    let minPos = Infinity, maxPos = -Infinity;
    elevationWalls.forEach(wall => {
      if (isHorizontalElevation) {
        minPos = Math.min(minPos, wall.start.x, wall.end.x);
        maxPos = Math.max(maxPos, wall.start.x, wall.end.x);
      } else {
        minPos = Math.min(minPos, wall.start.y, wall.end.y);
        maxPos = Math.max(maxPos, wall.start.y, wall.end.y);
      }
    });

    const elevationWidth = maxPos - minPos;

    // Wall height
    const maxWallHeightInches = Math.max(...elevationWalls.map(w => w.height || DEFAULT_WALL_HEIGHT));
    const wallHeight = maxWallHeightInches * (GRID_SIZE / 6);

    // Roof height
    const roofs = activeFloor?.roofs || [];
    let maxRoofHeight = 0;
    roofs.forEach(roof => {
      const pitchDef = ROOF_PITCHES[roof.pitch] || ROOF_PITCHES['6:12'];
      const roofInView = isHorizontalElevation
        ? (roof.x < maxPos && roof.x + roof.width > minPos)
        : (roof.y < maxPos && roof.y + roof.height > minPos);

      if (roofInView) {
        const roofSpanForPitch = roof.ridgeDirection === 'horizontal' ? roof.height : roof.width;
        const roofRise = (roofSpanForPitch / 2) * (pitchDef.rise / pitchDef.run);
        maxRoofHeight = Math.max(maxRoofHeight, roofRise);
      }
    });

    const totalElevationHeight = wallHeight + maxRoofHeight;

    // Scale to fit
    const padding = Math.min(40, width * 0.05);
    const titleSpace = 35;
    const groundSpace = 25;
    const availableWidth = width - padding * 2;
    const availableHeight = height - titleSpace - groundSpace - padding;

    const scaleX = availableWidth / Math.max(elevationWidth, 100);
    const scaleY = availableHeight / totalElevationHeight;
    const elevScale = Math.min(scaleX, scaleY, 2) * zoom;

    // Center offset
    const scaledWidth = elevationWidth * elevScale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = height - groundSpace - padding;

    // Draw title
    ctx.fillStyle = '#333';
    const titleFontSize = Math.min(24, width / 30);
    ctx.font = `bold ${titleFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(`${activeElevation.toUpperCase()} ELEVATION`, width / 2, titleFontSize + 8);

    // Draw ground line
    ctx.strokeStyle = isColorMode ? '#654321' : '#000000';
    ctx.lineWidth = isSketchyMode ? 2 : 3;
    if (isSketchyMode) {
      drawSketchyLine(ctx, padding / 2, offsetY, width - padding / 2, offsetY);
    } else {
      ctx.beginPath();
      ctx.moveTo(padding / 2, offsetY);
      ctx.lineTo(width - padding / 2, offsetY);
      ctx.stroke();
    }

    // Ground texture
    if (isColorMode) {
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(padding / 2, offsetY, width - padding, 15);
    }

    // Draw walls
    elevationWalls.forEach(wall => {
      let wallLength, wallStartPos;

      if (isHorizontalElevation) {
        wallLength = Math.abs(wall.end.x - wall.start.x);
        wallStartPos = Math.min(wall.start.x, wall.end.x);
      } else {
        wallLength = Math.abs(wall.end.y - wall.start.y);
        wallStartPos = Math.min(wall.start.y, wall.end.y);
      }

      const wallX = offsetX + (wallStartPos - minPos) * elevScale;
      const wallW = wallLength * elevScale;
      const wallH = wallHeight * elevScale;
      const wallY = offsetY - wallH;

      // Wall fill
      if (isColorMode) {
        ctx.fillStyle = wall.type === 'exterior' ? '#d4c5b0' : '#e8e0d5';
        ctx.fillRect(wallX, wallY, wallW, wallH);

        // Siding pattern
        if (wall.type === 'exterior') {
          ctx.strokeStyle = 'rgba(0,0,0,0.12)';
          ctx.lineWidth = 1;
          const sidingSpacing = 12;
          for (let y = wallY + sidingSpacing; y < offsetY; y += sidingSpacing) {
            ctx.beginPath();
            ctx.moveTo(wallX, y);
            ctx.lineTo(wallX + wallW, y);
            ctx.stroke();
          }
        }
      }

      // Wall outline
      ctx.strokeStyle = isColorMode ? '#333' : '#000000';
      ctx.lineWidth = isSketchyMode ? 1.5 : 2;
      if (isSketchyMode) {
        drawSketchyRect(ctx, wallX, wallY, wallW, wallH);
      } else {
        ctx.strokeRect(wallX, wallY, wallW, wallH);
      }

      // Draw doors
      const wallDoors = (activeFloor?.doors || []).filter(door => door.wallId === wall.id);
      wallDoors.forEach(door => {
        const defaultDoorWidth = 36 * (GRID_SIZE / 6);
        const doorHeightGrid = 84 * (GRID_SIZE / 6);

        const doorWidthPx = (door.width || defaultDoorWidth) * elevScale;
        const doorHeightPx = doorHeightGrid * elevScale;
        const doorPosRatio = door.position || 0.5;
        const doorX = wallX + doorPosRatio * wallW - doorWidthPx / 2;
        const doorY = offsetY - doorHeightPx;

        if (isColorMode) {
          ctx.fillStyle = '#8b4513';
          ctx.fillRect(doorX, doorY, doorWidthPx, doorHeightPx);

          ctx.strokeStyle = '#5d3a1a';
          ctx.lineWidth = 2;
          ctx.strokeRect(doorX + 4, doorY + 4, doorWidthPx - 8, doorHeightPx - 8);

          // Door handle
          ctx.fillStyle = '#c0a000';
          ctx.beginPath();
          ctx.arc(doorX + doorWidthPx - 12, doorY + doorHeightPx / 2, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = isSketchyMode ? 1.5 : 2;
          if (isSketchyMode) {
            drawSketchyRect(ctx, doorX, doorY, doorWidthPx, doorHeightPx);
          } else {
            ctx.strokeRect(doorX, doorY, doorWidthPx, doorHeightPx);
          }
        }
      });

      // Draw windows
      const wallWindows = (activeFloor?.windows || []).filter(win => win.wallId === wall.id);
      wallWindows.forEach(win => {
        const defaultWinSize = 48 * (GRID_SIZE / 6);
        const defaultSillHeight = 36 * (GRID_SIZE / 6);

        const winWidthPx = (win.width || defaultWinSize) * elevScale;
        const winHeightPx = (win.height || defaultWinSize) * elevScale;
        const sillHeightPx = (win.sillHeight || defaultSillHeight) * elevScale;

        const winPosRatio = win.position || 0.5;
        const winX = wallX + winPosRatio * wallW - winWidthPx / 2;
        const winY = offsetY - sillHeightPx - winHeightPx;

        if (isColorMode) {
          ctx.fillStyle = '#f0f8ff';
          ctx.fillRect(winX, winY, winWidthPx, winHeightPx);

          ctx.fillStyle = 'rgba(135, 206, 250, 0.3)';
          ctx.fillRect(winX + 2, winY + 2, winWidthPx - 4, winHeightPx - 4);

          ctx.strokeStyle = '#333';
          ctx.lineWidth = 2;
          ctx.strokeRect(winX, winY, winWidthPx, winHeightPx);

          // Muntins
          ctx.strokeStyle = '#666';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(winX + winWidthPx / 2, winY);
          ctx.lineTo(winX + winWidthPx / 2, winY + winHeightPx);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(winX, winY + winHeightPx / 2);
          ctx.lineTo(winX + winWidthPx, winY + winHeightPx / 2);
          ctx.stroke();

          // Sill
          ctx.fillStyle = '#ddd';
          ctx.fillRect(winX - 4, winY + winHeightPx, winWidthPx + 8, 6);
        } else {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = isSketchyMode ? 1.5 : 2;
          if (isSketchyMode) {
            drawSketchyRect(ctx, winX, winY, winWidthPx, winHeightPx);
            drawSketchyLine(ctx, winX + winWidthPx / 2, winY, winX + winWidthPx / 2, winY + winHeightPx);
            drawSketchyLine(ctx, winX, winY + winHeightPx / 2, winX + winWidthPx, winY + winHeightPx / 2);
          } else {
            ctx.strokeRect(winX, winY, winWidthPx, winHeightPx);
            ctx.beginPath();
            ctx.moveTo(winX + winWidthPx / 2, winY);
            ctx.lineTo(winX + winWidthPx / 2, winY + winHeightPx);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(winX, winY + winHeightPx / 2);
            ctx.lineTo(winX + winWidthPx, winY + winHeightPx / 2);
            ctx.stroke();
          }
        }
      });
    });

    // Draw roofs
    roofs.forEach(roof => {
      const pitchDef = ROOF_PITCHES[roof.pitch] || ROOF_PITCHES['6:12'];

      const viewingGableEnd = (isHorizontalElevation && roof.ridgeDirection === 'vertical') ||
                              (!isHorizontalElevation && roof.ridgeDirection === 'horizontal');

      let roofViewWidth, roofStartPos;
      if (isHorizontalElevation) {
        roofViewWidth = roof.width;
        roofStartPos = roof.x;
      } else {
        roofViewWidth = roof.height;
        roofStartPos = roof.y;
      }

      const roofSpanForPitch = roof.ridgeDirection === 'horizontal' ? roof.height : roof.width;
      const roofRise = (roofSpanForPitch / 2) * (pitchDef.rise / pitchDef.run);

      const roofX = offsetX + (roofStartPos - minPos) * elevScale;
      const roofW = roofViewWidth * elevScale;
      const roofH = roofRise * elevScale;
      const roofY = offsetY - wallHeight * elevScale;

      ctx.fillStyle = isColorMode ? '#8B4513' : 'transparent';
      ctx.strokeStyle = isColorMode ? '#5D3A1A' : '#000000';
      ctx.lineWidth = isSketchyMode ? 1.5 : 2;

      if (roof.type === 'gable') {
        if (viewingGableEnd) {
          // Triangular gable end
          if (isSketchyMode) {
            drawSketchyLine(ctx, roofX, roofY, roofX + roofW / 2, roofY - roofH);
            drawSketchyLine(ctx, roofX + roofW / 2, roofY - roofH, roofX + roofW, roofY);
            drawSketchyLine(ctx, roofX + roofW, roofY, roofX, roofY);
          } else {
            ctx.beginPath();
            ctx.moveTo(roofX, roofY);
            ctx.lineTo(roofX + roofW / 2, roofY - roofH);
            ctx.lineTo(roofX + roofW, roofY);
            ctx.closePath();
            if (isColorMode) ctx.fill();
            ctx.stroke();
          }
        } else {
          // Eave side
          const overhang = 15 * elevScale;
          const fascia = 6 * elevScale;

          if (isSketchyMode) {
            drawSketchyLine(ctx, roofX - overhang, roofY, roofX - overhang, roofY - fascia);
            drawSketchyLine(ctx, roofX - overhang, roofY - fascia, roofX, roofY - roofH);
            drawSketchyLine(ctx, roofX, roofY - roofH, roofX + roofW, roofY - roofH);
            drawSketchyLine(ctx, roofX + roofW, roofY - roofH, roofX + roofW + overhang, roofY - fascia);
            drawSketchyLine(ctx, roofX + roofW + overhang, roofY - fascia, roofX + roofW + overhang, roofY);
          } else {
            ctx.beginPath();
            ctx.moveTo(roofX - overhang, roofY);
            ctx.lineTo(roofX - overhang, roofY - fascia);
            ctx.lineTo(roofX, roofY - roofH);
            ctx.lineTo(roofX + roofW, roofY - roofH);
            ctx.lineTo(roofX + roofW + overhang, roofY - fascia);
            ctx.lineTo(roofX + roofW + overhang, roofY);
            ctx.closePath();
            if (isColorMode) ctx.fill();
            ctx.stroke();
          }
        }
      } else if (roof.type === 'hip') {
        const hipInset = Math.min(roofW * 0.2, roofH);
        if (isSketchyMode) {
          drawSketchyLine(ctx, roofX, roofY, roofX + hipInset, roofY - roofH);
          drawSketchyLine(ctx, roofX + hipInset, roofY - roofH, roofX + roofW - hipInset, roofY - roofH);
          drawSketchyLine(ctx, roofX + roofW - hipInset, roofY - roofH, roofX + roofW, roofY);
          drawSketchyLine(ctx, roofX + roofW, roofY, roofX, roofY);
        } else {
          ctx.beginPath();
          ctx.moveTo(roofX, roofY);
          ctx.lineTo(roofX + hipInset, roofY - roofH);
          ctx.lineTo(roofX + roofW - hipInset, roofY - roofH);
          ctx.lineTo(roofX + roofW, roofY);
          ctx.closePath();
          if (isColorMode) ctx.fill();
          ctx.stroke();
        }
      } else if (roof.type === 'shed') {
        if (isSketchyMode) {
          drawSketchyLine(ctx, roofX, roofY, roofX, roofY - roofH);
          drawSketchyLine(ctx, roofX, roofY - roofH, roofX + roofW, roofY - roofH * 0.3);
          drawSketchyLine(ctx, roofX + roofW, roofY - roofH * 0.3, roofX + roofW, roofY);
          drawSketchyLine(ctx, roofX + roofW, roofY, roofX, roofY);
        } else {
          ctx.beginPath();
          ctx.moveTo(roofX, roofY);
          ctx.lineTo(roofX, roofY - roofH);
          ctx.lineTo(roofX + roofW, roofY - roofH * 0.3);
          ctx.lineTo(roofX + roofW, roofY);
          ctx.closePath();
          if (isColorMode) ctx.fill();
          ctx.stroke();
        }
      } else if (roof.type === 'flat') {
        if (isSketchyMode) {
          drawSketchyRect(ctx, roofX, roofY - 10, roofW, 10);
        } else {
          if (isColorMode) ctx.fillRect(roofX, roofY - 10, roofW, 10);
          ctx.strokeRect(roofX, roofY - 10, roofW, 10);
        }
      }
    });

    // Scale reference
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Scale: 1 grid = 6"`, 10, height - 10);

  }, [activeFloor, activeElevation, renderMode, zoom, canvasWidth, canvasHeight, drawSketchyLine, drawSketchyRect, isMobile]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#080c10',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'rgba(8,12,16,0.98)',
          borderBottom: '1px solid rgba(0,200,255,0.2)',
          padding: isMobile ? '8px 10px' : '12px 16px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? '8px' : '12px',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Top row: back button and direction buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button variant="default" onClick={onClose}>
            ← {isMobile ? 'Back' : 'Back to Model'}
          </Button>

          <div style={{ flex: 1 }} />

          {/* Direction buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['north', 'south', 'east', 'west'].map(dir => (
              <button
                key={dir}
                onClick={() => setActiveElevation(dir)}
                style={{
                  padding: isMobile ? '10px 14px' : '6px 12px',
                  background: activeElevation === dir ? 'rgba(0,200,255,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${activeElevation === dir ? 'rgba(0,200,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '4px',
                  color: activeElevation === dir ? '#00c8ff' : '#6080a0',
                  fontSize: isMobile ? '12px' : '10px',
                  cursor: 'pointer',
                  fontWeight: activeElevation === dir ? '600' : '400',
                }}
              >
                {isMobile ? dir.charAt(0).toUpperCase() : dir.charAt(0).toUpperCase() + dir.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom row: render mode and zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '12px', flexWrap: 'wrap' }}>
          {/* Render mode */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'color', label: 'Color', icon: '🎨' },
              { id: 'line', label: 'Line', icon: '✏️' },
              { id: 'sketchy', label: 'Sketch', icon: '✍️' },
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setRenderMode(mode.id)}
                style={{
                  padding: isMobile ? '10px 12px' : '6px 10px',
                  background: renderMode === mode.id ? 'rgba(0,200,255,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${renderMode === mode.id ? 'rgba(0,200,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '4px',
                  color: renderMode === mode.id ? '#00c8ff' : '#6080a0',
                  fontSize: isMobile ? '11px' : '10px',
                  cursor: 'pointer',
                  fontWeight: renderMode === mode.id ? '600' : '400',
                }}
              >
                {mode.icon}{isMobile ? '' : ` ${mode.label}`}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
              style={{
                padding: isMobile ? '8px 12px' : '4px 8px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: isMobile ? '16px' : '12px',
              }}
            >
              −
            </button>
            <span style={{ color: '#fff', fontSize: isMobile ? '12px' : '11px', minWidth: '50px', textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(3, z + 0.25))}
              style={{
                padding: isMobile ? '8px 12px' : '4px 8px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: isMobile ? '16px' : '12px',
              }}
            >
              +
            </button>
            <button
              onClick={fitToScreen}
              style={{
                padding: isMobile ? '8px 10px' : '4px 8px',
                background: 'rgba(0,200,255,0.15)',
                border: '1px solid rgba(0,200,255,0.3)',
                borderRadius: '4px',
                color: '#00c8ff',
                cursor: 'pointer',
                fontSize: isMobile ? '11px' : '10px',
                fontWeight: '500',
              }}
            >
              Fit
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'hidden',
          padding: isMobile ? '10px' : '20px',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isPanning ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <canvas
          key={isMobile ? 'mobile-canvas' : 'desktop-canvas'}
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{
            width: canvasWidth + 'px',
            height: canvasHeight + 'px',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            background: '#f5f5f5',
            flexShrink: 0,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Mobile hint */}
      {isMobile && (
        <div style={{
          flexShrink: 0,
          padding: '8px',
          textAlign: 'center',
          color: '#6080a0',
          fontSize: '10px',
          background: 'rgba(8,12,16,0.98)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          Drag to pan • Use +/- to zoom
        </div>
      )}
    </div>
  );
};

export default ElevationView;
