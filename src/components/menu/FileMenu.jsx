import React, { useRef, useState } from 'react';
import { Button } from '../ui';

/**
 * FileMenu - Dropdown menu for file operations
 */
const FileMenu = ({
  onNew,
  onSave,
  onLoad,
  onRecent,
  onExport,
  onPrint,
  isMobile = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleLoad = () => {
    fileInputRef.current?.click();
    setIsOpen(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target.result;
        onLoad?.(data);
      } catch (err) {
        console.error('Failed to load file:', err);
        alert('Failed to load file. Please check the format.');
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be loaded again
    e.target.value = '';
  };

  const menuItems = [
    { label: 'New Project', icon: '📄', action: () => { onNew?.(); setIsOpen(false); } },
    { label: 'Open...', icon: '📂', action: handleLoad },
    { label: 'Recent Projects', icon: '🕐', action: () => { onRecent?.(); setIsOpen(false); } },
    { label: 'Save', icon: '💾', action: () => { onSave?.(); setIsOpen(false); } },
    { divider: true },
    { label: 'Export...', icon: '📤', action: () => { onExport?.(); setIsOpen(false); } },
    { label: 'Print', icon: '🖨️', action: () => { onPrint?.(); setIsOpen(false); } },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <Button
        variant="default"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span>File</span>
        <span style={{ fontSize: '10px' }}>▼</span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99,
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Menu dropdown - opens upward since we're in status bar at bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: '4px',
              background: 'rgba(15,20,28,0.98)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
              minWidth: '180px',
              zIndex: 100,
              overflow: 'hidden',
            }}
          >
            {menuItems.map((item, index) => (
              item.divider ? (
                <div
                  key={index}
                  style={{
                    height: '1px',
                    background: 'rgba(255,255,255,0.1)',
                    margin: '4px 0',
                  }}
                />
              ) : (
                <button
                  key={index}
                  onClick={item.action}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 14px',
                    background: 'transparent',
                    border: 'none',
                    color: '#c0d0e0',
                    fontSize: '13px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(0,200,255,0.15)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              )
            ))}
          </div>
        </>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.floorplan"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default FileMenu;
