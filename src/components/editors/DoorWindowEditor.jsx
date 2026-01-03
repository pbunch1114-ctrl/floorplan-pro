import React, { useState } from 'react';
import { FloatingPanel, PanelSection } from '../ui/Panel';
import { Button } from '../ui/Button';
import { MeasurementInput, Select, NumberInput, Checkbox } from '../ui/Input';
import { DOOR_TYPES } from '../../constants/doors';
import { WINDOW_TYPES } from '../../constants/windows';

/**
 * DoorEditor - Editor panel for door properties
 */
export const DoorEditor = ({
  door,
  onUpdate,
  onDelete,
  onClose,
  formatMeasurement,
  units,
  x = 20,
  y = 100,
  isMobile = false,
}) => {
  const [minimized, setMinimized] = useState(false);

  if (!door) return null;

  const doorTypeOptions = DOOR_TYPES.map((type) => ({
    value: type.id,
    label: `${type.icon} ${type.name}`,
  }));

  return (
    <FloatingPanel
      title="Door Properties"
      onClose={onClose}
      onMinimize={() => setMinimized(!minimized)}
      minimized={minimized}
      isMobile={isMobile}
      x={x}
      y={y}
    >
      <div style={{ padding: '12px' }}>
        <PanelSection title="Door Type">
          <Select
            value={door.type || 'single'}
            onChange={(type) => {
              const doorType = DOOR_TYPES.find(t => t.id === type);
              onUpdate({
                type,
                width: doorType?.defaultWidth || door.width,
              });
            }}
            options={doorTypeOptions}
          />
        </PanelSection>

        <PanelSection title="Dimensions">
          <MeasurementInput
            label="Width"
            value={(door.width || 36) / 12}
            onChange={(feet) => onUpdate({ width: feet * 12 })}
            units={units}
            formatMeasurement={(v) => formatMeasurement(v)}
          />
          <NumberInput
            label="Height"
            value={door.height || 80}
            onChange={(height) => onUpdate({ height })}
            min={60}
            max={120}
            step={1}
            suffix="in"
          />
        </PanelSection>

        <PanelSection title="Swing Direction">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <Button
              variant="default"
              active={door.swing === 'left'}
              onClick={() => onUpdate({ swing: 'left' })}
              style={{ flex: 1 }}
            >
              ↶ Left
            </Button>
            <Button
              variant="default"
              active={door.swing === 'right'}
              onClick={() => onUpdate({ swing: 'right' })}
              style={{ flex: 1 }}
            >
              ↷ Right
            </Button>
          </div>
        </PanelSection>

        <PanelSection title="Open Direction">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="default"
              active={(door.openDirection || 'inward') === 'inward'}
              onClick={() => onUpdate({ openDirection: 'inward' })}
              style={{ flex: 1 }}
            >
              Inward
            </Button>
            <Button
              variant="default"
              active={door.openDirection === 'outward'}
              onClick={() => onUpdate({ openDirection: 'outward' })}
              style={{ flex: 1 }}
            >
              Outward
            </Button>
          </div>
        </PanelSection>

        <PanelSection title="Swing Angle">
          <NumberInput
            label="Angle"
            value={door.swingAngle ?? 90}
            onChange={(swingAngle) => onUpdate({ swingAngle })}
            min={0}
            max={180}
            step={5}
            suffix="°"
          />
        </PanelSection>

        <PanelSection title="Actions">
          <Button
            variant="danger"
            onClick={onDelete}
            style={{ width: '100%' }}
          >
            Delete Door
          </Button>
        </PanelSection>
      </div>
    </FloatingPanel>
  );
};

/**
 * WindowEditor - Editor panel for window properties
 */
export const WindowEditor = ({
  window: win,
  onUpdate,
  onDelete,
  onClose,
  formatMeasurement,
  units,
  x = 20,
  y = 100,
  isMobile = false,
}) => {
  const [minimized, setMinimized] = useState(false);

  if (!win) return null;

  const windowTypeOptions = WINDOW_TYPES.map((type) => ({
    value: type.id,
    label: `${type.icon} ${type.name}`,
  }));

  return (
    <FloatingPanel
      title="Window Properties"
      onClose={onClose}
      onMinimize={() => setMinimized(!minimized)}
      minimized={minimized}
      isMobile={isMobile}
      x={x}
      y={y}
    >
      <div style={{ padding: '12px' }}>
        <PanelSection title="Window Type">
          <Select
            value={win.type || 'double-hung'}
            onChange={(type) => {
              const windowType = WINDOW_TYPES.find(t => t.id === type);
              onUpdate({
                type,
                width: windowType?.defaultWidth || win.width,
                height: windowType?.defaultHeight || win.height,
              });
            }}
            options={windowTypeOptions}
          />
          <div style={{ color: '#6080a0', fontSize: '10px', marginTop: '-6px', marginBottom: '10px' }}>
            {WINDOW_TYPES.find(t => t.id === (win.type || 'double-hung'))?.description}
          </div>
        </PanelSection>

        <PanelSection title="Dimensions">
          <MeasurementInput
            label="Width"
            value={(win.width || 36) / 12}
            onChange={(feet) => onUpdate({ width: feet * 12 })}
            units={units}
            formatMeasurement={(v) => formatMeasurement(v)}
          />
          <NumberInput
            label="Height"
            value={win.height || 48}
            onChange={(height) => onUpdate({ height })}
            min={12}
            max={96}
            step={1}
            suffix="in"
          />
          <NumberInput
            label="Sill Height"
            value={win.sillHeight || 36}
            onChange={(sillHeight) => onUpdate({ sillHeight })}
            min={0}
            max={72}
            step={1}
            suffix="in"
          />
        </PanelSection>

        <PanelSection title="Actions">
          <Button
            variant="danger"
            onClick={onDelete}
            style={{ width: '100%' }}
          >
            Delete Window
          </Button>
        </PanelSection>
      </div>
    </FloatingPanel>
  );
};

export default DoorEditor;
