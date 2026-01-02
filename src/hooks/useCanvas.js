import { useState, useRef, useCallback, useEffect } from 'react';
import { GRID_SIZE } from '../constants/grid';

/**
 * useCanvas hook for managing canvas pan/zoom state
 *
 * @param {object} options - Configuration options
 * @returns {object} - Canvas state and handlers
 */
export const useCanvas = (options = {}) => {
  const {
    initialZoom = 1,
    minZoom = 0.1,
    maxZoom = 5,
    initialOffset = { x: 100, y: 100 },
  } = options;

  // Canvas ref
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Transform state
  const [zoom, setZoom] = useState(initialZoom);
  const [offset, setOffset] = useState(initialOffset);

  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const offsetStartRef = useRef({ x: 0, y: 0 });

  // Pinch zoom state
  const lastPinchDistRef = useRef(0);
  const lastPinchCenterRef = useRef({ x: 0, y: 0 });

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX, screenY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: screenX, y: screenY };

    return {
      x: (screenX - rect.left - offset.x) / zoom,
      y: (screenY - rect.top - offset.y) / zoom,
    };
  }, [zoom, offset]);

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = useCallback((canvasX, canvasY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: canvasX, y: canvasY };

    return {
      x: canvasX * zoom + offset.x + rect.left,
      y: canvasY * zoom + offset.y + rect.top,
    };
  }, [zoom, offset]);

  // Snap value to grid
  const snapToGrid = useCallback((value, gridSize = GRID_SIZE) => {
    return Math.round(value / gridSize) * gridSize;
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();

    // Get mouse position relative to canvas from the event target
    const rect = e.currentTarget?.getBoundingClientRect();
    if (!rect) {
      // Fallback: simple zoom without position adjustment
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(maxZoom, Math.max(minZoom, zoom * delta));
      setZoom(newZoom);
      return;
    }

    // Get mouse position relative to canvas
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate new zoom
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(maxZoom, Math.max(minZoom, zoom * delta));

    // Adjust offset to zoom toward mouse position
    const zoomRatio = newZoom / zoom;
    const newOffsetX = mouseX - (mouseX - offset.x) * zoomRatio;
    const newOffsetY = mouseY - (mouseY - offset.y) * zoomRatio;

    setZoom(newZoom);
    setOffset({ x: newOffsetX, y: newOffsetY });
  }, [zoom, offset, minZoom, maxZoom]);

  // Start panning
  const startPan = useCallback((clientX, clientY) => {
    setIsPanning(true);
    panStartRef.current = { x: clientX, y: clientY };
    offsetStartRef.current = { ...offset };
  }, [offset]);

  // Update pan
  const updatePan = useCallback((clientX, clientY) => {
    if (!isPanning) return;

    const dx = clientX - panStartRef.current.x;
    const dy = clientY - panStartRef.current.y;

    setOffset({
      x: offsetStartRef.current.x + dx,
      y: offsetStartRef.current.y + dy,
    });
  }, [isPanning]);

  // End panning
  const endPan = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handle pinch zoom start
  const handlePinchStart = useCallback((touches) => {
    if (touches.length !== 2) return;

    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    lastPinchDistRef.current = Math.sqrt(dx * dx + dy * dy);
    lastPinchCenterRef.current = {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }, []);

  // Handle pinch zoom move
  const handlePinchMove = useCallback((touches) => {
    if (touches.length !== 2) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate new distance
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    const newDist = Math.sqrt(dx * dx + dy * dy);

    // Calculate new center
    const newCenter = {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };

    // Calculate zoom delta
    const scale = newDist / lastPinchDistRef.current;
    const newZoom = Math.min(maxZoom, Math.max(minZoom, zoom * scale));

    // Calculate pan delta
    const panDx = newCenter.x - lastPinchCenterRef.current.x;
    const panDy = newCenter.y - lastPinchCenterRef.current.y;

    // Adjust offset for zoom and pan
    const centerX = newCenter.x - rect.left;
    const centerY = newCenter.y - rect.top;
    const zoomRatio = newZoom / zoom;

    const newOffsetX = centerX - (centerX - offset.x) * zoomRatio + panDx;
    const newOffsetY = centerY - (centerY - offset.y) * zoomRatio + panDy;

    setZoom(newZoom);
    setOffset({ x: newOffsetX, y: newOffsetY });

    // Update last values
    lastPinchDistRef.current = newDist;
    lastPinchCenterRef.current = newCenter;
  }, [zoom, offset, minZoom, maxZoom]);

  // Reset view
  const resetView = useCallback(() => {
    setZoom(initialZoom);
    setOffset(initialOffset);
  }, [initialZoom, initialOffset]);

  // Zoom in
  const zoomIn = useCallback(() => {
    const newZoom = Math.min(maxZoom, zoom * 1.2);
    setZoom(newZoom);
  }, [zoom, maxZoom]);

  // Zoom out
  const zoomOut = useCallback(() => {
    const newZoom = Math.max(minZoom, zoom / 1.2);
    setZoom(newZoom);
  }, [zoom, minZoom]);

  // Zoom to fit content
  const zoomToFit = useCallback((bounds, padding = 50) => {
    // Use containerRef since that's what's attached to the main div
    const element = containerRef.current || canvasRef.current;
    if (!element || !bounds) return;

    const rect = element.getBoundingClientRect();
    const canvasWidth = rect.width - padding * 2;
    const canvasHeight = rect.height - padding * 2;

    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;

    if (contentWidth === 0 || contentHeight === 0) return;

    const scaleX = canvasWidth / contentWidth;
    const scaleY = canvasHeight / contentHeight;
    const newZoom = Math.min(Math.min(scaleX, scaleY), maxZoom);

    // Center content
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    const newOffsetX = rect.width / 2 - centerX * newZoom;
    const newOffsetY = rect.height / 2 - centerY * newZoom;

    setZoom(newZoom);
    setOffset({ x: newOffsetX, y: newOffsetY });
  }, [maxZoom]);

  // Center on point
  const centerOn = useCallback((x, y) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setOffset({
      x: rect.width / 2 - x * zoom,
      y: rect.height / 2 - y * zoom,
    });
  }, [zoom]);

  return {
    // Refs
    canvasRef,
    containerRef,

    // State
    zoom,
    offset,
    isPanning,

    // Setters
    setZoom,
    setOffset,

    // Coordinate conversion
    screenToCanvas,
    canvasToScreen,
    snapToGrid,

    // Event handlers
    handleWheel,
    startPan,
    updatePan,
    endPan,
    handlePinchStart,
    handlePinchMove,

    // Actions
    resetView,
    zoomIn,
    zoomOut,
    zoomToFit,
    centerOn,
  };
};

export default useCanvas;
