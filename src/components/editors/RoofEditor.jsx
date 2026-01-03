import React, { useState } from 'react';
import { FloatingPanel, PanelSection } from '../ui/Panel';
import { Button } from '../ui/Button';
import { Select, NumberInput, Checkbox } from '../ui/Input';
import { ROOF_TYPES, ROOF_PITCHES } from '../../constants/roofs';

/**
 * RoofEditor - Editor panel for roof properties
 */
// Helper to get points array from roof (handles legacy format)
function getRoofPoints(roof) {
  if (roof.points && roof.points.length >= 3) {
    return roof.points;
  }
  const { x, y, width, height } = roof;
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
}

export const RoofEditor = ({
  roof,
  onUpdate,
  onDelete,
  onClose,
  x = 20,
  y = 100,
  isMobile = false,
}) => {
  const [minimized, setMinimized] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState(0); // For adding points
  const [selectedPoint, setSelectedPoint] = useState(0); // For removing points

  if (!roof) return null;

  const points = getRoofPoints(roof);
  const pointCount = points.length;

  // Generate edge options (P1-P2, P2-P3, etc.)
  const edgeOptions = points.map((_, i) => ({
    value: i.toString(),
    label: `Edge P${i + 1}-P${((i + 1) % pointCount) + 1}`,
  }));

  // Generate point options (P1, P2, etc.)
  const pointOptions = points.map((_, i) => ({
    value: i.toString(),
    label: `P${i + 1}`,
  }));

  const roofTypeOptions = Object.entries(ROOF_TYPES).map(([key, val]) => ({
    value: key,
    label: `${val.icon} ${val.label}`,
  }));

  const pitchOptions = Object.entries(ROOF_PITCHES).map(([key, val]) => ({
    value: key,
    label: val.label,
  }));

  return (
    <FloatingPanel
      title="Roof Properties"
      onClose={onClose}
      onMinimize={() => setMinimized(!minimized)}
      minimized={minimized}
      isMobile={isMobile}
      x={x}
      y={y}
      maxHeight={450}
    >
      <div style={{ padding: '12px' }}>
        <PanelSection title="Roof Type">
          <Select
            value={roof.type || 'gable'}
            onChange={(type) => onUpdate({ type })}
            options={roofTypeOptions}
          />
          <div style={{ color: '#6080a0', fontSize: '10px', marginTop: '-6px', marginBottom: '10px' }}>
            {ROOF_TYPES[roof.type || 'gable']?.description}
          </div>
        </PanelSection>

        <PanelSection title="Configuration">
          <Select
            label="Pitch"
            value={roof.pitch || '6:12'}
            onChange={(pitch) => onUpdate({ pitch })}
            options={pitchOptions}
          />
          <NumberInput
            label="Overhang"
            value={roof.overhang || 12}
            onChange={(overhang) => onUpdate({ overhang })}
            min={0}
            max={48}
            step={1}
            suffix="in"
          />
        </PanelSection>

        <PanelSection title="Shape Editing">
          <div style={{ color: '#6080a0', fontSize: '10px', marginBottom: '8px' }}>
            {pointCount} corners - drag corners to reshape
          </div>

          {/* Add Point */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Select
                value={selectedEdge.toString()}
                onChange={(val) => setSelectedEdge(parseInt(val))}
                options={edgeOptions}
                style={{ flex: 1 }}
              />
              <Button
                variant="default"
                onClick={() => {
                  const edgeStart = selectedEdge;
                  const edgeEnd = (selectedEdge + 1) % pointCount;
                  const newPoints = [...points];
                  const midX = (points[edgeStart].x + points[edgeEnd].x) / 2;
                  const midY = (points[edgeStart].y + points[edgeEnd].y) / 2;
                  newPoints.splice(edgeEnd, 0, { x: midX, y: midY });
                  onUpdate({ points: newPoints });
                  // Reset selection to valid index
                  setSelectedEdge(0);
                  setSelectedPoint(0);
                }}
                style={{ whiteSpace: 'nowrap' }}
              >
                + Add
              </Button>
            </div>
          </div>

          {/* Remove Point */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Select
              value={selectedPoint.toString()}
              onChange={(val) => setSelectedPoint(parseInt(val))}
              options={pointOptions}
              style={{ flex: 1 }}
              disabled={pointCount <= 3}
            />
            <Button
              variant="default"
              onClick={() => {
                if (pointCount <= 3) return;
                const newPoints = points.filter((_, i) => i !== selectedPoint);
                onUpdate({ points: newPoints });
                // Reset selection to valid index
                setSelectedEdge(0);
                setSelectedPoint(Math.min(selectedPoint, newPoints.length - 1));
              }}
              style={{ whiteSpace: 'nowrap', opacity: pointCount <= 3 ? 0.5 : 1 }}
              disabled={pointCount <= 3}
            >
              - Remove
            </Button>
          </div>
        </PanelSection>

        <PanelSection title="Display Options">
          <Button
            variant="default"
            onClick={() => onUpdate({ ridgeDirection: roof.ridgeDirection === 'horizontal' ? 'vertical' : 'horizontal' })}
            style={{ width: '100%', marginBottom: '8px' }}
          >
            Flip Ridge Direction
          </Button>
          <Checkbox
            label="Show Rafters"
            checked={roof.showRafters || false}
            onChange={(showRafters) => onUpdate({ showRafters })}
          />
          <Checkbox
            label="Show Endpoints"
            checked={roof.showEndpoints || false}
            onChange={(showEndpoints) => onUpdate({ showEndpoints })}
          />
        </PanelSection>

        <PanelSection title="Actions">
          <Button
            variant="danger"
            onClick={onDelete}
            style={{ width: '100%' }}
          >
            Delete Roof
          </Button>
        </PanelSection>
      </div>
    </FloatingPanel>
  );
};

export default RoofEditor;
