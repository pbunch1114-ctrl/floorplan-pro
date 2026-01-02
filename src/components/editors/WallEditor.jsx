import React, { useState } from 'react';
import { FloatingPanel, PanelSection } from '../ui/Panel';
import { Button } from '../ui/Button';
import { MeasurementInput, Select, NumberInput } from '../ui/Input';
import { WALL_THICKNESS_OPTIONS } from '../../constants/walls';

/**
 * WallEditor - Editor panel for wall properties
 */
export const WallEditor = ({
  wall,
  onUpdate,
  onDelete,
  onClose,
  formatMeasurement,
  units,
  isMobile = false,
  x = 20,
  y = 100,
}) => {
  const [minimized, setMinimized] = useState(false);

  if (!wall) return null;

  const wallTypeOptions = Object.entries(WALL_THICKNESS_OPTIONS).map(([key, val]) => ({
    value: key,
    label: isMobile ? val.label : val.fullLabel,
  }));

  return (
    <FloatingPanel
      title="Wall"
      onClose={onClose}
      onMinimize={() => setMinimized(!minimized)}
      minimized={minimized}
      isMobile={isMobile}
      x={x}
      y={y}
    >
      <div style={{ padding: isMobile ? '8px' : '10px' }}>
        <PanelSection title="Type">
          <Select
            value={wall.type || 'interior'}
            onChange={(type) => {
              const typeInfo = WALL_THICKNESS_OPTIONS[type];
              onUpdate({
                type,
                thickness: typeInfo.thickness,
                height: wall.height || typeInfo.defaultHeight,
              });
            }}
            options={wallTypeOptions}
          />
        </PanelSection>

        <PanelSection title="Size">
          <NumberInput
            label="Height"
            value={wall.height || 96}
            onChange={(height) => onUpdate({ height })}
            min={12}
            max={240}
            step={1}
            suffix="in"
          />
          <NumberInput
            label="Thick"
            value={wall.thickness || 6}
            onChange={(thickness) => onUpdate({ thickness })}
            min={2}
            max={24}
            step={0.5}
            suffix="in"
          />
        </PanelSection>

        <PanelSection title="Orientation">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant={wall.flipped ? 'primary' : 'default'}
              onClick={() => onUpdate({ flipped: !wall.flipped })}
              style={{ flex: 1, padding: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '11px' }}
            >
              {wall.flipped ? 'Flipped' : 'Flip Wall'}
            </Button>
            <span style={{ fontSize: '10px', color: '#888', flex: 1 }}>
              Swaps inside/outside
            </span>
          </div>
        </PanelSection>

        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          <Button
            variant="default"
            onClick={() => onUpdate({ rotation: (wall.rotation || 0) + 90 })}
            style={{ flex: 1, padding: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '11px' }}
          >
            Rotate
          </Button>
          <Button
            variant="danger"
            onClick={onDelete}
            style={{ flex: 1, padding: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '11px' }}
          >
            Delete
          </Button>
        </div>
      </div>
    </FloatingPanel>
  );
};

export default WallEditor;
