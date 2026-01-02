import React from 'react';
import { FloatingPanel, PanelSection } from '../ui/Panel';
import { Button } from '../ui/Button';
import { Select, NumberInput, Checkbox } from '../ui/Input';
import { ROOF_TYPES, ROOF_PITCHES } from '../../constants/roofs';

/**
 * RoofEditor - Editor panel for roof properties
 */
export const RoofEditor = ({
  roof,
  onUpdate,
  onDelete,
  onClose,
  x = 20,
  y = 100,
}) => {
  if (!roof) return null;

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
      x={x}
      y={y}
    >
      <div style={{ padding: '12px' }}>
        <PanelSection title="Roof Type">
          <Select
            value={roof.roofType || 'gable'}
            onChange={(roofType) => onUpdate({ roofType })}
            options={roofTypeOptions}
          />
          <div style={{ color: '#6080a0', fontSize: '10px', marginTop: '-6px', marginBottom: '10px' }}>
            {ROOF_TYPES[roof.roofType || 'gable']?.description}
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

        <PanelSection title="Display Options">
          <Button
            variant="default"
            onClick={() => onUpdate({ ridgeDirection: roof.ridgeDirection === 'horizontal' ? 'vertical' : 'horizontal' })}
            style={{ width: '100%', marginBottom: '8px' }}
          >
            🔄 Flip Ridge Direction
          </Button>
          <Checkbox
            label="Show Rafters"
            checked={roof.showRafters || false}
            onChange={(showRafters) => onUpdate({ showRafters })}
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
