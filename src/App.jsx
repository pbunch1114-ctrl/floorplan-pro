import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFloorPlan } from './hooks/useFloorPlan';
import { useCanvas } from './hooks/useCanvas';
import { useLayers } from './hooks/useLayers';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { Toolbar, MobileToolbar } from './components/toolbar';
import { FurnitureLibrary, StairsLibrary, ElectricalLibrary, PlumbingLibrary, LayersPanel, SheetsPanel, SettingsPanel } from './components/sidebar';
import { WallEditor, RoofEditor, DoorEditor, WindowEditor, FurnitureEditor, TextEditor, PolylineEditor, HatchEditor, RoomEditor, TempDimensionEditor, WallTempDimensionEditor } from './components/editors';
import { Button } from './components/ui';
import { FloorPlanCanvas } from './components/canvas';
import { ElevationView, ThreeDView, PaperSpaceView } from './components/views';
import { FileMenu, MobileMenu, SaveDialog, RecentProjects } from './components/menu';
import { MaterialCalculator } from './components/Materials';
import { saveAutoSave, loadAutoSave, addToRecentProjects, getSavedProjectName, clearAutoSave, hasAutoSave } from './utils/storage';
import { calculateTotalFloorArea } from './utils/materialCalculations';
import { PDFImporter, PDFControls } from './components/pdf/PDFImporter';
import { ScaleCalibration } from './components/pdf/ScaleCalibration';
import { AnnotationToolbar, StampSelector, AnnotationSettingsPanel, CalloutNotesPanel } from './components/annotation';
import { useAnnotationTool } from './hooks/useAnnotationTool';
import { ExportModal } from './components/export';
import { exportToPDF, exportToPNG, exportToJPEG } from './utils/exportPDF';
import { formatMeasurement } from './utils/measurements';
import { createDefaultSheet } from './constants/paper';

/**
 * FloorPlan Pro - Main Application Component
 *
 * Full-featured floor plan editor with modular Vite + React architecture.
 */
function App() {
  // Device detection
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      // Check for touch capability
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      // Consider mobile if: small width OR (touch device with small height in landscape)
      // This handles phones in landscape mode which may have width > 768 but small height
      const smallerDimension = Math.min(width, height);
      const isMobileDevice = smallerDimension < 768 || (hasTouch && height < 500);
      setIsMobile(isMobileDevice);
      setIsTablet(!isMobileDevice && width >= 768 && width < 1024);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Floor plan state with undo/redo
  const {
    floors,
    activeFloorId,
    setActiveFloorId,
    activeFloor,
    updateActiveFloor,
    selectedItems,
    setSelectedItems,
    addWall,
    updateWall,
    removeWall,
    addDoor,
    addWindow,
    addFurniture,
    addRoof,
    updateRoof,
    removeRoof,
    addFloor,
    undo,
    redo,
    canUndo,
    canRedo,
    newFile,
    exportToJSON,
    importFromJSON,
    pdfLayer,
    importPdfLayer,
    updatePdfLayer,
    removePdfLayer,
    calibratePdfScale,
    annotations,
    annotationSettings,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    clearAnnotations,
    updateAnnotationSettings,
  } = useFloorPlan();

  // Canvas ref
  const canvasRef = useRef(null);

  // Canvas state
  const {
    containerRef,
    zoom,
    setZoom,
    offset,
    setOffset,
    screenToCanvas,
    handleWheel,
    startPan,
    updatePan,
    endPan,
    zoomIn,
    zoomOut,
    resetView,
    zoomToFit,
  } = useCanvas();

  // Layers state
  const {
    layers,
    toggleVisibility,
    toggleLock,
    setColor,
    showAll,
    hideAll,
    isVisible,
    isLocked,
  } = useLayers();

  // Tool state
  const [tool, setTool] = useState('wall');
  const [toolTab, setToolTab] = useState('draw');
  const [wallType, setWallType] = useState('exterior');
  const [wallDetailLevel, setWallDetailLevel] = useState('simple');
  const [gridSize, setGridSize] = useState('6"');
  const [angleSnap, setAngleSnap] = useState('45');
  const [showDimensions, setShowDimensions] = useState(true);
  const [showTempDimensions, setShowTempDimensions] = useState(true);
  const [showGrips, setShowGrips] = useState(true);
  const [thinLines, setThinLines] = useState(false);
  const [fontStyle, setFontStyle] = useState('modern');

  // Snap settings - which snap types are enabled
  const [snaps, setSnaps] = useState({
    endpoint: true,
    midpoint: true,
    perpendicular: true,
    nearest: true,
    grid: true,
  });

  // Track selection source: 'draw' (just created), 'click' (user clicked), or null
  // On mobile, we defer showing editors for 'draw' selections to avoid interrupting workflow
  const [selectionSource, setSelectionSource] = useState(null);

  // Track selected vertex index for polyline/hatch editors (for visual highlighting on canvas)
  const [selectedVertexIndex, setSelectedVertexIndex] = useState(null);

  // Canvas interaction
  const {
    isDrawing,
    drawStart,
    drawEnd,
    isPanning,
    moveBasePoint,
    movePreviewPoint,
    rotateCenter,
    rotateStartAngle,
    rotatePreviewAngle,
    snapGuidelines,
    activeSnap,
    polarAngle,
    gripCursorPosition,
    polylinePoints,
    hatchPoints,
    roomPoints,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
    cancelPolyline,
    cancelHatch,
    cancelRoom,
  } = useCanvasInteraction({
    activeFloor,
    updateActiveFloor,
    selectedItems,
    setSelectedItems,
    setSelectionSource,
    canvasRef,
    scale: zoom,
    setScale: setZoom,
    offset,
    setOffset,
    tool,
    wallType,
    gridSize,
    angleSnap,
    isMobile,
    layers,
    snaps,
  });

  // UI state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [viewMode, setViewMode] = useState('model'); // 'model', 'paper', or 'elevations'
  const [show3D, setShow3D] = useState(false);
  const [showScaleCalibration, setShowScaleCalibration] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showRecentProjects, setShowRecentProjects] = useState(false);
  const [showMaterialCalculator, setShowMaterialCalculator] = useState(false);
  const [projectName, setProjectName] = useState(() => getSavedProjectName());
  const [hasRestoredAutoSave, setHasRestoredAutoSave] = useState(false);

  // Annotation state
  const [selectedAnnotationIds, setSelectedAnnotationIds] = useState([]);
  const [annotationMode, setAnnotationMode] = useState(false); // Whether annotation tools are active

  // Annotation tool hook
  const {
    isDrawing: isDrawingAnnotation,
    drawingAnnotation,
    handleAnnotationPointerDown,
    handleAnnotationPointerMove,
    handleAnnotationPointerUp,
    handleAnnotationDoubleClick,
    deleteSelectedAnnotations,
  } = useAnnotationTool({
    annotations,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    annotationSettings,
    selectedAnnotations: selectedAnnotationIds,
    setSelectedAnnotations: setSelectedAnnotationIds,
    scale: zoom,
    setScale: setZoom,
    offset,
    setOffset,
    canvasRef,
  });

  // Units
  const [units, setUnits] = useState('imperial');

  // Sheets state for Paper Space
  const [sheets, setSheets] = useState([]);
  const [activeSheetId, setActiveSheetId] = useState(null);

  // Get active sheet
  const activeSheet = sheets.find(s => s.id === activeSheetId) || null;

  // Sheet management functions
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  const handleAddSheet = useCallback(() => {
    const newSheet = createDefaultSheet(generateId(), activeFloorId);
    newSheet.sheetNumber = `A${String(sheets.length + 1).padStart(2, '0')}`;
    setSheets(prev => [...prev, newSheet]);
    setActiveSheetId(newSheet.id);
  }, [sheets.length, activeFloorId]);

  const handleUpdateSheet = useCallback((sheetId, updates) => {
    setSheets(prev => prev.map(s => s.id === sheetId ? { ...s, ...updates } : s));
  }, []);

  const handleDeleteSheet = useCallback((sheetId) => {
    setSheets(prev => prev.filter(s => s.id !== sheetId));
    if (activeSheetId === sheetId) {
      setActiveSheetId(sheets[0]?.id || null);
    }
  }, [activeSheetId, sheets]);

  const handleSelectSheet = useCallback((sheetId) => {
    setActiveSheetId(sheetId);
    setViewMode('paper');
  }, []);

  // Get currently selected item
  const selectedItem = selectedItems.length === 1 ? selectedItems[0] : null;

  // Auto-restore from localStorage on initial load
  useEffect(() => {
    if (hasRestoredAutoSave) return;

    const saved = loadAutoSave();
    if (saved && saved.data) {
      try {
        if (importFromJSON(saved.data)) {
          setProjectName(saved.projectName || 'floorplan');
          console.log('Restored auto-saved project:', saved.projectName);
        }
      } catch (e) {
        console.warn('Failed to restore auto-save:', e);
      }
    }
    setHasRestoredAutoSave(true);
  }, [hasRestoredAutoSave, importFromJSON]);

  // Auto-save to localStorage when floor plan changes
  useEffect(() => {
    if (!hasRestoredAutoSave) return; // Don't save until we've tried to restore

    const data = exportToJSON();
    saveAutoSave(data, projectName);
  }, [floors, pdfLayer, annotations, annotationSettings, projectName, hasRestoredAutoSave, exportToJSON]);

  // Format measurement based on units
  const formatMeasurementFn = useCallback((feet) => {
    return formatMeasurement(feet, units);
  }, [units]);

  // Fit view to content - calculates bounds from floor plan and zooms to fit
  const fitToContent = useCallback(() => {
    if (!activeFloor) return;

    const walls = activeFloor.walls || [];
    const furniture = activeFloor.furniture || [];
    const rooms = activeFloor.rooms || [];

    // Collect all points
    const points = [];

    // Add wall endpoints
    walls.forEach(wall => {
      points.push(wall.start);
      points.push(wall.end);
    });

    // Add furniture positions
    furniture.forEach(f => {
      points.push({ x: f.x, y: f.y });
      // Include furniture size in bounds
      const width = f.width || 50;
      const height = f.height || 50;
      points.push({ x: f.x + width, y: f.y + height });
    });

    // Add room points
    rooms.forEach(room => {
      if (room.points) {
        room.points.forEach(p => points.push(p));
      }
    });

    // If no content, reset to default
    if (points.length === 0) {
      resetView();
      return;
    }

    // Calculate bounds
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    // Add some padding
    const padding = 50;
    zoomToFit({
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding,
    });
  }, [activeFloor, zoomToFit, resetView]);

  // Handle delete selected - accepts items to avoid stale closure
  const deleteSelected = useCallback((itemsToDelete) => {
    if (!itemsToDelete || !itemsToDelete.length) return;

    itemsToDelete.forEach(({ type, item, id }) => {
      // Get the item id - may be in item.id or directly in id
      const itemId = item?.id || id;

      if (type === 'wall') {
        updateActiveFloor(f => ({
          ...f,
          walls: f.walls.filter(w => w.id !== itemId),
          doors: f.doors.filter(d => d.wallId !== itemId),
          windows: f.windows.filter(w => w.wallId !== itemId),
        }));
      } else if (type === 'door') {
        updateActiveFloor(f => ({ ...f, doors: f.doors.filter(d => d.id !== itemId) }));
      } else if (type === 'window') {
        updateActiveFloor(f => ({ ...f, windows: f.windows.filter(w => w.id !== itemId) }));
      } else if (type === 'furniture') {
        updateActiveFloor(f => ({ ...f, furniture: f.furniture.filter(furn => furn.id !== itemId) }));
      } else if (type === 'room') {
        updateActiveFloor(f => ({ ...f, rooms: (f.rooms || []).filter(r => r.id !== itemId) }));
      } else if (type === 'roof') {
        updateActiveFloor(f => ({ ...f, roofs: (f.roofs || []).filter(r => r.id !== itemId) }));
      } else if (type === 'dimension') {
        updateActiveFloor(f => ({ ...f, dimensions: (f.dimensions || []).filter(d => d.id !== itemId) }));
      } else if (type === 'line') {
        updateActiveFloor(f => ({ ...f, lines: (f.lines || []).filter(l => l.id !== itemId) }));
      } else if (type === 'polyline') {
        updateActiveFloor(f => ({ ...f, polylines: (f.polylines || []).filter(p => p.id !== itemId) }));
      } else if (type === 'text') {
        updateActiveFloor(f => ({ ...f, texts: (f.texts || []).filter(t => t.id !== itemId) }));
      } else if (type === 'hatch') {
        updateActiveFloor(f => ({ ...f, hatches: (f.hatches || []).filter(h => h.id !== itemId) }));
      }
    });

    setSelectedItems([]);
  }, [updateActiveFloor, setSelectedItems]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if in input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();

      // Tool shortcuts
      if (key === 'v' || key === 'escape') setTool('select');
      if (key === 'w') setTool('wall');
      if (key === 'd') setTool('door');
      if (key === 'n') setTool('window');
      if (key === 'r') setTool('room');
      if (key === 'f') setTool('roof');
      if (key === 'p') setTool('pan');

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        e.preventDefault();
      }

      // Delete
      if (key === 'delete' || key === 'backspace') {
        // Delete selected annotations if any
        if (selectedAnnotationIds.length > 0) {
          deleteSelectedAnnotations();
          e.preventDefault();
        }
        // Delete selected floor plan items if any
        else if (selectedItems.length > 0) {
          deleteSelected(selectedItems);
          e.preventDefault();
        }
      }

      // Save
      if ((e.ctrlKey || e.metaKey) && key === 's') {
        e.preventDefault();
        setShowSaveDialog(true);
      }

      // Escape - cancel polyline/hatch/room drawing or deselect
      if (key === 'escape') {
        if (polylinePoints.length > 0) {
          cancelPolyline();
          e.preventDefault();
        } else if (hatchPoints.length > 0) {
          cancelHatch();
          e.preventDefault();
        } else if (roomPoints.length > 0) {
          cancelRoom();
          e.preventDefault();
        } else if (selectedItems.length > 0) {
          setSelectedItems([]);
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedItems, deleteSelected, exportToJSON, selectedAnnotationIds, deleteSelectedAnnotations, polylinePoints, cancelPolyline, hatchPoints, cancelHatch, roomPoints, cancelRoom, setSelectedItems]);

  // Close panels when clicking outside
  const handleBackgroundClick = useCallback(() => {
    setActivePanel(null);
    setShowMobileMenu(false);
  }, []);

  // Handle wheel event
  const onWheel = useCallback((e) => {
    handleWheel(e);
  }, [handleWheel]);

  // File operations
  const handleNewFile = useCallback(() => {
    if (confirm('Create a new project? Unsaved changes will be lost.')) {
      newFile();
      setProjectName('floorplan');
      clearAutoSave();
    }
  }, [newFile]);

  const handleSaveFile = useCallback(() => {
    // Show the save dialog to let user enter a filename
    setShowSaveDialog(true);
  }, []);

  const handleSaveWithName = useCallback((name) => {
    const data = exportToJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setProjectName(name);
    setShowSaveDialog(false);
    // Add to recent projects
    addToRecentProjects(name, data);
  }, [exportToJSON]);

  const handleLoadFile = useCallback((jsonData, loadedProjectName = null) => {
    if (importFromJSON(jsonData)) {
      if (loadedProjectName) {
        setProjectName(loadedProjectName);
      }
      setShowRecentProjects(false);
    } else {
      alert('Failed to load project. Invalid file format.');
    }
  }, [importFromJSON]);

  const handleLoadFromRecent = useCallback((jsonData, recentProjectName) => {
    handleLoadFile(jsonData, recentProjectName);
  }, [handleLoadFile]);

  const handleExport = useCallback(async (options) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      alert('No canvas to export');
      return;
    }

    try {
      if (options.format === 'pdf') {
        await exportToPDF(canvas, options);
      } else if (options.format === 'png') {
        exportToPNG(canvas, { projectName: options.projectName, scale: options.imageScale });
      } else if (options.format === 'jpeg') {
        exportToJPEG(canvas, { projectName: options.projectName, quality: options.jpegQuality });
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }, [canvasRef]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#080c10',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      {isMobile ? (
        <MobileToolbar
          tool={tool}
          onToolChange={setTool}
          onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
          onUndo={undo}
          onRedo={redo}
          onDelete={() => {
            if (selectedAnnotationIds.length > 0) {
              deleteSelectedAnnotations();
            } else if (selectedItems.length > 0) {
              deleteSelected(selectedItems);
            }
          }}
          canUndo={canUndo}
          canRedo={canRedo}
          hasSelection={selectedItems.length > 0 || selectedAnnotationIds.length > 0}
          activeTab={toolTab}
          onTabChange={(tab) => {
            setToolTab(tab);
            setAnnotationMode(tab === 'markup');
          }}
          onShowLayers={() => setActivePanel('layers')}
          onShowSettings={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
          onShowFurniture={() => setActivePanel(activePanel === 'furniture' ? null : 'furniture')}
          onShow3D={() => setShow3D(!show3D)}
          onShowElevations={() => setViewMode('elevations')}
          onShowStamps={() => setActivePanel('stamps')}
          onShowAnnotationSettings={() => setActivePanel('annotation-settings')}
          onShowCalloutNotes={() => setActivePanel('callout-notes')}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetView={fitToContent}
          panelOpen={activePanel !== null}
        />
      ) : (
        <Toolbar
          tool={tool}
          onToolChange={setTool}
          toolTab={toolTab}
          onToolTabChange={(tab) => {
            setToolTab(tab);
            setAnnotationMode(tab === 'markup');
          }}
          onShowStamps={() => setActivePanel('stamps')}
          onShowAnnotationSettings={() => setActivePanel('annotation-settings')}
          onShowCalloutNotes={() => setActivePanel('callout-notes')}
          wallType={wallType}
          onWallTypeChange={setWallType}
          isMobile={isMobile}
        />
      )}

      {/* Main content area */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Floor Plan Canvas */}
        <FloorPlanCanvas
          ref={canvasRef}
          activeFloor={activeFloor}
          selectedItems={selectedItems}
          scale={zoom}
          offset={offset}
          tool={tool}
          wallType={wallType}
          wallDetailLevel={wallDetailLevel}
          thinLines={thinLines}
          isDrawing={isDrawing}
          drawStart={drawStart}
          drawEnd={drawEnd}
          polylinePoints={polylinePoints}
          hatchPoints={hatchPoints}
          roomPoints={roomPoints}
          selectedVertexIndex={selectedVertexIndex}
          moveBasePoint={moveBasePoint}
          movePreviewPoint={movePreviewPoint}
          rotateCenter={rotateCenter}
          rotateStartAngle={rotateStartAngle}
          rotatePreviewAngle={rotatePreviewAngle}
          snapGuidelines={snapGuidelines}
          activeSnap={activeSnap}
          polarAngle={polarAngle}
          gripCursorPosition={gripCursorPosition}
          units={units}
          gridSize={gridSize}
          showDimensions={showDimensions}
          showTempDimensions={showTempDimensions}
          showGrips={showGrips}
          fontStyle={fontStyle}
          isMobile={isMobile}
          layers={layers}
          pdfLayer={pdfLayer}
          annotations={annotations}
          selectedAnnotationIds={selectedAnnotationIds}
          drawingAnnotation={drawingAnnotation}
          annotationsAboveFloorPlan={annotationSettings.aboveFloorPlan}
          onPointerDown={annotationMode && tool.startsWith('annotation-') ? (e) => handleAnnotationPointerDown(e, tool) : handlePointerDown}
          onPointerMove={annotationMode && tool.startsWith('annotation-') ? (e) => handleAnnotationPointerMove(e, tool) : handlePointerMove}
          onPointerUp={annotationMode && tool.startsWith('annotation-') ? (e) => handleAnnotationPointerUp(e, tool) : handlePointerUp}
          onDoubleClick={handleDoubleClick}
          onWheel={onWheel}
        />

        {/* Editable temporary dimensions for selected doors */}
        {selectedItem?.type === 'door' && (() => {
          const wall = activeFloor?.walls?.find(w => w.id === selectedItem.item.wallId);
          if (!wall) return null;
          return (
            <TempDimensionEditor
              element={selectedItem.item}
              elementType="door"
              wall={wall}
              scale={zoom}
              offset={offset}
              units={units}
              wallDetailLevel={wallDetailLevel}
              onUpdate={(updates) => {
                const door = selectedItem.item;
                const oldPosition = door.position;
                const newPosition = updates.position !== undefined ? updates.position : oldPosition;

                // Calculate old and new absolute positions
                const wallDx = wall.end.x - wall.start.x;
                const wallDy = wall.end.y - wall.start.y;
                const wallLength = Math.sqrt(wallDx * wallDx + wallDy * wallDy);

                const oldAbsPos = oldPosition * wallLength;
                const newAbsPos = newPosition * wallLength;

                const oldCenter = {
                  x: wall.start.x + (oldAbsPos / wallLength) * wallDx,
                  y: wall.start.y + (oldAbsPos / wallLength) * wallDy
                };
                const newCenter = {
                  x: wall.start.x + (newAbsPos / wallLength) * wallDx,
                  y: wall.start.y + (newAbsPos / wallLength) * wallDy
                };

                // Threshold for considering a dimension endpoint as "snapped" to the door
                const snapThreshold = 15;

                updateActiveFloor(f => {
                  // Update the door
                  const updatedDoors = f.doors.map(d =>
                    d.id === selectedItem.item.id ? { ...d, ...updates } : d
                  );

                  // Update any dimensions that have endpoints near the old door center
                  const updatedDimensions = (f.dimensions || []).map(dim => {
                    let updated = { ...dim };

                    // Check start point
                    const startDist = Math.sqrt(
                      Math.pow(dim.start.x - oldCenter.x, 2) +
                      Math.pow(dim.start.y - oldCenter.y, 2)
                    );
                    if (startDist < snapThreshold) {
                      updated.start = { ...newCenter };
                    }

                    // Check end point
                    const endDist = Math.sqrt(
                      Math.pow(dim.end.x - oldCenter.x, 2) +
                      Math.pow(dim.end.y - oldCenter.y, 2)
                    );
                    if (endDist < snapThreshold) {
                      updated.end = { ...newCenter };
                    }

                    return updated;
                  });

                  return {
                    ...f,
                    doors: updatedDoors,
                    dimensions: updatedDimensions
                  };
                });

                setSelectedItems(prev => prev.map(s => {
                  if (s.type === 'door' && s.item?.id === selectedItem.item.id) {
                    return { ...s, item: { ...s.item, ...updates } };
                  }
                  return s;
                }));
              }}
            />
          );
        })()}

        {/* Editable temporary dimensions for selected windows */}
        {selectedItem?.type === 'window' && (() => {
          const wall = activeFloor?.walls?.find(w => w.id === selectedItem.item.wallId);
          if (!wall) return null;
          return (
            <TempDimensionEditor
              element={selectedItem.item}
              elementType="window"
              wall={wall}
              scale={zoom}
              offset={offset}
              units={units}
              wallDetailLevel={wallDetailLevel}
              onUpdate={(updates) => {
                const window = selectedItem.item;
                const oldPosition = window.position;
                const newPosition = updates.position !== undefined ? updates.position : oldPosition;

                // Calculate old and new absolute positions
                const wallDx = wall.end.x - wall.start.x;
                const wallDy = wall.end.y - wall.start.y;
                const wallLength = Math.sqrt(wallDx * wallDx + wallDy * wallDy);

                const oldAbsPos = oldPosition * wallLength;
                const newAbsPos = newPosition * wallLength;

                const oldCenter = {
                  x: wall.start.x + (oldAbsPos / wallLength) * wallDx,
                  y: wall.start.y + (oldAbsPos / wallLength) * wallDy
                };
                const newCenter = {
                  x: wall.start.x + (newAbsPos / wallLength) * wallDx,
                  y: wall.start.y + (newAbsPos / wallLength) * wallDy
                };

                // Threshold for considering a dimension endpoint as "snapped" to the window
                const snapThreshold = 15;

                updateActiveFloor(f => {
                  // Update the window
                  const updatedWindows = f.windows.map(w =>
                    w.id === selectedItem.item.id ? { ...w, ...updates } : w
                  );

                  // Update any dimensions that have endpoints near the old window center
                  const updatedDimensions = (f.dimensions || []).map(dim => {
                    let updated = { ...dim };

                    // Check start point
                    const startDist = Math.sqrt(
                      Math.pow(dim.start.x - oldCenter.x, 2) +
                      Math.pow(dim.start.y - oldCenter.y, 2)
                    );
                    if (startDist < snapThreshold) {
                      updated.start = { ...newCenter };
                    }

                    // Check end point
                    const endDist = Math.sqrt(
                      Math.pow(dim.end.x - oldCenter.x, 2) +
                      Math.pow(dim.end.y - oldCenter.y, 2)
                    );
                    if (endDist < snapThreshold) {
                      updated.end = { ...newCenter };
                    }

                    return updated;
                  });

                  return {
                    ...f,
                    windows: updatedWindows,
                    dimensions: updatedDimensions
                  };
                });

                setSelectedItems(prev => prev.map(s => {
                  if (s.type === 'window' && s.item?.id === selectedItem.item.id) {
                    return { ...s, item: { ...s.item, ...updates } };
                  }
                  return s;
                }));
              }}
            />
          );
        })()}

        {/* Editable temporary dimension for selected walls */}
        {selectedItem?.type === 'wall' && (
          <WallTempDimensionEditor
            wall={selectedItem.item}
            scale={zoom}
            offset={offset}
            units={units}
            wallDetailLevel={wallDetailLevel}
            onUpdate={(updates) => {
              updateWall(selectedItem.item.id, updates);
              setSelectedItems(prev => prev.map(s => {
                if (s.type === 'wall' && s.item?.id === selectedItem.item.id) {
                  return { ...s, item: { ...s.item, ...updates } };
                }
                return s;
              }));
            }}
            onUpdateWithElements={(updates, oldLength, newLength) => {
              const wallId = selectedItem.item.id;

              // Update wall and recalculate door/window positions to keep them at absolute positions
              updateActiveFloor(f => {
                // Update doors on this wall - convert position to absolute, then back to new relative
                const updatedDoors = f.doors.map(door => {
                  if (door.wallId !== wallId) return door;
                  // Current absolute position along wall
                  const absolutePos = door.position * oldLength;
                  // New relative position for new wall length
                  const newPosition = absolutePos / newLength;
                  // Clamp to valid range (0-1)
                  return { ...door, position: Math.max(0.05, Math.min(0.95, newPosition)) };
                });

                // Update windows on this wall
                const updatedWindows = f.windows.map(window => {
                  if (window.wallId !== wallId) return window;
                  const absolutePos = window.position * oldLength;
                  const newPosition = absolutePos / newLength;
                  return { ...window, position: Math.max(0.05, Math.min(0.95, newPosition)) };
                });

                // Update the wall
                const updatedWalls = f.walls.map(w =>
                  w.id === wallId ? { ...w, ...updates } : w
                );

                return {
                  ...f,
                  walls: updatedWalls,
                  doors: updatedDoors,
                  windows: updatedWindows,
                };
              });

              // Update selected item
              setSelectedItems(prev => prev.map(s => {
                if (s.type === 'wall' && s.item?.id === wallId) {
                  return { ...s, item: { ...s.item, ...updates } };
                }
                return s;
              }));
            }}
          />
        )}

        {/* Quick action buttons (floating) - desktop only */}
        {!isMobile && (
          <div
            style={{
              position: 'absolute',
              bottom: 60,
              right: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              background: 'rgba(12,18,24,0.95)',
              padding: '8px',
              borderRadius: '10px',
              border: '1px solid rgba(0,200,255,0.2)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <Button variant="default" onClick={zoomIn} title="Zoom In">+</Button>
            <Button variant="default" onClick={zoomOut} title="Zoom Out">-</Button>
            <Button variant="default" onClick={fitToContent} title="Fit to Content">⟲</Button>
            <Button variant="default" onClick={() => setActivePanel('layers')} title="Layers">
              📑
            </Button>
            <Button variant="default" onClick={() => setActivePanel('sheets')} title="Sheets & Views">
              📋
            </Button>
            <Button variant="default" onClick={() => setActivePanel('furniture')} title="Furniture">
              🪑
            </Button>
            <Button
              variant={pdfLayer?.dataUrl ? 'primary' : 'default'}
              onClick={() => setActivePanel(pdfLayer?.dataUrl ? 'pdf-controls' : 'pdf-import')}
              title={pdfLayer?.dataUrl ? 'PDF Controls' : 'Import PDF'}
            >
              📄
            </Button>
            <Button variant="default" onClick={() => setViewMode('elevations')} title="Elevation Views">
              📐
            </Button>
            <Button variant="default" onClick={() => setShow3D(!show3D)} title="3D View">
              🧊
            </Button>
            <Button variant="default" onClick={() => setShowMaterialCalculator(true)} title="Material Calculator">
              🧮
            </Button>
          </div>
        )}

        {/* Undo/Redo buttons - desktop only */}
        {!isMobile && (
          <div
            style={{
              position: 'absolute',
              bottom: 60,
              left: 16,
              display: 'flex',
              gap: '6px',
              background: 'rgba(12,18,24,0.95)',
              padding: '8px',
              borderRadius: '10px',
              border: '1px solid rgba(0,200,255,0.2)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <Button
              variant="default"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              ↶
            </Button>
            <Button
              variant="default"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
            >
              ↷
            </Button>
          </div>
        )}

        {/* Library Panels */}
        {activePanel === 'furniture' && (
          <FurnitureLibrary
            onSelect={(item) => {
              addFurniture({
                ...item,
                x: 200,
                y: 200,
                rotation: 0,
              });
              setActivePanel(null);
            }}
            onClose={() => setActivePanel(null)}
            isMobile={isMobile}
          />
        )}
        {activePanel === 'stairs' && (
          <StairsLibrary
            onSelect={(item) => {
              // Add stairs logic
              setActivePanel(null);
            }}
            onClose={() => setActivePanel(null)}
            isMobile={isMobile}
          />
        )}
        {activePanel === 'electrical' && (
          <ElectricalLibrary
            onSelect={(item) => {
              // Add electrical logic
              setActivePanel(null);
            }}
            onClose={() => setActivePanel(null)}
            isMobile={isMobile}
          />
        )}
        {activePanel === 'plumbing' && (
          <PlumbingLibrary
            onSelect={(item) => {
              // Add plumbing logic
              setActivePanel(null);
            }}
            onClose={() => setActivePanel(null)}
            isMobile={isMobile}
          />
        )}
        {activePanel === 'layers' && (
          <LayersPanel
            layers={layers}
            onToggleVisibility={toggleVisibility}
            onToggleLock={toggleLock}
            onSetColor={setColor}
            onShowAll={showAll}
            onHideAll={hideAll}
            onClose={() => setActivePanel(null)}
            isMobile={isMobile}
          />
        )}
        {activePanel === 'settings' && (
          <SettingsPanel
            units={units}
            setUnits={setUnits}
            gridSize={gridSize}
            setGridSize={setGridSize}
            angleSnap={angleSnap}
            setAngleSnap={setAngleSnap}
            showDimensions={showDimensions}
            setShowDimensions={setShowDimensions}
            showTempDimensions={showTempDimensions}
            setShowTempDimensions={setShowTempDimensions}
            showGrips={showGrips}
            setShowGrips={setShowGrips}
            thinLines={thinLines}
            setThinLines={setThinLines}
            wallDetailLevel={wallDetailLevel}
            setWallDetailLevel={setWallDetailLevel}
            fontStyle={fontStyle}
            setFontStyle={setFontStyle}
            snaps={snaps}
            setSnaps={setSnaps}
            onClose={() => setActivePanel(null)}
            isMobile={isMobile}
          />
        )}
        {activePanel === 'sheets' && (
          <SheetsPanel
            sheets={sheets}
            activeSheetId={activeSheetId}
            onSelectSheet={handleSelectSheet}
            onAddSheet={handleAddSheet}
            onUpdateSheet={handleUpdateSheet}
            onDeleteSheet={handleDeleteSheet}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onClose={() => setActivePanel(null)}
            isMobile={isMobile}
          />
        )}

        {/* PDF Import Panel */}
        {activePanel === 'pdf-import' && (
          <PDFImporter
            onImport={(pdfData) => {
              importPdfLayer(pdfData);
              setActivePanel(null);
              // Prompt to calibrate scale after import
              setShowScaleCalibration(true);
            }}
            onClose={() => setActivePanel(null)}
            isMobile={isMobile}
          />
        )}

        {/* PDF Controls Panel */}
        {activePanel === 'pdf-controls' && pdfLayer?.dataUrl && (
          <PDFControls
            pdfLayer={pdfLayer}
            onUpdate={updatePdfLayer}
            onRemove={() => {
              removePdfLayer();
              setActivePanel(null);
            }}
            onRecalibrate={() => setShowScaleCalibration(true)}
            onClose={() => setActivePanel(null)}
            isMobile={isMobile}
          />
        )}

        {/* Scale Calibration Panel */}
        {showScaleCalibration && pdfLayer?.dataUrl && (
          <ScaleCalibration
            pdfLayer={pdfLayer}
            canvasRef={canvasRef}
            scale={zoom}
            offset={offset}
            onCalibrate={calibratePdfScale}
            onClose={() => setShowScaleCalibration(false)}
            isMobile={isMobile}
          />
        )}

        {/* Stamp Selector Panel */}
        {activePanel === 'stamps' && (
          <StampSelector
            selectedStamp={annotationSettings.stampType}
            onSelect={(stampType) => {
              updateAnnotationSettings({ stampType });
              setTool('annotation-stamp');
              setActivePanel(null);
            }}
            onClose={() => setActivePanel(null)}
            isMobile={isMobile}
          />
        )}

        {/* Annotation Settings Panel */}
        {activePanel === 'annotation-settings' && (
          <AnnotationSettingsPanel
            settings={annotationSettings}
            onSettingsChange={updateAnnotationSettings}
            onClose={() => setActivePanel(null)}
            isMobile={isMobile}
          />
        )}

        {/* Callout Notes Panel */}
        {activePanel === 'callout-notes' && (
          <CalloutNotesPanel
            annotations={annotations}
            onUpdateAnnotation={updateAnnotation}
            onClose={() => setActivePanel(null)}
            isMobile={isMobile}
          />
        )}

        {/* Export Modal */}
        {activePanel === 'export' && (
          <ExportModal
            onExport={handleExport}
            onClose={() => setActivePanel(null)}
            isMobile={isMobile}
            projectName={projectName}
            companyName=""
          />
        )}

        {/* Save Dialog */}
        {showSaveDialog && (
          <SaveDialog
            defaultName={projectName}
            onSave={handleSaveWithName}
            onClose={() => setShowSaveDialog(false)}
            isMobile={isMobile}
          />
        )}

        {/* Recent Projects Panel */}
        {showRecentProjects && (
          <RecentProjects
            onLoad={handleLoadFromRecent}
            onClose={() => setShowRecentProjects(false)}
            isMobile={isMobile}
          />
        )}

        {/* Material Calculator */}
        {showMaterialCalculator && (() => {
          // Scale: GRID_SIZE (20) pixels = 6 inches = 0.5 feet, so 40 pixels = 1 foot
          const PIXELS_PER_FOOT = 40;
          const floorArea = calculateTotalFloorArea(activeFloor?.walls || [], PIXELS_PER_FOOT);
          return (
            <MaterialCalculator
              sqft={floorArea.sqft}
              perimeter={floorArea.perimeter}
              walls={activeFloor?.walls || []}
              source={activeFloor?.walls?.length > 0 ? 'all' : 'manual'}
              onClose={() => setShowMaterialCalculator(false)}
              isMobile={isMobile}
            />
          );
        })()}

        {/* Property editors for selected items */}
        {/* On mobile, defer showing editors for just-drawn items to avoid interrupting workflow */}
        {selectedItem?.type === 'wall' && (!isMobile || selectionSource === 'click') && (
          <WallEditor
            wall={selectedItem.item}
            onUpdate={(updates) => {
              updateWall(selectedItem.item.id, updates);
              // Also update selectedItems to keep the editor in sync
              setSelectedItems(prev => prev.map(s => {
                if (s.type === 'wall' && s.item?.id === selectedItem.item.id) {
                  return { ...s, item: { ...s.item, ...updates } };
                }
                return s;
              }));
            }}
            onDelete={() => deleteSelected(selectedItems)}
            isMobile={isMobile}
          />
        )}
        {selectedItem?.type === 'door' && (!isMobile || selectionSource === 'click') && (
          <DoorEditor
            door={selectedItem.item}
            onUpdate={(updates) => {
              updateActiveFloor(f => ({
                ...f,
                doors: f.doors.map(d =>
                  d.id === selectedItem.item.id ? { ...d, ...updates } : d
                )
              }));
              // Also update selectedItems to keep editor in sync
              setSelectedItems(prev => prev.map(s => {
                if (s.type === 'door' && s.item?.id === selectedItem.item.id) {
                  return { ...s, item: { ...s.item, ...updates } };
                }
                return s;
              }));
            }}
            onDelete={() => deleteSelected(selectedItems)}
            formatMeasurement={formatMeasurementFn}
            units={units}
            isMobile={isMobile}
          />
        )}
        {selectedItem?.type === 'window' && (!isMobile || selectionSource === 'click') && (
          <WindowEditor
            window={selectedItem.item}
            onUpdate={(updates) => {
              updateActiveFloor(f => ({
                ...f,
                windows: f.windows.map(w =>
                  w.id === selectedItem.item.id ? { ...w, ...updates } : w
                )
              }));
              // Also update selectedItems to keep editor in sync
              setSelectedItems(prev => prev.map(s => {
                if (s.type === 'window' && s.item?.id === selectedItem.item.id) {
                  return { ...s, item: { ...s.item, ...updates } };
                }
                return s;
              }));
            }}
            onDelete={() => deleteSelected(selectedItems)}
            formatMeasurement={formatMeasurementFn}
            units={units}
            isMobile={isMobile}
          />
        )}
        {selectedItem?.type === 'furniture' && (!isMobile || selectionSource === 'click') && (
          <FurnitureEditor
            furniture={selectedItem.item}
            onUpdate={(updates) => {
              updateActiveFloor(f => ({
                ...f,
                furniture: f.furniture.map(furn =>
                  furn.id === selectedItem.item.id ? { ...furn, ...updates } : furn
                )
              }));
              // Also update selectedItems to keep the editor in sync
              setSelectedItems(prev => prev.map(s => {
                if (s.type === 'furniture' && s.item?.id === selectedItem.item.id) {
                  return { ...s, item: { ...s.item, ...updates } };
                }
                return s;
              }));
            }}
            onDelete={() => deleteSelected(selectedItems)}
            isMobile={isMobile}
          />
        )}
        {selectedItem?.type === 'roof' && (!isMobile || selectionSource === 'click') && (
          <RoofEditor
            roof={selectedItem.item}
            onUpdate={(updates) => {
              updateRoof(selectedItem.item.id, updates);
              // Also update selectedItems to keep the editor in sync
              setSelectedItems(prev => prev.map(s => {
                if (s.type === 'roof' && s.item?.id === selectedItem.item.id) {
                  return { ...s, item: { ...s.item, ...updates } };
                }
                return s;
              }));
            }}
            onDelete={() => deleteSelected(selectedItems)}
            isMobile={isMobile}
          />
        )}
        {selectedItem?.type === 'text' && (!isMobile || selectionSource === 'click') && (
          <TextEditor
            text={selectedItem.item}
            onUpdate={(updates) => {
              updateActiveFloor(f => ({
                ...f,
                texts: (f.texts || []).map(t =>
                  t.id === selectedItem.item.id ? { ...t, ...updates } : t
                )
              }));
              // Also update selectedItems to keep the editor in sync
              setSelectedItems(prev => prev.map(s => {
                if (s.type === 'text' && s.item?.id === selectedItem.item.id) {
                  return { ...s, item: { ...s.item, ...updates } };
                }
                return s;
              }));
            }}
            onDelete={() => deleteSelected(selectedItems)}
            isMobile={isMobile}
          />
        )}
        {selectedItem?.type === 'polyline' && (!isMobile || selectionSource === 'click') && (
          <PolylineEditor
            polyline={selectedItem.item}
            onUpdate={(updates) => {
              updateActiveFloor(f => ({
                ...f,
                polylines: (f.polylines || []).map(p =>
                  p.id === selectedItem.item.id ? { ...p, ...updates } : p
                )
              }));
              // Also update selectedItems to keep the editor in sync
              setSelectedItems(prev => prev.map(s => {
                if (s.type === 'polyline' && s.item?.id === selectedItem.item.id) {
                  return { ...s, item: { ...s.item, ...updates } };
                }
                return s;
              }));
            }}
            onDelete={() => deleteSelected(selectedItems)}
            onVertexSelect={setSelectedVertexIndex}
            isMobile={isMobile}
          />
        )}
        {selectedItem?.type === 'hatch' && (!isMobile || selectionSource === 'click') && (
          <HatchEditor
            hatch={selectedItem.item}
            onUpdate={(updates) => {
              updateActiveFloor(f => ({
                ...f,
                hatches: (f.hatches || []).map(h =>
                  h.id === selectedItem.item.id ? { ...h, ...updates } : h
                )
              }));
              // Also update selectedItems to keep the editor in sync
              setSelectedItems(prev => prev.map(s => {
                if (s.type === 'hatch' && s.item?.id === selectedItem.item.id) {
                  return { ...s, item: { ...s.item, ...updates } };
                }
                return s;
              }));
            }}
            onDelete={() => deleteSelected(selectedItems)}
            onVertexSelect={setSelectedVertexIndex}
            isMobile={isMobile}
          />
        )}
        {selectedItem?.type === 'room' && (!isMobile || selectionSource === 'click') && (
          <RoomEditor
            room={selectedItem.item}
            onUpdate={(updates) => {
              updateActiveFloor(f => ({
                ...f,
                rooms: (f.rooms || []).map(r =>
                  r.id === selectedItem.item.id ? { ...r, ...updates } : r
                )
              }));
              // Also update selectedItems to keep the editor in sync
              setSelectedItems(prev => prev.map(s => {
                if (s.type === 'room' && s.item?.id === selectedItem.item.id) {
                  return { ...s, item: { ...s.item, ...updates } };
                }
                return s;
              }));
            }}
            onDelete={() => deleteSelected(selectedItems)}
            onVertexSelect={setSelectedVertexIndex}
            isMobile={isMobile}
          />
        )}

        {/* 3D View */}
        {show3D && (
          <ThreeDView
            activeFloor={activeFloor}
            isMobile={isMobile}
            onClose={() => setShow3D(false)}
          />
        )}
      </div>

      {/* Status Bar - desktop only */}
      {!isMobile && (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          background: 'linear-gradient(180deg, rgba(15,20,28,0.95) 0%, rgba(8,12,16,0.98) 100%)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '11px',
          color: '#6080a0',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <FileMenu
            onNew={handleNewFile}
            onSave={handleSaveFile}
            onLoad={handleLoadFile}
            onRecent={() => setShowRecentProjects(true)}
            onExport={() => setActivePanel('export')}
            onPrint={handlePrint}
            isMobile={isMobile}
          />
          <button
            onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
            style={{
              background: activePanel === 'settings' ? 'rgba(0,200,255,0.2)' : 'transparent',
              border: 'none',
              color: activePanel === 'settings' ? '#00c8ff' : '#6080a0',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Settings"
          >
            <span style={{ fontSize: '12px' }}>&#9881;</span> Settings
          </button>
          <span>
            Tool: <span style={{ color: '#00c8ff' }}>{tool}</span>
          </span>
          <span>
            Floor: <span style={{ color: '#00c8ff' }}>{activeFloor?.name}</span>
          </span>
          {selectedItems.length > 0 && (
            <span>
              Selected: <span style={{ color: '#00ffaa' }}>{selectedItems.length}</span>
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>
            Walls: <span style={{ color: '#00c8ff' }}>{activeFloor?.walls?.length || 0}</span>
          </span>
          <span>
            Zoom: <span style={{ color: '#00c8ff' }}>{Math.round(zoom * 100)}%</span>
          </span>
        </div>
      </div>
      )}

      {/* Elevation View Modal */}
      {viewMode === 'elevations' && (
        <ElevationView
          activeFloor={activeFloor}
          isMobile={isMobile}
          onClose={() => setViewMode('model')}
        />
      )}

      {/* Paper Space View */}
      {viewMode === 'paper' && (
        <PaperSpaceView
          activeFloor={activeFloor}
          activeSheet={activeSheet}
          isMobile={isMobile}
          onClose={() => setViewMode('model')}
        />
      )}

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onShowSheets={() => setActivePanel('sheets')}
        onShowLayers={() => setActivePanel('layers')}
        onShow3D={() => setShow3D(!show3D)}
        onShowSettings={() => setActivePanel('settings')}
        onShowPdf={() => setActivePanel(pdfLayer?.dataUrl ? 'pdf-controls' : 'pdf-import')}
        onShowMaterials={() => setShowMaterialCalculator(true)}
        onExport={() => setActivePanel('export')}
        onSave={handleSaveFile}
        onLoad={handleLoadFile}
        onNew={handleNewFile}
        onRecent={() => setShowRecentProjects(true)}
        show3D={show3D}
        showLayersPanel={activePanel === 'layers'}
        showSheetsPanel={activePanel === 'sheets'}
        hasPdf={!!pdfLayer?.dataUrl}
      />
    </div>
  );
}

export default App;
