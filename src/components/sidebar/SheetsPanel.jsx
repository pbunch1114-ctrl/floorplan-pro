import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { PAPER_SIZES } from '../../constants/paper';

// Custom dropdown component for sheets panel
const SheetDropdown = ({ value, options, onChange, onClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
          setIsOpen(!isOpen);
        }}
        style={{
          width: '100%',
          padding: '4px 6px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '4px',
          color: '#fff',
          fontSize: '9px',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{selectedOption?.label || value}</span>
        <span style={{ fontSize: '8px', marginLeft: '4px' }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            marginBottom: '2px',
            background: '#1a2030',
            border: '1px solid rgba(0,200,255,0.3)',
            borderRadius: '4px',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.5)',
            zIndex: 1000,
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={(e) => {
                e.stopPropagation();
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '6px 8px',
                color: opt.value === value ? '#00c8ff' : '#fff',
                background: opt.value === value ? 'rgba(0,200,255,0.15)' : 'transparent',
                cursor: 'pointer',
                fontSize: '9px',
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value) {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = opt.value === value ? 'rgba(0,200,255,0.15)' : 'transparent';
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SIZE_OPTIONS = [
  { value: 'letter', label: 'Letter' },
  { value: 'legal', label: 'Legal' },
  { value: 'tabloid', label: 'Tabloid' },
  { value: 'arch-d', label: 'Arch D (24×36)' },
];

const SCALE_OPTIONS = [
  { value: '1/8" = 1\'', label: '1/8" = 1\'' },
  { value: '1/4" = 1\'', label: '1/4" = 1\'' },
  { value: '3/8" = 1\'', label: '3/8" = 1\'' },
  { value: '1/2" = 1\'', label: '1/2" = 1\'' },
  { value: '1" = 1\'', label: '1" = 1\'' },
];

/**
 * SheetsPanel - Manage sheets and access Paper Space / Elevation views
 */
export const SheetsPanel = ({
  sheets,
  activeSheetId,
  onSelectSheet,
  onAddSheet,
  onUpdateSheet,
  onDeleteSheet,
  viewMode,
  onViewModeChange,
  onClose,
  isMobile = false,
}) => {
  return (
    <div
      style={{
        position: isMobile ? 'fixed' : 'absolute',
        top: isMobile ? '60px' : '16px',
        right: isMobile ? '10px' : '16px',
        background: 'rgba(8,12,16,0.98)',
        border: '1px solid rgba(0,200,255,0.2)',
        borderRadius: '10px',
        padding: '14px',
        width: isMobile ? 'calc(100% - 20px)' : '300px',
        maxWidth: '340px',
        maxHeight: isMobile ? '70vh' : '85vh',
        overflowY: 'auto',
        zIndex: 250,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>
          Sheets & Views
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#6080a0',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ×
        </button>
      </div>

      {/* View Mode Toggle */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        <button
          onClick={() => onViewModeChange('model')}
          style={{
            flex: 1,
            padding: isMobile ? '12px' : '8px',
            background: viewMode === 'model' ? 'rgba(0,200,255,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${viewMode === 'model' ? 'rgba(0,200,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '6px',
            color: viewMode === 'model' ? '#00c8ff' : '#8899aa',
            fontSize: '11px',
            cursor: 'pointer',
            fontWeight: viewMode === 'model' ? '600' : '400',
          }}
        >
          Model
        </button>
        <button
          onClick={() => onViewModeChange('paper')}
          style={{
            flex: 1,
            padding: isMobile ? '12px' : '8px',
            background: viewMode === 'paper' ? 'rgba(0,200,255,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${viewMode === 'paper' ? 'rgba(0,200,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '6px',
            color: viewMode === 'paper' ? '#00c8ff' : '#8899aa',
            fontSize: '11px',
            cursor: 'pointer',
            fontWeight: viewMode === 'paper' ? '600' : '400',
          }}
        >
          Paper Space
        </button>
        <button
          onClick={() => onViewModeChange('elevations')}
          style={{
            flex: 1,
            padding: isMobile ? '12px' : '8px',
            background: viewMode === 'elevations' ? 'rgba(0,200,255,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${viewMode === 'elevations' ? 'rgba(0,200,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '6px',
            color: viewMode === 'elevations' ? '#00c8ff' : '#8899aa',
            fontSize: '11px',
            cursor: 'pointer',
            fontWeight: viewMode === 'elevations' ? '600' : '400',
          }}
        >
          Elevations
        </button>
      </div>

      {/* Sheets Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ color: '#6080a0', fontSize: '10px', textTransform: 'uppercase' }}>
          Sheets
        </span>
        <button
          onClick={onAddSheet}
          style={{
            padding: '4px 10px',
            background: 'rgba(0,200,255,0.15)',
            border: '1px solid rgba(0,200,255,0.3)',
            borderRadius: '4px',
            color: '#00c8ff',
            fontSize: '10px',
            cursor: 'pointer',
          }}
        >
          + Add Sheet
        </button>
      </div>

      {/* Sheet List */}
      {sheets.length === 0 ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#6080a0',
          fontSize: '11px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '6px',
        }}>
          No sheets yet. Add a sheet to create printable layouts.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              onClick={() => onSelectSheet(sheet.id)}
              style={{
                padding: '10px',
                background: activeSheetId === sheet.id ? 'rgba(0,200,255,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeSheetId === sheet.id ? 'rgba(0,200,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {/* Sheet header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="text"
                    value={sheet.sheetNumber ?? ''}
                    placeholder="A01"
                    onChange={(e) => {
                      e.stopPropagation();
                      onUpdateSheet(sheet.id, { sheetNumber: e.target.value });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '40px',
                      background: 'rgba(0,200,255,0.1)',
                      border: '1px solid rgba(0,200,255,0.3)',
                      borderRadius: '3px',
                      color: '#00c8ff',
                      fontSize: '10px',
                      fontWeight: '600',
                      textAlign: 'center',
                      padding: '2px',
                    }}
                  />
                  <input
                    type="text"
                    value={sheet.sheetTitle ?? ''}
                    placeholder="Floor Plan"
                    onChange={(e) => {
                      e.stopPropagation();
                      onUpdateSheet(sheet.id, { sheetTitle: e.target.value });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSheet(sheet.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff6666',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  ×
                </button>
              </div>

              {/* Sheet settings */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                <SheetDropdown
                  value={sheet.size}
                  options={SIZE_OPTIONS}
                  onChange={(value) => onUpdateSheet(sheet.id, { size: value })}
                  onClick={(e) => e.stopPropagation()}
                />
                <SheetDropdown
                  value={sheet.scale}
                  options={SCALE_OPTIONS}
                  onChange={(value) => onUpdateSheet(sheet.id, { scale: value })}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Paper size info */}
              <div style={{ marginTop: '6px', fontSize: '9px', color: '#6080a0' }}>
                {PAPER_SIZES[sheet.size]?.name || sheet.size}
                {sheet.orientation === 'portrait' ? ' (Portrait)' : ' (Landscape)'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SheetsPanel;
