import React from 'react';

/**
 * MobileMenu - Full screen menu for mobile devices
 * Provides access to Sheets, Layers, Settings, and File operations
 */
const MobileMenu = ({
  isOpen,
  onClose,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onShowSheets,
  onShowLayers,
  onShow3D,
  onShowSettings,
  onShowPdf,
  onShowMaterials,
  onExport,
  onSave,
  onLoad,
  onNew,
  onRecent,
  show3D,
  showLayersPanel,
  showSheetsPanel,
  hasPdf,
}) => {
  if (!isOpen) return null;

  const handleAction = (action) => {
    action?.();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 900,
        }}
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div
        style={{
          position: 'fixed',
          top: '60px',
          left: '10px',
          right: '10px',
          background: 'rgba(8,12,16,0.98)',
          border: '1px solid rgba(0,200,255,0.2)',
          borderRadius: '12px',
          padding: '16px',
          zIndex: 950,
          maxHeight: 'calc(100vh - 140px)',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
            Menu
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6080a0',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Actions Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
          <MenuButton
            icon="↩"
            label="Undo"
            onClick={() => handleAction(onUndo)}
            disabled={!canUndo}
          />
          <MenuButton
            icon="↪"
            label="Redo"
            onClick={() => handleAction(onRedo)}
            disabled={!canRedo}
          />
          <MenuButton
            icon="🧊"
            label="3D"
            onClick={() => handleAction(onShow3D)}
            active={show3D}
          />
          <MenuButton
            icon="📑"
            label="Layers"
            onClick={() => handleAction(onShowLayers)}
            active={showLayersPanel}
          />
          <MenuButton
            icon="📋"
            label="Sheets"
            onClick={() => handleAction(onShowSheets)}
            active={showSheetsPanel}
          />
          <MenuButton
            icon="⚙️"
            label="Settings"
            onClick={() => handleAction(onShowSettings)}
          />
          <MenuButton
            icon="📄"
            label={hasPdf ? "PDF" : "Import PDF"}
            onClick={() => handleAction(onShowPdf)}
            active={hasPdf}
          />
          <MenuButton
            icon="🧮"
            label="Materials"
            onClick={() => handleAction(onShowMaterials)}
          />
        </div>

        {/* File Operations */}
        <div style={{
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{
            color: '#6080a0',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px',
            display: 'block',
          }}>
            File
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            <MenuButton
              icon="📄"
              label="New"
              onClick={() => handleAction(onNew)}
            />
            <MenuButton
              icon="💾"
              label="Save"
              onClick={() => handleAction(onSave)}
            />
            <MenuButton
              icon="🕐"
              label="Recent"
              onClick={() => handleAction(onRecent)}
            />
            <MenuButton
              icon="📤"
              label="Export"
              onClick={() => handleAction(onExport)}
            />
            <label style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: '#8899aa',
              fontSize: '12px',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span style={{ fontSize: '18px' }}>📂</span>
              <span>Open</span>
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      onLoad?.(event.target.result);
                      onClose();
                    };
                    reader.readAsText(e.target.files[0]);
                  }
                  e.target.value = '';
                }}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * MenuButton - Individual menu button
 */
const MenuButton = ({ icon, label, onClick, active, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '12px',
      background: active ? 'rgba(0,200,255,0.2)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${active ? 'rgba(0,200,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: '10px',
      color: disabled ? '#4a5a6a' : (active ? '#00c8ff' : '#8899aa'),
      fontSize: '12px',
      cursor: disabled ? 'default' : 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    <span style={{ fontSize: '18px' }}>{icon}</span>
    <span>{label}</span>
  </button>
);

export default MobileMenu;
