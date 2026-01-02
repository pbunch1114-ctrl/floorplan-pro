import React from 'react';
import { Panel, PanelSection } from '../ui/Panel';
import { Button } from '../ui/Button';

/**
 * LayersPanel - Layer visibility and lock controls
 */
export const LayersPanel = ({
  layers,
  onToggleVisibility,
  onToggleLock,
  onShowAll,
  onHideAll,
  onClose,
  isMobile = false,
}) => {
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

            {/* Layer color indicator */}
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                background: layer.color,
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            />

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
