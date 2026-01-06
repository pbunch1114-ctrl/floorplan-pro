import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';

/**
 * SaveDialog - Modal dialog for entering a filename before saving
 */
const SaveDialog = ({
  onSave,
  onClose,
  defaultName = 'floorplan',
  isMobile = false,
}) => {
  const [fileName, setFileName] = useState(defaultName);
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSave = () => {
    const name = fileName.trim() || 'floorplan';
    onSave(name);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 299,
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isMobile ? 'calc(100% - 40px)' : '320px',
          maxWidth: '320px',
          background: 'linear-gradient(180deg, rgba(15,20,28,0.98) 0%, rgba(8,12,16,0.98) 100%)',
          border: '1px solid rgba(0,200,255,0.3)',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 300,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,200,255,0.05)',
        }}>
          <span style={{ color: '#00c8ff', fontWeight: '600', fontSize: '13px' }}>
            Save Project
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,100,100,0.15)',
              border: 'none',
              color: '#ff6666',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      <div style={{ padding: '16px' }}>
        <p style={{
          color: '#a0b0c0',
          fontSize: '12px',
          marginBottom: '16px',
          lineHeight: 1.5,
        }}>
          Enter a name for your floor plan project:
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#6080a0',
            fontSize: '10px',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            File Name
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              ref={inputRef}
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="floorplan"
              style={{
                flex: 1,
                padding: '10px 12px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(0,200,255,0.3)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <span style={{
              color: '#6080a0',
              fontSize: '12px',
            }}>
              .json
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end',
        }}>
          <Button
            variant="default"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>
      </div>
    </>
  );
};

export default SaveDialog;
