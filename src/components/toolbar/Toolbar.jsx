import React from 'react';
import { Button, ToolButton } from '../ui/Button';

// Tool definitions
const DRAW_TOOLS = [
  { id: 'select', icon: '👆', label: 'Select' },
  { id: 'wall', icon: '🧱', label: 'Wall' },
  { id: 'door', icon: '🚪', label: 'Door' },
  { id: 'window', icon: '🪟', label: 'Window' },
  { id: 'room', icon: '📐', label: 'Room' },
  { id: 'roof', icon: '🏠', label: 'Roof' },
];

const MODIFY_TOOLS = [
  { id: 'move', icon: '✋', label: 'Move' },
  { id: 'extend', icon: '↔️', label: 'Extend' },
  { id: 'trim', icon: '✂️', label: 'Trim' },
  { id: 'corner', icon: '📐', label: 'Corner' },
  { id: 'chamfer', icon: '⬡', label: 'Chamfer' },
  { id: 'fillet', icon: '◠', label: 'Fillet' },
];

const ANNOTATE_TOOLS = [
  { id: 'dimension', icon: '📏', label: 'Dimension' },
  { id: 'text', icon: '📝', label: 'Text' },
  { id: 'line', icon: '📍', label: 'Line' },
  { id: 'polyline', icon: '📈', label: 'Polyline' },
  { id: 'hatch', icon: '▤', label: 'Hatch' },
];

const VIEW_TOOLS = [
  { id: 'pan', icon: '🖐️', label: 'Pan' },
  { id: 'zoom-fit', icon: '🔍', label: 'Fit' },
  { id: '3d', icon: '🧊', label: '3D View' },
  { id: 'elevations', icon: '🏢', label: 'Elevations' },
];

const MARKUP_TOOLS = [
  { id: 'annotation-select', icon: '↖️', label: 'Select' },
  { id: 'annotation-arrow', icon: '➔', label: 'Arrow' },
  { id: 'annotation-freehand', icon: '✏️', label: 'Freehand' },
  { id: 'annotation-circle', icon: '⭕', label: 'Circle' },
  { id: 'annotation-rectangle', icon: '⬜', label: 'Rectangle' },
  { id: 'annotation-cloud', icon: '☁️', label: 'Cloud' },
  { id: 'annotation-stamp', icon: '📌', label: 'Stamp', isAction: true },
  { id: 'annotation-callout', icon: '①', label: 'Callout' },
  { id: 'callout-notes', icon: '📝', label: 'Notes', isAction: true },
  { id: 'markup-settings', icon: '🎨', label: 'Settings', isAction: true },
];

const TOOL_TABS = [
  { id: 'draw', label: 'Draw', tools: DRAW_TOOLS },
  { id: 'modify', label: 'Modify', tools: MODIFY_TOOLS },
  { id: 'annotate', label: 'Annotate', tools: ANNOTATE_TOOLS },
  { id: 'view', label: 'View', tools: VIEW_TOOLS },
  { id: 'markup', label: 'Markup', tools: MARKUP_TOOLS },
];

/**
 * Toolbar component with tabbed tools
 */
export const Toolbar = ({
  tool,
  onToolChange,
  toolTab,
  onToolTabChange,
  onShowStamps,
  onShowAnnotationSettings,
  onShowCalloutNotes,
  isMobile = false,
  style = {},
}) => {
  const currentTabTools = TOOL_TABS.find(t => t.id === toolTab)?.tools || DRAW_TOOLS;

  const handleToolClick = (t) => {
    if (t.isAction) {
      // Handle action buttons
      if (t.id === 'annotation-stamp' && onShowStamps) {
        onShowStamps();
      } else if (t.id === 'markup-settings' && onShowAnnotationSettings) {
        onShowAnnotationSettings();
      } else if (t.id === 'callout-notes' && onShowCalloutNotes) {
        onShowCalloutNotes();
      }
    } else {
      onToolChange(t.id);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, rgba(15,20,28,0.95) 0%, rgba(8,12,16,0.95) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        ...style,
      }}
    >
      {/* Tab buttons */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '4px',
          gap: '4px',
        }}
      >
        {TOOL_TABS.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            active={toolTab === tab.id}
            onClick={() => onToolTabChange(tab.id)}
            style={{
              flex: 1,
              fontSize: '11px',
              padding: '8px 4px',
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tool buttons */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          padding: '8px',
          gap: '6px',
          justifyContent: isMobile ? 'center' : 'flex-start',
        }}
      >
        {currentTabTools.map((t) => (
          <ToolButton
            key={t.id}
            icon={t.icon}
            label={t.label}
            active={!t.isAction && tool === t.id}
            onClick={() => handleToolClick(t)}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * MobileToolbar - simplified toolbar for mobile
 * Provides a bottom toolbar with tabbed navigation (Draw/Modify/View/Annotate)
 */
export const MobileToolbar = ({
  tool,
  onToolChange,
  onMenuToggle,
  onUndo,
  onRedo,
  onDelete,
  canUndo = false,
  canRedo = false,
  hasSelection = false,
  activeTab = 'draw',
  onTabChange,
  onShowLayers,
  onShowSettings,
  onShowFurniture,
  onShow3D,
  onShowElevations,
  onShowStamps,
  onShowAnnotationSettings,
  onShowCalloutNotes,
  onZoomIn,
  onZoomOut,
  onResetView,
  panelOpen = false, // Hide floating buttons when a panel is open
  style = {},
}) => {
  const [mobileTab, setMobileTab] = React.useState(activeTab);
  const [toolsExpanded, setToolsExpanded] = React.useState(false);

  const handleTabChange = (tab) => {
    // Toggle expansion if same tab clicked, otherwise expand and switch
    if (mobileTab === tab) {
      setToolsExpanded(!toolsExpanded);
    } else {
      setMobileTab(tab);
      setToolsExpanded(true);
      if (onTabChange) onTabChange(tab);
    }
  };

  const handleToolSelect = (toolId, isAction, action) => {
    if (isAction && action) {
      action();
    } else {
      onToolChange(toolId);
      // Collapse after selecting a tool (not for actions like zoom)
      setToolsExpanded(false);
    }
  };

  // Draw tools
  const drawTools = [
    { id: 'select', icon: '↖', label: 'Select' },
    { id: 'wall', icon: '▭', label: 'Wall' },
    { id: 'door', icon: '🚪', label: 'Door' },
    { id: 'window', icon: '⊞', label: 'Window' },
    { id: 'room', icon: '⬚', label: 'Room' },
    { id: 'roof', icon: '⌂', label: 'Roof' },
    { id: 'furniture', icon: '🛋', label: 'Furniture', isAction: true, action: onShowFurniture },
  ];

  // Modify tools
  const modifyTools = [
    { id: 'select', icon: '↖', label: 'Select' },
    { id: 'move', icon: '✥', label: 'Move' },
    { id: 'rotate', icon: '↻', label: 'Rotate' },
    { id: 'extend', icon: '↔', label: 'Extend' },
    { id: 'trim', icon: '✂', label: 'Trim' },
    { id: 'corner', icon: '⌐', label: 'Corner' },
  ];

  // View tools (actions, not tool modes)
  const viewTools = [
    { id: 'pan', icon: '✋', label: 'Pan', isAction: false },
    { id: 'zoomIn', icon: '+', label: 'Zoom In', isAction: true, action: onZoomIn },
    { id: 'zoomOut', icon: '−', label: 'Zoom Out', isAction: true, action: onZoomOut },
    { id: 'resetView', icon: '⟲', label: 'Reset', isAction: true, action: onResetView },
    { id: '3d', icon: '🧊', label: '3D', isAction: true, action: onShow3D },
    { id: 'elevations', icon: '📐', label: 'Elev', isAction: true, action: onShowElevations },
  ];

  // Annotate tools
  const annotateTools = [
    { id: 'dimension', icon: '📏', label: 'Dim' },
    { id: 'text', icon: 'T', label: 'Text' },
    { id: 'line', icon: '/', label: 'Line' },
    { id: 'polyline', icon: '⌇', label: 'Poly' },
    { id: 'hatch', icon: '▤', label: 'Hatch' },
  ];

  // Markup tools (PDF annotation)
  const markupTools = [
    { id: 'annotation-select', icon: '↖', label: 'Select' },
    { id: 'annotation-arrow', icon: '➔', label: 'Arrow' },
    { id: 'annotation-freehand', icon: '✎', label: 'Draw' },
    { id: 'annotation-circle', icon: '○', label: 'Circle' },
    { id: 'annotation-rectangle', icon: '□', label: 'Rect' },
    { id: 'annotation-cloud', icon: '☁', label: 'Cloud' },
    { id: 'annotation-stamp', icon: '⬚', label: 'Stamp', isAction: true, action: onShowStamps },
    { id: 'annotation-callout', icon: '①', label: 'Callout' },
    { id: 'callout-notes', icon: '📝', label: 'Notes', isAction: true, action: onShowCalloutNotes },
    { id: 'markup-settings', icon: '⚙', label: 'Colors', isAction: true, action: onShowAnnotationSettings },
  ];

  // Tabs configuration
  const tabs = [
    { id: 'draw', label: 'Draw', icon: '✏' },
    { id: 'modify', label: 'Modify', icon: '✎' },
    { id: 'view', label: 'View', icon: '👁' },
    { id: 'annotate', label: 'Annotate', icon: '📝' },
    { id: 'markup', label: 'Markup', icon: '✏️' },
  ];

  // Get current tools based on active tab
  const getCurrentTools = () => {
    switch (mobileTab) {
      case 'draw': return drawTools;
      case 'modify': return modifyTools;
      case 'view': return viewTools;
      case 'annotate': return annotateTools;
      case 'markup': return markupTools;
      default: return drawTools;
    }
  };

  const currentTools = getCurrentTools();

  return (
    <>
      {/* Top header bar - minimal */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: 'linear-gradient(180deg, rgba(15,20,28,0.95) 0%, rgba(8,12,16,0.95) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          ...style,
        }}
      >
        {/* Menu button */}
        <Button
          variant="ghost"
          onClick={onMenuToggle}
          style={{ fontSize: '18px', padding: '6px' }}
        >
          ☰
        </Button>

        {/* App title */}
        <span style={{ color: '#00c8ff', fontWeight: 'bold', fontSize: '13px' }}>
          FloorPlan Pro
        </span>

        {/* Settings button */}
        <Button
          variant="ghost"
          onClick={onShowSettings}
          style={{ fontSize: '16px', padding: '6px' }}
        >
          ⚙
        </Button>
      </div>

      {/* Floating action buttons - undo/redo/delete only (hidden when panel is open) */}
      {!panelOpen && (
      <div
        style={{
          position: 'fixed',
          top: '52px',
          right: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 150,
        }}
      >
        {onUndo && (
          <button
            onClick={onUndo}
            disabled={!canUndo}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              background: 'rgba(12,18,24,0.95)',
              border: '1px solid rgba(0,200,255,0.3)',
              color: canUndo ? '#00c8ff' : '#3a4a5a',
              fontSize: '16px',
              cursor: canUndo ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canUndo ? 1 : 0.5,
            }}
          >
            ↩
          </button>
        )}
        {onRedo && (
          <button
            onClick={onRedo}
            disabled={!canRedo}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              background: 'rgba(12,18,24,0.95)',
              border: '1px solid rgba(0,200,255,0.3)',
              color: canRedo ? '#00c8ff' : '#3a4a5a',
              fontSize: '16px',
              cursor: canRedo ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canRedo ? 1 : 0.5,
            }}
          >
            ↪
          </button>
        )}
        {hasSelection && onDelete && (
          <button
            onClick={onDelete}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              background: 'rgba(255,80,80,0.2)',
              border: '1px solid rgba(255,80,80,0.5)',
              color: '#ff6666',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            🗑
          </button>
        )}
      </div>
      )}

      {/* Bottom toolbar with tabs */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(12,18,24,0.98)',
          borderTop: '1px solid rgba(0,200,255,0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 150,
        }}
      >
        {/* Tools row - only show when expanded, compact layout */}
        {toolsExpanded && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              padding: '4px 2px',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {currentTools.map((t) => (
              <button
                key={t.id}
                onClick={() => handleToolSelect(t.id, t.isAction, t.action)}
                style={{
                  padding: '4px 6px',
                  minWidth: '40px',
                  background: (!t.isAction && tool === t.id) ? 'rgba(0,200,255,0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: (!t.isAction && tool === t.id) ? '#00c8ff' : '#6080a0',
                  fontSize: '16px',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1px',
                }}
                title={t.label}
              >
                <span>{t.icon}</span>
                <span style={{ fontSize: '8px' }}>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Tab row - always visible, compact for more drawing space */}
        <div
          style={{
            display: 'flex',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                flex: 1,
                padding: '6px 4px',
                background: (mobileTab === tab.id && toolsExpanded) ? 'rgba(0,200,255,0.15)' : 'transparent',
                border: 'none',
                borderTop: (mobileTab === tab.id && toolsExpanded) ? '2px solid #00c8ff' : '2px solid transparent',
                color: mobileTab === tab.id ? '#00c8ff' : '#6080a0',
                fontSize: '10px',
                fontWeight: mobileTab === tab.id ? 'bold' : 'normal',
                cursor: 'pointer',
                touchAction: 'manipulation',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1px',
              }}
            >
              <span style={{ fontSize: '12px' }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Toolbar;
