import { useState, useCallback, useRef } from 'react';
import { hitTestAnnotation } from '../components/canvas/renderers/annotationRenderer';

/**
 * Hook for handling annotation tool interactions
 */
export const useAnnotationTool = ({
  annotations,
  addAnnotation,
  updateAnnotation,
  removeAnnotation,
  annotationSettings,
  selectedAnnotations,
  setSelectedAnnotations,
  scale,
  setScale,
  offset,
  setOffset,
  canvasRef,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingAnnotation, setDrawingAnnotation] = useState(null);
  const [pinchStart, setPinchStart] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const currentAnnotationId = useRef(null);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((clientX, clientY) => {
    const canvas = canvasRef?.current;
    if (!canvas) return { x: clientX, y: clientY };

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - offset.x) / scale;
    const y = (clientY - rect.top - offset.y) / scale;

    return { x, y };
  }, [canvasRef, scale, offset]);

  // Handle pointer down for annotation tools
  const handleAnnotationPointerDown = useCallback((e, tool) => {
    // Handle two-finger gestures for pinch-to-zoom and pan
    if (e.touches?.length === 2 && setScale && setOffset) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

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

    const pos = screenToCanvas(e.clientX, e.clientY);

    // If select tool, try to select an annotation and start dragging
    if (tool === 'annotation-select') {
      const hit = hitTestAnnotation(annotations, pos.x, pos.y, scale);
      if (hit) {
        // Check if clicking on already selected annotation - start drag
        if (selectedAnnotations.includes(hit.id)) {
          setIsDragging(true);
          setDragStart(pos);
        } else {
          setSelectedAnnotations([hit.id]);
          // Start drag immediately for newly selected annotation
          setIsDragging(true);
          setDragStart(pos);
        }
      } else {
        setSelectedAnnotations([]);
        setIsDragging(false);
        setDragStart(null);
      }
      return;
    }

    setIsDrawing(true);

    switch (tool) {
      case 'annotation-arrow':
        setDrawingAnnotation({
          type: 'arrow',
          start: pos,
          end: pos,
          color: annotationSettings.color,
          thickness: annotationSettings.thickness,
        });
        break;

      case 'annotation-freehand':
        setDrawingAnnotation({
          type: 'freehand',
          points: [pos],
          color: annotationSettings.color,
          thickness: annotationSettings.thickness,
        });
        break;

      case 'annotation-circle':
        setDrawingAnnotation({
          type: 'circle',
          center: pos,
          radiusX: 0,
          radiusY: 0,
          color: annotationSettings.color,
          thickness: annotationSettings.thickness,
        });
        break;

      case 'annotation-rectangle':
        setDrawingAnnotation({
          type: 'rectangle',
          start: pos,
          end: pos,
          color: annotationSettings.color,
          thickness: annotationSettings.thickness,
        });
        break;

      case 'annotation-cloud':
        // Cloud is drawn like a rectangle - drag to define bounding box
        setDrawingAnnotation({
          type: 'cloud',
          start: pos,
          end: pos,
          color: annotationSettings.color,
          thickness: annotationSettings.thickness,
        });
        break;

      case 'annotation-stamp':
        // Stamps are placed immediately on click
        const stampId = addAnnotation({
          type: 'stamp',
          position: pos,
          stampType: annotationSettings.stampType || 'demo',
          rotation: 0,
        });
        setSelectedAnnotations([stampId]);
        setIsDrawing(false);
        break;

      case 'annotation-callout':
        // Callouts are placed immediately on click
        // Auto-number based on existing callouts
        const existingCallouts = annotations.filter(a => a.type === 'callout');
        const nextNumber = existingCallouts.length + 1;
        const calloutId = addAnnotation({
          type: 'callout',
          position: pos,
          number: nextNumber,
          noteText: '',
        });
        setSelectedAnnotations([calloutId]);
        setIsDrawing(false);
        break;

      default:
        setIsDrawing(false);
    }
  }, [screenToCanvas, annotations, annotationSettings, addAnnotation, setSelectedAnnotations, selectedAnnotations, scale, offset, setScale, setOffset]);

  // Handle pointer move for annotation tools
  const handleAnnotationPointerMove = useCallback((e, tool) => {
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
      const canvas = canvasRef?.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const initialPinchCenterX = pinchStart.centerX - rect.left;
        const initialPinchCenterY = pinchStart.centerY - rect.top;

        const scaleRatio = newScale / pinchStart.scale;
        const newOffsetX = initialPinchCenterX - (initialPinchCenterX - pinchStart.offsetX) * scaleRatio;
        const newOffsetY = initialPinchCenterY - (initialPinchCenterY - pinchStart.offsetY) * scaleRatio;

        // Also handle two-finger pan
        const panDeltaX = centerX - pinchStart.centerX;
        const panDeltaY = centerY - pinchStart.centerY;

        setScale(newScale);
        setOffset({ x: newOffsetX + panDeltaX, y: newOffsetY + panDeltaY });
      }
      return;
    }

    // Handle dragging selected annotations
    if (isDragging && dragStart && selectedAnnotations.length > 0 && tool === 'annotation-select') {
      const pos = screenToCanvas(e.clientX, e.clientY);
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;

      // Update each selected annotation's position
      selectedAnnotations.forEach(id => {
        const annotation = annotations.find(a => a.id === id);
        if (!annotation) return;

        // Move annotation based on its type
        switch (annotation.type) {
          case 'arrow':
            updateAnnotation(id, {
              start: { x: annotation.start.x + dx, y: annotation.start.y + dy },
              end: { x: annotation.end.x + dx, y: annotation.end.y + dy },
            });
            break;
          case 'freehand':
            updateAnnotation(id, {
              points: annotation.points.map(p => ({ x: p.x + dx, y: p.y + dy })),
            });
            break;
          case 'circle':
            updateAnnotation(id, {
              center: { x: annotation.center.x + dx, y: annotation.center.y + dy },
            });
            break;
          case 'rectangle':
          case 'cloud':
            updateAnnotation(id, {
              start: { x: annotation.start.x + dx, y: annotation.start.y + dy },
              end: { x: annotation.end.x + dx, y: annotation.end.y + dy },
            });
            break;
          case 'stamp':
          case 'callout':
            updateAnnotation(id, {
              position: { x: annotation.position.x + dx, y: annotation.position.y + dy },
            });
            break;
          default:
            break;
        }
      });

      setDragStart(pos);
      return;
    }

    if (!isDrawing || !drawingAnnotation) return;

    const pos = screenToCanvas(e.clientX, e.clientY);

    switch (tool) {
      case 'annotation-arrow':
        setDrawingAnnotation(prev => ({
          ...prev,
          end: pos,
        }));
        break;

      case 'annotation-freehand':
        setDrawingAnnotation(prev => ({
          ...prev,
          points: [...prev.points, pos],
        }));
        break;

      case 'annotation-circle':
        const dx = pos.x - drawingAnnotation.center.x;
        const dy = pos.y - drawingAnnotation.center.y;
        setDrawingAnnotation(prev => ({
          ...prev,
          radiusX: Math.abs(dx),
          radiusY: Math.abs(dy),
        }));
        break;

      case 'annotation-rectangle':
        setDrawingAnnotation(prev => ({
          ...prev,
          end: pos,
        }));
        break;

      case 'annotation-cloud':
        // Cloud is drawn like a rectangle
        setDrawingAnnotation(prev => ({
          ...prev,
          end: pos,
        }));
        break;

      default:
        break;
    }
  }, [isDrawing, drawingAnnotation, screenToCanvas, pinchStart, setScale, setOffset, canvasRef, isDragging, dragStart, selectedAnnotations, annotations, updateAnnotation]);

  // Handle pointer up for annotation tools
  const handleAnnotationPointerUp = useCallback((e, tool) => {
    // Clear pinch state
    if (pinchStart) {
      setPinchStart(null);
      setIsPanning(false);
    }

    // Clear drag state
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
    }

    if (!isDrawing || !drawingAnnotation) {
      setIsDrawing(false);
      return;
    }

    // Validate the annotation before adding
    let isValid = true;

    switch (tool) {
      case 'annotation-arrow':
        // Arrow needs minimum length
        const arrowLength = Math.sqrt(
          Math.pow(drawingAnnotation.end.x - drawingAnnotation.start.x, 2) +
          Math.pow(drawingAnnotation.end.y - drawingAnnotation.start.y, 2)
        );
        isValid = arrowLength > 10;
        break;

      case 'annotation-freehand':
        // Freehand needs minimum points
        isValid = drawingAnnotation.points.length > 2;
        break;

      case 'annotation-circle':
        // Circle needs minimum radius
        isValid = drawingAnnotation.radiusX > 5 || drawingAnnotation.radiusY > 5;
        break;

      case 'annotation-rectangle':
        // Rectangle needs minimum size
        const width = Math.abs(drawingAnnotation.end.x - drawingAnnotation.start.x);
        const height = Math.abs(drawingAnnotation.end.y - drawingAnnotation.start.y);
        isValid = width > 5 && height > 5;
        break;

      case 'annotation-cloud':
        // Cloud needs minimum size (like rectangle)
        const cloudWidth = Math.abs(drawingAnnotation.end.x - drawingAnnotation.start.x);
        const cloudHeight = Math.abs(drawingAnnotation.end.y - drawingAnnotation.start.y);
        isValid = cloudWidth > 20 && cloudHeight > 20;
        break;

      default:
        break;
    }

    if (isValid) {
      const id = addAnnotation(drawingAnnotation);
      setSelectedAnnotations([id]);
    }

    setDrawingAnnotation(null);
    setIsDrawing(false);
  }, [isDrawing, drawingAnnotation, addAnnotation, setSelectedAnnotations, pinchStart, isDragging]);

  // Handle double click for cloud tool (to close the shape)
  const handleAnnotationDoubleClick = useCallback((e, tool) => {
    if (tool === 'annotation-cloud' && drawingAnnotation && drawingAnnotation.points.length >= 3) {
      const id = addAnnotation(drawingAnnotation);
      setSelectedAnnotations([id]);
      setDrawingAnnotation(null);
      setIsDrawing(false);
    }
  }, [drawingAnnotation, addAnnotation, setSelectedAnnotations]);

  // Add point to cloud (on click)
  const handleCloudClick = useCallback((e) => {
    if (!drawingAnnotation || drawingAnnotation.type !== 'cloud') return;

    const pos = screenToCanvas(e.clientX, e.clientY);
    setDrawingAnnotation(prev => ({
      ...prev,
      points: [...prev.points, pos],
    }));
  }, [drawingAnnotation, screenToCanvas]);

  // Delete selected annotations
  const deleteSelectedAnnotations = useCallback(() => {
    selectedAnnotations.forEach(id => removeAnnotation(id));
    setSelectedAnnotations([]);
  }, [selectedAnnotations, removeAnnotation, setSelectedAnnotations]);

  return {
    isDrawing,
    drawingAnnotation,
    handleAnnotationPointerDown,
    handleAnnotationPointerMove,
    handleAnnotationPointerUp,
    handleAnnotationDoubleClick,
    handleCloudClick,
    deleteSelectedAnnotations,
  };
};

export default useAnnotationTool;
