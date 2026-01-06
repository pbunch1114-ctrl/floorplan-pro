import React, { useState, useEffect } from 'react';
import { FloatingPanel, PanelSection } from '../ui/Panel';
import { Button } from '../ui/Button';
import { Select, NumberInput, Checkbox } from '../ui/Input';
import { HATCH_PATTERNS } from '../canvas/renderers/hatchRenderer';

const PATTERN_OPTIONS = Object.entries(HATCH_PATTERNS).map(([value, config]) => ({
  value,
  label: config.label,
}));

const COLOR_OPTIONS = [
  { value: '#888888', label: 'Gray' },
  { value: '#000000', label: 'Black' },
  { value: '#ffffff', label: 'White' },
  { value: '#00c8ff', label: 'Cyan' },
  { value: '#ff0000', label: 'Red' },
  { value: '#00ff00', label: 'Green' },
  { value: '#0000ff', label: 'Blue' },
  { value: '#ffff00', label: 'Yellow' },
  { value: '#ff8800', label: 'Orange' },
  { value: '#8b4513', label: 'Brown' },
];

const BACKGROUND_OPTIONS = [
  { value: 'transparent', label: 'None' },
  { value: '#ffffff', label: 'White' },
  { value: '#f0f0f0', label: 'Light Gray' },
  { value: '#e0e0e0', label: 'Medium Gray' },
  { value: '#ffffc0', label: 'Light Yellow' },
  { value: '#c0ffc0', label: 'Light Green' },
  { value: '#c0c0ff', label: 'Light Blue' },
  { value: '#ffc0c0', label: 'Light Red' },
];

/**
 * HatchEditor - Editor panel for hatch properties
 */
export const HatchEditor = ({
  hatch,
  onUpdate,
  onDelete,
  onClose,
  onVertexSelect,
  x = 20,
  y = 100,
  isMobile = false,
}) => {
  const [minimized, setMinimized] = useState(false);
  const [selectedVertexIndex, setSelectedVertexIndex] = useState(null);

  // Notify parent when vertex selection changes (for canvas highlighting)
  useEffect(() => {
    onVertexSelect?.(selectedVertexIndex);
    // Clear selection when component unmounts
    return () => onVertexSelect?.(null);
  }, [selectedVertexIndex, onVertexSelect]);

  if (!hatch) return null;

  const pointCount = hatch.points?.length || 0;

  // Delete a vertex by index
  const deleteVertex = (index) => {
    if (pointCount <= 3) return; // Need at least 3 points for a polygon
    const newPoints = [...hatch.points];
    newPoints.splice(index, 1);
    onUpdate({ points: newPoints });
    setSelectedVertexIndex(null);
  };

  // Add a vertex at the midpoint between two vertices
  const addVertexAfter = (index) => {
    const newPoints = [...hatch.points];
    const nextIndex = (index + 1) % pointCount;
    const p1 = newPoints[index];
    const p2 = newPoints[nextIndex];
    const midpoint = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
    newPoints.splice(index + 1, 0, midpoint);
    onUpdate({ points: newPoints });
  };

  return (
    <FloatingPanel
      title="Hatch Properties"
      onClose={onClose}
      onMinimize={() => setMinimized(!minimized)}
      minimized={minimized}
      isMobile={isMobile}
      x={x}
      y={y}
    >
      <div style={{ padding: '12px' }}>
        <PanelSection title="Pattern">
          <Select
            value={hatch.pattern || 'diagonal'}
            onChange={(pattern) => onUpdate({ pattern })}
            options={PATTERN_OPTIONS}
          />
        </PanelSection>

        <PanelSection title="Colors">
          <div style={{ marginBottom: '8px' }}>
            <div style={{ color: '#6080a0', fontSize: '10px', marginBottom: '4px' }}>Pattern Color</div>
            <Select
              value={hatch.color || '#888888'}
              onChange={(color) => onUpdate({ color })}
              options={COLOR_OPTIONS}
            />
          </div>
          <div>
            <div style={{ color: '#6080a0', fontSize: '10px', marginBottom: '4px' }}>Background</div>
            <Select
              value={hatch.backgroundColor || 'transparent'}
              onChange={(backgroundColor) => onUpdate({ backgroundColor })}
              options={BACKGROUND_OPTIONS}
            />
          </div>
        </PanelSection>

        <PanelSection title="Settings">
          <NumberInput
            label="Spacing"
            value={hatch.spacing || 10}
            onChange={(spacing) => onUpdate({ spacing })}
            min={3}
            max={50}
            step={1}
            suffix="px"
          />
          <NumberInput
            label="Line Width"
            value={hatch.lineWidth || 1}
            onChange={(lineWidth) => onUpdate({ lineWidth })}
            min={0.5}
            max={5}
            step={0.5}
            suffix="px"
          />
          <NumberInput
            label="Opacity"
            value={Math.round((hatch.opacity || 0.5) * 100)}
            onChange={(value) => onUpdate({ opacity: value / 100 })}
            min={10}
            max={100}
            step={10}
            suffix="%"
          />
        </PanelSection>

        <PanelSection title="Vertices">
          <div style={{ color: '#6080a0', fontSize: '11px', marginBottom: '8px' }}>
            {pointCount} vertices - click to select, then use buttons below
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            marginBottom: '8px',
            maxHeight: '80px',
            overflowY: 'auto'
          }}>
            {hatch.points?.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedVertexIndex(selectedVertexIndex === index ? null : index)}
                style={{
                  width: '28px',
                  height: '28px',
                  border: selectedVertexIndex === index ? '2px solid #00ffaa' : '1px solid #4080a0',
                  borderRadius: '4px',
                  background: selectedVertexIndex === index ? 'rgba(0,255,170,0.2)' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="default"
              onClick={() => selectedVertexIndex !== null && addVertexAfter(selectedVertexIndex)}
              disabled={selectedVertexIndex === null}
              style={{ flex: 1, fontSize: '11px', padding: '6px' }}
            >
              + Add After
            </Button>
            <Button
              variant="default"
              onClick={() => selectedVertexIndex !== null && deleteVertex(selectedVertexIndex)}
              disabled={selectedVertexIndex === null || pointCount <= 3}
              style={{ flex: 1, fontSize: '11px', padding: '6px' }}
            >
              − Delete
            </Button>
          </div>
        </PanelSection>

        <PanelSection title="Actions">
          <Button
            variant="danger"
            onClick={onDelete}
            style={{ width: '100%' }}
          >
            Delete Hatch
          </Button>
        </PanelSection>
      </div>
    </FloatingPanel>
  );
};

export default HatchEditor;
