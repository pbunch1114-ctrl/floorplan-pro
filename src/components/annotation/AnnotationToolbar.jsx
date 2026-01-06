import React from 'react';
import { FloatingPanel, PanelSection } from '../ui/Panel';
import { Button } from '../ui/Button';
import { STAMP_TYPES } from '../canvas/renderers/annotationRenderer';

// Annotation tool definitions
const ANNOTATION_TOOLS = [
  { id: 'annotation-select', icon: '↖', label: 'Select' },
  { id: 'annotation-arrow', icon: '➔', label: 'Arrow' },
  { id: 'annotation-freehand', icon: '✎', label: 'Freehand' },
  { id: 'annotation-circle', icon: '○', label: 'Circle' },
  { id: 'annotation-rectangle', icon: '□', label: 'Rectangle' },
  { id: 'annotation-cloud', icon: '☁', label: 'Cloud' },
  { id: 'annotation-stamp', icon: '⬚', label: 'Stamp' },
  { id: 'annotation-callout', icon: '①', label: 'Callout' },
];

// Color presets for annotations
const COLOR_PRESETS = [
  { color: '#ff0000', label: 'Red' },
  { color: '#0066ff', label: 'Blue' },
  { color: '#00aa00', label: 'Green' },
  { color: '#ff8800', label: 'Orange' },
  { color: '#000000', label: 'Black' },
  { color: '#9900ff', label: 'Purple' },
];

// Thickness options
const THICKNESS_OPTIONS = [2, 4, 6, 8];

/**
 * AnnotationToolbar - Toolbar for annotation tools when in annotate mode
 */
export const AnnotationToolbar = ({
  activeTool,
  onToolChange,
  settings,
  onSettingsChange,
  onClearAll,
  onOpenCalloutNotes,
  hasAnnotations = false,
  hasCallouts = false,
  isMobile = false,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '8px',
        padding: '8px',
        background: 'rgba(12,18,24,0.95)',
        borderRadius: '8px',
        border: '1px solid rgba(0,200,255,0.2)',
      }}
    >
      {/* Tool buttons */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        flex: 1,
      }}>
        {ANNOTATION_TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
            style={{
              width: isMobile ? '36px' : '32px',
              height: isMobile ? '36px' : '32px',
              padding: '4px',
              background: activeTool === tool.id ? 'rgba(0,200,255,0.3)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${activeTool === tool.id ? '#00c8ff' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '6px',
              color: activeTool === tool.id ? '#00c8ff' : '#8899aa',
              fontSize: isMobile ? '16px' : '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{
        width: isMobile ? '100%' : '1px',
        height: isMobile ? '1px' : 'auto',
        background: 'rgba(255,255,255,0.1)',
      }} />

      {/* Color picker */}
      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
        {COLOR_PRESETS.map(preset => (
          <button
            key={preset.color}
            onClick={() => onSettingsChange({ color: preset.color })}
            title={preset.label}
            style={{
              width: '20px',
              height: '20px',
              padding: 0,
              background: preset.color,
              border: settings.color === preset.color
                ? '2px solid #fff'
                : '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {/* Thickness picker */}
      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
        {THICKNESS_OPTIONS.map(thickness => (
          <button
            key={thickness}
            onClick={() => onSettingsChange({ thickness })}
            title={`${thickness}px`}
            style={{
              width: '24px',
              height: '24px',
              padding: 0,
              background: settings.thickness === thickness
                ? 'rgba(0,200,255,0.2)'
                : 'rgba(255,255,255,0.05)',
              border: settings.thickness === thickness
                ? '1px solid #00c8ff'
                : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{
              width: `${thickness + 4}px`,
              height: `${thickness}px`,
              background: '#8899aa',
              borderRadius: '1px',
            }} />
          </button>
        ))}
      </div>

      {/* Callout Notes button */}
      {hasCallouts && onOpenCalloutNotes && (
        <button
          onClick={onOpenCalloutNotes}
          title="Edit callout notes"
          style={{
            padding: '4px 8px',
            background: 'rgba(255,100,0,0.2)',
            border: '1px solid rgba(255,100,0,0.5)',
            borderRadius: '6px',
            color: '#ff6633',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          Notes
        </button>
      )}

      {/* Clear all button */}
      {hasAnnotations && (
        <button
          onClick={onClearAll}
          title="Clear all annotations"
          style={{
            padding: '4px 8px',
            background: 'rgba(255,80,80,0.2)',
            border: '1px solid rgba(255,80,80,0.5)',
            borderRadius: '6px',
            color: '#ff6666',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
};

/**
 * StampSelector - Panel for selecting stamp type
 */
export const StampSelector = ({
  selectedStamp,
  onSelect,
  onClose,
  isMobile = false,
}) => {
  const stamps = Object.entries(STAMP_TYPES);

  return (
    <FloatingPanel
      title="Select Stamp"
      onClose={onClose}
      x={isMobile ? 10 : 100}
      y={isMobile ? 60 : 150}
      width={isMobile ? 280 : 260}
      isMobile={isMobile}
    >
      <div style={{ padding: '12px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
        }}>
          {stamps.map(([key, stamp]) => (
            <button
              key={key}
              onClick={() => {
                onSelect(key);
                onClose();
              }}
              style={{
                padding: '10px 8px',
                background: selectedStamp === key
                  ? stamp.bgColor
                  : 'rgba(255,255,255,0.05)',
                border: `2px ${selectedStamp === key ? 'solid' : 'dashed'} ${stamp.color}`,
                borderRadius: '6px',
                color: stamp.color,
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"SF Mono", monospace',
              }}
            >
              {stamp.text}
            </button>
          ))}
        </div>
      </div>
    </FloatingPanel>
  );
};

/**
 * AnnotationSettingsPanel - Settings panel for annotations
 */
export const AnnotationSettingsPanel = ({
  settings,
  onSettingsChange,
  onClose,
  isMobile = false,
}) => {
  return (
    <FloatingPanel
      title="Annotation Settings"
      onClose={onClose}
      x={isMobile ? 10 : 100}
      y={isMobile ? 60 : 200}
      width={isMobile ? 280 : 280}
      isMobile={isMobile}
    >
      <div style={{ padding: '12px' }}>
        <PanelSection title="Layer Position">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onSettingsChange({ aboveFloorPlan: true })}
              style={{
                flex: 1,
                padding: '8px',
                background: settings.aboveFloorPlan
                  ? 'rgba(0,200,255,0.2)'
                  : 'rgba(255,255,255,0.05)',
                border: `1px solid ${settings.aboveFloorPlan ? '#00c8ff' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '6px',
                color: settings.aboveFloorPlan ? '#00c8ff' : '#6080a0',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Above Floor Plan
            </button>
            <button
              onClick={() => onSettingsChange({ aboveFloorPlan: false })}
              style={{
                flex: 1,
                padding: '8px',
                background: !settings.aboveFloorPlan
                  ? 'rgba(0,200,255,0.2)'
                  : 'rgba(255,255,255,0.05)',
                border: `1px solid ${!settings.aboveFloorPlan ? '#00c8ff' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '6px',
                color: !settings.aboveFloorPlan ? '#00c8ff' : '#6080a0',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Below Floor Plan
            </button>
          </div>
        </PanelSection>

        <PanelSection title="Default Color">
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {COLOR_PRESETS.map(preset => (
              <button
                key={preset.color}
                onClick={() => onSettingsChange({ color: preset.color })}
                title={preset.label}
                style={{
                  width: '28px',
                  height: '28px',
                  padding: 0,
                  background: preset.color,
                  border: settings.color === preset.color
                    ? '3px solid #fff'
                    : '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </PanelSection>

        <PanelSection title="Default Thickness">
          <div style={{ display: 'flex', gap: '8px' }}>
            {THICKNESS_OPTIONS.map(thickness => (
              <button
                key={thickness}
                onClick={() => onSettingsChange({ thickness })}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  background: settings.thickness === thickness
                    ? 'rgba(0,200,255,0.2)'
                    : 'rgba(255,255,255,0.05)',
                  border: settings.thickness === thickness
                    ? '1px solid #00c8ff'
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: settings.thickness === thickness ? '#00c8ff' : '#6080a0',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {thickness}px
              </button>
            ))}
          </div>
        </PanelSection>
      </div>
    </FloatingPanel>
  );
};

/**
 * CalloutNotesPanel - Panel showing all callout notes
 */
export const CalloutNotesPanel = ({
  annotations,
  onUpdateAnnotation,
  onClose,
  isMobile = false,
}) => {
  const callouts = annotations.filter(a => a.type === 'callout').sort((a, b) => a.number - b.number);

  return (
    <FloatingPanel
      title="Callout Notes"
      onClose={onClose}
      x={isMobile ? 10 : 100}
      y={isMobile ? 60 : 150}
      width={isMobile ? 300 : 320}
      maxHeight={400}
      isMobile={isMobile}
    >
      <div style={{ padding: '12px' }}>
        {callouts.length === 0 ? (
          <p style={{ color: '#6080a0', fontSize: '12px', textAlign: 'center' }}>
            No callouts yet. Use the Callout tool to add numbered markers.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {callouts.map(callout => (
              <div
                key={callout.id}
                style={{
                  display: 'flex',
                  gap: '10px',
                  padding: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#ff0000',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  flexShrink: 0,
                }}>
                  {callout.number}
                </div>
                <textarea
                  value={callout.noteText || ''}
                  onChange={(e) => onUpdateAnnotation(callout.id, { noteText: e.target.value })}
                  placeholder="Add note..."
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    color: '#d0d8e0',
                    fontSize: '11px',
                    resize: 'vertical',
                    minHeight: '40px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </FloatingPanel>
  );
};

export default AnnotationToolbar;
