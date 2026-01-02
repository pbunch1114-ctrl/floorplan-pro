import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GRID_SIZE, DEFAULT_WALL_HEIGHT } from '../../constants/grid';

/**
 * ThreeDView - 3D isometric preview of the floor plan
 * Uses canvas for simple 3D projection
 */
const ThreeDView = ({
  activeFloor,
  isMobile = false,
  onClose,
}) => {
  const canvasRef = useRef(null);

  // 3D view state
  const [rotation, setRotation] = useState({ x: 30, y: 45 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const width = isMobile ? 280 : 400;
  const height = isMobile ? 210 : 300;

  // Render 3D view
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeFloor) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a1015';
    ctx.fillRect(0, 0, width, height);

    // Apply rotation angles
    const rotX = rotation.x * Math.PI / 180;
    const rotY = rotation.y * Math.PI / 180;

    // 3D to 2D projection with rotation
    const project = (x, y, z = 0) => {
      // Apply Y rotation (around vertical axis)
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = x * cosY - y * sinY;
      const y1 = x * sinY + y * cosY;

      // Apply X rotation (tilt)
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = y1 * cosX - z * sinX;

      // Apply zoom and pan
      return {
        x: x1 * zoom + width / 2 + pan.x,
        y: y2 * zoom + height / 2 + pan.y
      };
    };

    const scaleFactor = 0.15;

    // Draw rooms
    (activeFloor.rooms || []).forEach(room => {
      const x1 = room.x * scaleFactor;
      const y1 = room.y * scaleFactor;
      const x2 = (room.x + room.width) * scaleFactor;
      const y2 = (room.y + room.height) * scaleFactor;

      ctx.fillStyle = (room.color || 'rgba(100,200,255,0.15)').replace('0.15', '0.3');
      ctx.beginPath();
      const p1 = project(x1, y1);
      const p2 = project(x2, y1);
      const p3 = project(x2, y2);
      const p4 = project(x1, y2);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();
    });

    // Draw walls with height
    (activeFloor.walls || []).forEach(wall => {
      const x1 = wall.start.x * scaleFactor;
      const y1 = wall.start.y * scaleFactor;
      const x2 = wall.end.x * scaleFactor;
      const y2 = wall.end.y * scaleFactor;
      const wallHeight = ((wall.height || DEFAULT_WALL_HEIGHT) / 12) * 8; // Scale height

      ctx.fillStyle = wall.type === 'exterior' ? 'rgba(200,220,240,0.9)' : 'rgba(160,180,200,0.8)';
      ctx.strokeStyle = 'rgba(100,140,180,0.8)';
      ctx.lineWidth = 1;

      const wp1 = project(x1, y1, 0);
      const wp2 = project(x2, y2, 0);
      const wp3 = project(x2, y2, wallHeight);
      const wp4 = project(x1, y1, wallHeight);

      ctx.beginPath();
      ctx.moveTo(wp1.x, wp1.y);
      ctx.lineTo(wp2.x, wp2.y);
      ctx.lineTo(wp3.x, wp3.y);
      ctx.lineTo(wp4.x, wp4.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // Draw stairs
    (activeFloor.stairs || []).forEach(stair => {
      const x = stair.x * scaleFactor;
      const y = stair.y * scaleFactor;
      const hw = (stair.width / 2) * scaleFactor;
      const hh = (stair.height / 2) * scaleFactor;

      // Draw step by step
      const steps = stair.steps || 12;
      const stepHeight = 60 / steps;

      for (let i = 0; i < steps; i++) {
        const z = i * stepHeight;
        const yOffset = (i / steps) * hh * 2;

        ctx.fillStyle = `rgba(180,160,120,${0.7 + i * 0.02})`;
        const sp1 = project(x - hw, y - hh + yOffset, z);
        const sp2 = project(x + hw, y - hh + yOffset, z);
        const sp3 = project(x + hw, y - hh + yOffset + hh / steps, z);
        const sp4 = project(x - hw, y - hh + yOffset + hh / steps, z);
        ctx.beginPath();
        ctx.moveTo(sp1.x, sp1.y);
        ctx.lineTo(sp2.x, sp2.y);
        ctx.lineTo(sp3.x, sp3.y);
        ctx.lineTo(sp4.x, sp4.y);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Draw furniture
    (activeFloor.furniture || []).forEach(furn => {
      const x = furn.x * scaleFactor;
      const y = furn.y * scaleFactor;
      const hw = (furn.width / 2) * scaleFactor;
      const hh = (furn.height / 2) * scaleFactor;
      const fh = 15;

      // Base
      ctx.fillStyle = 'rgba(80,100,120,0.9)';
      const fp1 = project(x - hw, y - hh, 0);
      const fp2 = project(x + hw, y - hh, 0);
      const fp3 = project(x + hw, y + hh, 0);
      const fp4 = project(x - hw, y + hh, 0);
      ctx.beginPath();
      ctx.moveTo(fp1.x, fp1.y);
      ctx.lineTo(fp2.x, fp2.y);
      ctx.lineTo(fp3.x, fp3.y);
      ctx.lineTo(fp4.x, fp4.y);
      ctx.closePath();
      ctx.fill();

      // Top
      ctx.fillStyle = 'rgba(100,130,160,0.9)';
      const ft1 = project(x - hw, y - hh, fh);
      const ft2 = project(x + hw, y - hh, fh);
      const ft3 = project(x + hw, y + hh, fh);
      const ft4 = project(x - hw, y + hh, fh);
      ctx.beginPath();
      ctx.moveTo(ft1.x, ft1.y);
      ctx.lineTo(ft2.x, ft2.y);
      ctx.lineTo(ft3.x, ft3.y);
      ctx.lineTo(ft4.x, ft4.y);
      ctx.closePath();
      ctx.fill();

      // Icon
      if (furn.icon) {
        const fc = project(x, y, fh + 5);
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(furn.icon, fc.x, fc.y);
      }
    });

    // Draw roofs
    (activeFloor.roofs || []).forEach(roof => {
      const x1 = roof.x * scaleFactor;
      const y1 = roof.y * scaleFactor;
      const x2 = (roof.x + roof.width) * scaleFactor;
      const y2 = (roof.y + roof.height) * scaleFactor;
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;

      // Base height of roof (on top of walls)
      const baseZ = DEFAULT_WALL_HEIGHT / 12 * 8;
      // Ridge height
      const ridgeZ = baseZ + 40;

      ctx.fillStyle = 'rgba(139,90,43,0.8)';
      ctx.strokeStyle = 'rgba(100,60,20,0.8)';
      ctx.lineWidth = 1;

      if (roof.ridgeDirection === 'horizontal') {
        // Ridge runs left-right
        const rp1 = project(x1, y1, baseZ);
        const rp2 = project(x2, y1, baseZ);
        const rp3 = project(x2, cy, ridgeZ);
        const rp4 = project(x1, cy, ridgeZ);

        ctx.beginPath();
        ctx.moveTo(rp1.x, rp1.y);
        ctx.lineTo(rp2.x, rp2.y);
        ctx.lineTo(rp3.x, rp3.y);
        ctx.lineTo(rp4.x, rp4.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const rp5 = project(x1, y2, baseZ);
        const rp6 = project(x2, y2, baseZ);

        ctx.beginPath();
        ctx.moveTo(rp4.x, rp4.y);
        ctx.lineTo(rp3.x, rp3.y);
        ctx.lineTo(rp6.x, rp6.y);
        ctx.lineTo(rp5.x, rp5.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Ridge runs top-bottom
        const rp1 = project(x1, y1, baseZ);
        const rp2 = project(cx, y1, ridgeZ);
        const rp3 = project(cx, y2, ridgeZ);
        const rp4 = project(x1, y2, baseZ);

        ctx.beginPath();
        ctx.moveTo(rp1.x, rp1.y);
        ctx.lineTo(rp2.x, rp2.y);
        ctx.lineTo(rp3.x, rp3.y);
        ctx.lineTo(rp4.x, rp4.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const rp5 = project(x2, y1, baseZ);
        const rp6 = project(x2, y2, baseZ);

        ctx.beginPath();
        ctx.moveTo(rp2.x, rp2.y);
        ctx.lineTo(rp5.x, rp5.y);
        ctx.lineTo(rp6.x, rp6.y);
        ctx.lineTo(rp3.x, rp3.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    });

  }, [activeFloor, rotation, zoom, pan, width, height]);

  // Mouse handlers
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (e.shiftKey) {
      // Pan
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    } else {
      // Rotate
      setRotation(r => ({
        x: Math.max(-60, Math.min(60, r.x + dy * 0.5)),
        y: r.y + dx * 0.5
      }));
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.3, Math.min(3, z * delta)));
  }, []);

  const handleReset = useCallback(() => {
    setRotation({ x: 30, y: 45 });
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || e.touches.length !== 1) return;

    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;

    // Rotate
    setRotation(r => ({
      x: Math.max(-60, Math.min(60, r.x + dy * 0.5)),
      y: r.y + dx * 0.5
    }));
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      style={{
        position: isMobile ? 'fixed' : 'absolute',
        top: isMobile ? '60px' : '16px',
        right: isMobile ? '10px' : '16px',
        background: 'rgba(8,12,16,0.98)',
        border: '1px solid rgba(0,200,255,0.2)',
        borderRadius: '10px',
        overflow: 'hidden',
        zIndex: 250,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '6px 10px',
          borderBottom: '1px solid rgba(0,200,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#fff', fontSize: '10px', fontWeight: '500' }}>
          3D Preview
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#6080a0',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          ×
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      />

      {/* Controls */}
      <div
        style={{
          padding: '6px 10px',
          borderTop: '1px solid rgba(0,200,255,0.1)',
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setZoom(z => Math.min(3, z * 1.2))}
            style={{
              padding: '2px 6px',
              background: 'rgba(0,200,255,0.1)',
              border: '1px solid rgba(0,200,255,0.2)',
              borderRadius: '3px',
              color: '#00c8ff',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            +
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.3, z * 0.8))}
            style={{
              padding: '2px 6px',
              background: 'rgba(0,200,255,0.1)',
              border: '1px solid rgba(0,200,255,0.2)',
              borderRadius: '3px',
              color: '#00c8ff',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            −
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '2px 6px',
              background: 'rgba(0,200,255,0.1)',
              border: '1px solid rgba(0,200,255,0.2)',
              borderRadius: '3px',
              color: '#00c8ff',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
        <span style={{ color: '#6080a0', fontSize: '8px' }}>
          {isMobile ? 'Drag to rotate' : 'Drag to rotate • Shift+drag to pan • Scroll to zoom'}
        </span>
      </div>
    </div>
  );
};

export default ThreeDView;
