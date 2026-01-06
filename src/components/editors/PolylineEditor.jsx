import React, { useState, useEffect } from 'react';
import { FloatingPanel, PanelSection } from '../ui/Panel';
import { Button } from '../ui/Button';
import { Select, NumberInput, Checkbox } from '../ui/Input';

const LINE_TYPE_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'dashdot', label: 'Dash-Dot' },
  { value: 'center', label: 'Center' },
  { value: 'hidden', label: 'Hidden' },
];

const COLOR_OPTIONS = [
  { value: '#00c8ff', label: 'Cyan' },
  { value: '#ffffff', label: 'White' },
  { value: '#ff0000', label: 'Red' },
  { value: '#00ff00', label: 'Green' },
  { value: '#ffff00', label: 'Yellow' },
  { value: '#ff00ff', label: 'Magenta' },
  { value: '#000000', label: 'Black' },
];

/**
 * PolylineEditor - Editor panel for polyline properties
 */
export const PolylineEditor = ({
  polyline,
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

  if (!polyline) return null;

  const pointCount = polyline.points?.length || 0;

  // Delete a vertex by index
  const deleteVertex = (index) => {
    if (pointCount <= 2) return; // Need at least 2 points for a polyline
    const newPoints = [...polyline.points];
    newPoints.splice(index, 1);
    onUpdate({ points: newPoints });
    setSelectedVertexIndex(null);
  };

  // Add a vertex at the midpoint between two vertices
  const addVertexAfter = (index) => {
    const newPoints = [...polyline.points];
    const nextIndex = (index + 1) % pointCount;
    const p1 = newPoints[index];
    const p2 = newPoints[nextIndex];
    const midpoint = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
    // Insert after the current index
    newPoints.splice(index + 1, 0, midpoint);
    onUpdate({ points: newPoints });
  };

  return (
    <FloatingPanel
      title="Polyline Properties"
      onClose={onClose}
      onMinimize={() => setMinimized(!minimized)}
      minimized={minimized}
      isMobile={isMobile}
      x={x}
      y={y}
    >
      <div style={{ padding: '12px' }}>
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
            {polyline.points?.map((_, index) => (
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
              disabled={selectedVertexIndex === null || pointCount <= 2}
              style={{ flex: 1, fontSize: '11px', padding: '6px' }}
            >
              − Delete
            </Button>
          </div>
        </PanelSection>

        <PanelSection title="Line Style">
          <Select
            value={polyline.lineType || 'solid'}
            onChange={(lineType) => onUpdate({ lineType })}
            options={LINE_TYPE_OPTIONS}
          />
        </PanelSection>

        <PanelSection title="Color">
          <Select
            value={polyline.color || '#00c8ff'}
            onChange={(color) => onUpdate({ color })}
            options={COLOR_OPTIONS}
          />
        </PanelSection>

        <PanelSection title="Line Width">
          <NumberInput
            label="Width"
            value={polyline.lineWidth || 1}
            onChange={(lineWidth) => onUpdate({ lineWidth })}
            min={0.5}
            max={10}
            step={0.5}
            suffix="px"
          />
        </PanelSection>

        <PanelSection title="Options">
          <Checkbox
            label="Closed shape"
            checked={polyline.closed || false}
            onChange={(closed) => onUpdate({ closed })}
          />
        </PanelSection>

        <PanelSection title="Actions">
          <Button
            variant="danger"
            onClick={onDelete}
            style={{ width: '100%' }}
          >
            Delete Polyline
          </Button>
        </PanelSection>
      </div>
    </FloatingPanel>
  );
};

export default PolylineEditor;
