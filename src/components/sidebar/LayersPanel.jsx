import React, { useState, useRef } from 'react';
import { Panel, PanelSection } from '../ui/Panel';
import { Button } from '../ui/Button';

// Preset colors for the color picker
const LAYER_COLORS = [
  '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
  '#ff00ff', '#00ffff', '#ff8800', '#00c8ff', '#00ffaa',
  '#ff6666', '#66ff66', '#6666ff', '#ffaa00', '#aa00ff',
  '#888888', '#aaaaaa', '#446688', '#886644', '#668844',
];

/**
 * LayersPanel - Layer visibility and lock controls
 */
export const LayersPanel = ({
  layers,
  onToggleVisibility,
  onToggleLock,
  onSetColor,
  onShowAll,
  onHideAll,
  onClose,
  isMobile = false,
}) => {
  const [colorPickerLayer, setColorPickerLayer] = useState(null);
  const colorInputRef = useRef(null);
  return (
    <Panel
      title="Layers"
      onClose={onClose}
      position="right"
      width={isMobile ? 280 : 240}
    >
      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <Button
          variant="default"
          onClick={onShowAll}
          size="small"
          style={{ flex: 1 }}
        >
          Show All
        </Button>
        <Button
          variant="default"
          onClick={onHideAll}
          size="small"
          style={{ flex: 1 }}
        >
          Hide All
        </Button>
      </div>

      {/* Layer list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {Object.entries(layers).map(([id, layer]) => (
          <div
            key={id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '6px',
              gap: '8px',
            }}
          >
            {/* Visibility toggle */}
            <button
              onClick={() => onToggleVisibility(id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px',
                opacity: layer.visible ? 1 : 0.4,
              }}
              title={layer.visible ? 'Hide layer' : 'Show layer'}
            >
              {layer.visible ? '👁️' : '👁️‍🗨️'}
            </button>

            {/* Lock toggle */}
            <button
              onClick={() => onToggleLock(id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '2px',
                opacity: layer.locked ? 1 : 0.4,
              }}
              title={layer.locked ? 'Unlock layer' : 'Lock layer'}
            >
              {layer.locked ? '🔒' : '🔓'}
            </button>

            {/* Layer color indicator - clickable */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setColorPickerLayer(colorPickerLayer === id ? null : id)}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '3px',
                  background: layer.color,
                  border: '2px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  padding: 0,
                }}
                title="Change layer color"
              />
              {/* Color picker dropdown */}
              {colorPickerLayer === id && (
                <div
                  style={{
                    position: 'absolute',
                    top: '24px',
                    left: '0',
                    zIndex: 1000,
                    background: 'rgba(20,28,36,0.98)',
                    border: '1px solid rgba(0,200,255,0.3)',
                    borderRadius: '8px',
                    padding: '8px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                    width: '140px',
                  }}
                >
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '4px',
                    marginBottom: '8px',
                  }}>
                    {LAYER_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => {
                          onSetColor?.(id, color);
                          setColorPickerLayer(null);
                        }}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '3px',
                          background: color,
                          border: layer.color === color ? '2px solid #00ffaa' : '1px solid rgba(255,255,255,0.2)',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      />
                    ))}
                  </div>
                  {/* Custom color input */}
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input
                      ref={colorInputRef}
                      type="color"
                      value={layer.color}
                      onChange={(e) => {
                        onSetColor?.(id, e.target.value);
                      }}
                      style={{
                        width: '28px',
                        height: '22px',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                    <span style={{ fontSize: '10px', color: '#6080a0' }}>Custom</span>
                  </div>
                </div>
              )}
            </div>

            {/* Layer name */}
            <span
              style={{
                flex: 1,
                color: layer.visible ? '#d0d8e0' : '#6080a0',
                fontSize: '12px',
                textDecoration: layer.locked ? 'none' : 'none',
              }}
            >
              {layer.name}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
};

export default LayersPanel;
