import React from 'react';

/**
 * Panel component for sidebars and floating panels
 */
export const Panel = ({
  children,
  title,
  onClose,
  position = 'left', // 'left', 'right', 'floating'
  width = 280,
  style = {},
  ...props
}) => {
  const baseStyles = {
    position: 'absolute',
    top: 0,
    [position === 'right' ? 'right' : 'left']: 0,
    width: `${width}px`,
    height: '100%',
    background: 'linear-gradient(180deg, #0c1218 0%, #080c10 100%)',
    borderRight: position === 'left' ? '1px solid rgba(255,255,255,0.08)' : 'none',
    borderLeft: position === 'right' ? '1px solid rgba(255,255,255,0.08)' : 'none',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
  };

  return (
    <div style={{ ...baseStyles, ...style }} {...props}>
      {title && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>
            {title}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#6080a0',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {children}
      </div>
    </div>
  );
};

/**
 * FloatingPanel - for property editors and popups
 */
export const FloatingPanel = ({
  children,
  title,
  onClose,
  x,
  y,
  width = 220,
  maxHeight = 320,
  isMobile = false,
  minimized = false,
  onMinimize,
  style = {},
  ...props
}) => {
  // Compact sizing for mobile
  const panelWidth = isMobile ? Math.min(200, window.innerWidth - 20) : width;
  const panelMaxHeight = isMobile ? 280 : maxHeight;
  const panelX = isMobile ? 10 : x;
  const panelY = isMobile ? 60 : y;

  return (
    <div
      style={{
        position: 'absolute',
        left: panelX,
        top: panelY,
        width: `${panelWidth}px`,
        maxHeight: minimized ? 'auto' : `${panelMaxHeight}px`,
        background: 'linear-gradient(180deg, rgba(15,20,28,0.98) 0%, rgba(8,12,16,0.98) 100%)',
        border: '1px solid rgba(0,200,255,0.2)',
        borderRadius: '6px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(10px)',
        zIndex: 200,
        overflow: 'hidden',
        fontSize: isMobile ? '11px' : '12px',
        ...style,
      }}
      {...props}
    >
      {title && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '8px 10px' : '10px 12px',
          borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,200,255,0.05)',
        }}>
          <span style={{ color: '#00c8ff', fontWeight: '600', fontSize: isMobile ? '11px' : '12px' }}>
            {title}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {onMinimize && (
              <button
                onClick={onMinimize}
                style={{
                  background: 'rgba(100,150,255,0.15)',
                  border: 'none',
                  color: '#6699ff',
                  fontSize: '10px',
                  cursor: 'pointer',
                  padding: '3px 6px',
                  borderRadius: '3px',
                  lineHeight: 1,
                }}
              >
                {minimized ? '▼' : '▲'}
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,100,100,0.15)',
                  border: 'none',
                  color: '#ff6666',
                  fontSize: '10px',
                  cursor: 'pointer',
                  padding: '3px 6px',
                  borderRadius: '3px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
      {!minimized && (
        <div style={{ overflowY: 'auto', maxHeight: panelMaxHeight - 40 }}>
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * PanelSection - for grouping content within panels
 */
export const PanelSection = ({ title, children, collapsed, onToggle }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      {title && (
        <div
          onClick={onToggle}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            marginBottom: '10px',
            cursor: onToggle ? 'pointer' : 'default',
          }}
        >
          <span style={{ color: '#6080a0', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {title}
          </span>
          {onToggle && (
            <span style={{ color: '#6080a0', fontSize: '10px' }}>
              {collapsed ? '▶' : '▼'}
            </span>
          )}
        </div>
      )}
      {!collapsed && children}
    </div>
  );
};

export default Panel;
