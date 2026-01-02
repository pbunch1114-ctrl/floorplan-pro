import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFloorPlan } from './hooks/useFloorPlan';
import { useCanvas } from './hooks/useCanvas';
import { useLayers } from './hooks/useLayers';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { Toolbar, MobileToolbar } from './components/toolbar';
import { FurnitureLibrary, StairsLibrary, ElectricalLibrary, PlumbingLibrary, LayersPanel, SheetsPanel, SettingsPanel } from './components/sidebar';
import { WallEditor, RoofEditor, DoorEditor, WindowEditor, FurnitureEditor, TempDimensionEditor } from './components/editors';
import { Button } from './components/ui';
import { FloorPlanCanvas } from './components/canvas';
import { ElevationView, ThreeDView, PaperSpaceView } from './components/views';
import { FileMenu, MobileMenu } from './components/menu';
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
  const [showGrips, setShowGrips] = useState(true);
  const [thinLines, setThinLines] = useState(false);

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
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
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

  // Handle delete selected
  const deleteSelected = useCallback(() => {
    if (!selectedItems.length) return;

    selectedItems.forEach(({ type, item }) => {
      if (type === 'wall') {
        updateActiveFloor(f => ({
          ...f,
          walls: f.walls.filter(w => w.id !== item.id),
          doors: f.doors.filter(d => d.wallId !== item.id),
          windows: f.windows.filter(w => w.wallId !== item.id),
        }));
      } else if (type === 'door') {
        updateActiveFloor(f => ({ ...f, doors: f.doors.filter(d => d.id !== item.id) }));
      } else if (type === 'window') {
        updateActiveFloor(f => ({ ...f, windows: f.windows.filter(w => w.id !== item.id) }));
      } else if (type === 'furniture') {
        updateActiveFloor(f => ({ ...f, furniture: f.furniture.filter(furn => furn.id !== item.id) }));
      } else if (type === 'room') {
        updateActiveFloor(f => ({ ...f, rooms: (f.rooms || []).filter(r => r.id !== item.id) }));
      } else if (type === 'roof') {
        updateActiveFloor(f => ({ ...f, roofs: (f.roofs || []).filter(r => r.id !== item.id) }));
      }
    });

    setSelectedItems([]);
  }, [selectedItems, updateActiveFloor, setSelectedItems]);

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
        if (selectedItems.length > 0) {
          deleteSelected();
          e.preventDefault();
        }
      }

      // Save
      if ((e.ctrlKey || e.metaKey) && key === 's') {
        e.preventDefault();
        const data = exportToJSON();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'floorplan.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedItems, deleteSelected, exportToJSON]);

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
    }
  }, [newFile]);

  const handleSaveFile = useCallback(() => {
    const data = exportToJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `floorplan-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportToJSON]);

  const handleLoadFile = useCallback((jsonData) => {
    if (importFromJSON(jsonData)) {
      alert('Project loaded successfully!');
    } else {
      alert('Failed to load project. Invalid file format.');
    }
  }, [importFromJSON]);

  const handleExportPNG = useCallback(() => {
    // TODO: Implement PNG export from canvas
    alert('PNG export coming soon!');
  }, []);

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
          onDelete={deleteSelected}
          canUndo={canUndo}
          canRedo={canRedo}
          hasSelection={selectedItems.length > 0}
          activeTab={toolTab}
          onTabChange={setToolTab}
          onShowLayers={() => setActivePanel('layers')}
          onShowSettings={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
          onShow3D={() => setShow3D(!show3D)}
          onShowElevations={() => setViewMode('elevations')}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetView={fitToContent}
        />
      ) : (
        <Toolbar
          tool={tool}
          onToolChange={setTool}
          toolTab={toolTab}
          onToolTabChange={setToolTab}
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
          moveBasePoint={moveBasePoint}
          movePreviewPoint={movePreviewPoint}
          rotateCenter={rotateCenter}
          rotateStartAngle={rotateStartAngle}
          rotatePreviewAngle={rotatePreviewAngle}
          snapGuidelines={snapGuidelines}
          activeSnap={activeSnap}
          units={units}
          gridSize={gridSize}
          showDimensions={showDimensions}
          showGrips={showGrips}
          isMobile={isMobile}
          layers={layers}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
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
                updateActiveFloor(f => ({
                  ...f,
                  doors: f.doors.map(d =>
                    d.id === selectedItem.item.id ? { ...d, ...updates } : d
                  )
                }));
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
                updateActiveFloor(f => ({
                  ...f,
                  windows: f.windows.map(w =>
                    w.id === selectedItem.item.id ? { ...w, ...updates } : w
                  )
                }));
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

        {/* Quick action buttons (floating) - desktop only */}
        {!isMobile && (
          <div
            style={{
              position: 'absolute',
              bottom: 60,
              right: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
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
            <Button variant="default" onClick={() => setViewMode('elevations')} title="Elevation Views">
              📐
            </Button>
            <Button variant="default" onClick={() => setShow3D(!show3D)} title="3D View">
              🧊
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
              gap: '8px',
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
            showGrips={showGrips}
            setShowGrips={setShowGrips}
            thinLines={thinLines}
            setThinLines={setThinLines}
            wallDetailLevel={wallDetailLevel}
            setWallDetailLevel={setWallDetailLevel}
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
            onDelete={() => deleteSelected()}
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
            onDelete={() => deleteSelected()}
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
            onDelete={() => deleteSelected()}
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
            }}
            onDelete={() => deleteSelected()}
            isMobile={isMobile}
          />
        )}
        {selectedItem?.type === 'roof' && (!isMobile || selectionSource === 'click') && (
          <RoofEditor
            roof={selectedItem.item}
            onUpdate={(updates) => updateRoof(selectedItem.item.id, updates)}
            onDelete={() => deleteSelected()}
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
            onExportPNG={handleExportPNG}
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
        onSave={handleSaveFile}
        onLoad={handleLoadFile}
        onNew={handleNewFile}
        show3D={show3D}
        showLayersPanel={activePanel === 'layers'}
        showSheetsPanel={activePanel === 'sheets'}
      />
    </div>
  );
}

export default App;
