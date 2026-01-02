import { useRef, useEffect, useState, useCallback } from 'react';
import { PAPER_SIZES, SCALE_MAP } from '../../constants/paper';
import { Button } from '../ui';

/**
 * PaperSpaceView - Renders printable sheet layouts
 */
const PaperSpaceView = ({
  activeFloor,
  activeSheet,
  projectInfo = {},
  isMobile = false,
  onClose,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(0.5);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Get paper dimensions
  const paperSize = PAPER_SIZES[activeSheet?.size] || PAPER_SIZES.letter;
  const isLandscape = activeSheet?.orientation !== 'portrait';
  const paperWidth = isLandscape ? paperSize.width : paperSize.height;
  const paperHeight = isLandscape ? paperSize.height : paperSize.width;

  // Calculate fit-to-screen zoom using window dimensions directly
  const fitToScreen = useCallback(() => {
    const headerHeight = isMobile ? 80 : 50;
    const padding = isMobile ? 40 : 80;

    const containerWidth = window.innerWidth - padding;
    const containerHeight = window.innerHeight - headerHeight - padding;

    console.log('PaperSpaceView fit:', { containerWidth, containerHeight, paperWidth, paperHeight });

    const scaleX = containerWidth / paperWidth;
    const scaleY = containerHeight / paperHeight;
    const fitZoom = Math.min(scaleX, scaleY, 1);

    setZoom(fitZoom);
    setPan({ x: 0, y: 0 });
  }, [paperWidth, paperHeight, isMobile]);

  // Fit to screen on mount and when sheet changes
  useEffect(() => {
    // Run on mount
    fitToScreen();

    window.addEventListener('resize', fitToScreen);
    window.addEventListener('orientationchange', fitToScreen);

    return () => {
      window.removeEventListener('resize', fitToScreen);
      window.removeEventListener('orientationchange', fitToScreen);
    };
  }, [activeSheet?.id, activeSheet?.size, activeSheet?.orientation, fitToScreen]);

  // Handle touch/mouse pan
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

  // Add touch event listeners with passive: false to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const touchStartHandler = (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
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
  }, [pan, panStart]);

  // Render paper space
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeSheet || !activeFloor) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear and fill white
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, w - 48, h - 48);

    // Calculate architectural scale
    const drawScale = SCALE_MAP[activeSheet.scale] || 0.06;

    // Calculate bounds of drawing
    const walls = activeFloor.walls || [];
    if (walls.length === 0) {
      ctx.fillStyle = '#999';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Draw walls in Model Space to see them here', w / 2, h / 2);
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    walls.forEach(wall => {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      minY = Math.min(minY, wall.start.y, wall.end.y);
      maxX = Math.max(maxX, wall.start.x, wall.end.x);
      maxY = Math.max(maxY, wall.start.y, wall.end.y);
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Drawing area (leave room for title block)
    const titleBlockWidth = 320;
    const margin = 40;
    const drawAreaWidth = w - margin * 2 - titleBlockWidth - 20;
    const drawAreaCenterX = margin + drawAreaWidth / 2;
    const drawAreaCenterY = h / 2;

    ctx.save();
    ctx.translate(drawAreaCenterX, drawAreaCenterY);
    ctx.scale(drawScale, drawScale);
    ctx.translate(-centerX, -centerY);

    // Draw walls
    walls.forEach(wall => {
      const thickness = wall.type === 'exterior' ? 8 : 4;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      ctx.stroke();
    });

    // Draw doors
    (activeFloor.doors || []).forEach(door => {
      const wall = walls.find(w => w.id === door.wallId);
      if (!wall) return;

      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const pos = { x: wall.start.x + dx * door.position, y: wall.start.y + dy * door.position };
      const angle = Math.atan2(dy, dx);
      const thickness = wall.type === 'exterior' ? 8 : 4;
      const doorWidth = door.width || 36;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(angle);

      // Clear opening
      ctx.fillStyle = '#fff';
      ctx.fillRect(-doorWidth / 2 - 1, -thickness / 2 - 4, doorWidth + 2, thickness + 8);

      // Door arc
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(-doorWidth / 2, thickness / 2 + 2, doorWidth, -Math.PI / 2, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      // Door panel
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-doorWidth / 2, thickness / 2 + 2);
      ctx.lineTo(-doorWidth / 2, thickness / 2 + 2 - doorWidth);
      ctx.stroke();

      ctx.restore();
    });

    // Draw windows
    (activeFloor.windows || []).forEach(win => {
      const wall = walls.find(w => w.id === win.wallId);
      if (!wall) return;

      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const pos = { x: wall.start.x + dx * win.position, y: wall.start.y + dy * win.position };
      const angle = Math.atan2(dy, dx);
      const thickness = wall.type === 'exterior' ? 8 : 4;
      const winWidth = win.width || 48;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(angle);

      // Clear opening
      ctx.fillStyle = '#fff';
      ctx.fillRect(-winWidth / 2, -thickness / 2 - 2, winWidth, thickness + 4);

      // Window lines
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-winWidth / 2, -thickness / 2);
      ctx.lineTo(winWidth / 2, -thickness / 2);
      ctx.moveTo(-winWidth / 2, thickness / 2);
      ctx.lineTo(winWidth / 2, thickness / 2);
      ctx.moveTo(-winWidth / 2, 0);
      ctx.lineTo(winWidth / 2, 0);
      ctx.stroke();

      ctx.restore();
    });

    ctx.restore();

    // Draw title block
    const tbX = w - margin - titleBlockWidth;
    const tbY = h - margin - 140;
    const tbW = titleBlockWidth;
    const tbH = 140;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(tbX, tbY, tbW, tbH);

    // Title block content
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(projectInfo.projectName || 'PROJECT NAME', tbX + tbW / 2, tbY + 20);

    ctx.font = '10px Arial';
    ctx.fillText(projectInfo.clientName || '', tbX + tbW / 2, tbY + 35);
    ctx.fillText(projectInfo.address || '', tbX + tbW / 2, tbY + 50);

    // Divider
    ctx.beginPath();
    ctx.moveTo(tbX, tbY + 60);
    ctx.lineTo(tbX + tbW, tbY + 60);
    ctx.stroke();

    // Info grid
    ctx.font = '8px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#666';
    ctx.fillText('DRAWN BY', tbX + 10, tbY + 75);
    ctx.fillText('DATE', tbX + tbW / 2 + 10, tbY + 75);
    ctx.fillText('SCALE', tbX + 10, tbY + 100);
    ctx.fillText('SHEET', tbX + tbW / 2 + 10, tbY + 100);

    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.fillText(projectInfo.drawnBy || '-', tbX + 10, tbY + 88);
    ctx.fillText(projectInfo.date || new Date().toLocaleDateString(), tbX + tbW / 2 + 10, tbY + 88);
    ctx.fillText(activeSheet.scale, tbX + 10, tbY + 113);
    ctx.font = 'bold 16px Arial';
    ctx.fillText(activeSheet.sheetNumber || 'A01', tbX + tbW / 2 + 10, tbY + 115);

    // Divider
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tbX, tbY + 120);
    ctx.lineTo(tbX + tbW, tbY + 120);
    ctx.moveTo(tbX + tbW / 2, tbY + 60);
    ctx.lineTo(tbX + tbW / 2, tbY + 120);
    ctx.stroke();

    // Sheet title
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(activeSheet.sheetTitle || 'FLOOR PLAN', tbX + tbW / 2, tbY + 133);

  }, [activeFloor, activeSheet, projectInfo, paperWidth, paperHeight]);

  if (!activeSheet) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#505050',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <span style={{ color: '#fff', fontSize: '16px' }}>No sheet selected</span>
        <Button variant="primary" onClick={onClose}>Back to Model</Button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#505050',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          background: 'rgba(8,12,16,0.98)',
          borderBottom: '1px solid rgba(0,200,255,0.2)',
          padding: isMobile ? '8px 10px' : '8px 16px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? '8px' : '12px',
          flexShrink: 0,
        }}
      >
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button variant="default" onClick={onClose}>
            ← {isMobile ? 'Back' : 'Back to Model Space'}
          </Button>

          {!isMobile && (
            <>
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>
                {activeSheet.sheetNumber} - {activeSheet.sheetTitle}
              </span>
              <span style={{ color: '#6080a0', fontSize: '10px' }}>
                {PAPER_SIZES[activeSheet.size]?.name || activeSheet.size} | Scale: {activeSheet.scale}
              </span>
            </>
          )}

          <div style={{ flex: 1 }} />

          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}
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
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
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

          <button
            onClick={() => window.print()}
            style={{
              padding: isMobile ? '8px 12px' : '6px 12px',
              background: 'rgba(0,200,255,0.2)',
              border: '1px solid rgba(0,200,255,0.4)',
              borderRadius: '4px',
              color: '#00c8ff',
              fontSize: isMobile ? '12px' : '11px',
              cursor: 'pointer',
            }}
          >
            {isMobile ? 'Print' : 'Print'}
          </button>
        </div>

        {/* Mobile-only: sheet info row */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: '11px', fontWeight: '500' }}>
              {activeSheet.sheetNumber}
            </span>
            <span style={{ color: '#6080a0', fontSize: '10px' }}>
              {PAPER_SIZES[activeSheet.size]?.name || activeSheet.size}
            </span>
          </div>
        )}
      </div>

      {/* Paper Preview Area - uses flex to fill remaining space */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0, /* Important for flex children */
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isPanning ? 'grabbing' : 'grab',
          background: '#505050',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Paper Sheet Container */}
        <div
          id="print-sheet"
          style={{
            width: paperWidth * zoom,
            height: paperHeight * zoom,
            background: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            position: 'relative',
            flexShrink: 0,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          <canvas
            ref={canvasRef}
            width={paperWidth}
            height={paperHeight}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PaperSpaceView;
