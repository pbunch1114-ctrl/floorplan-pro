import React, { useState } from 'react';
import { FloatingPanel, PanelSection } from '../ui/Panel';
import { Button } from '../ui/Button';
import { NumberInput, Slider } from '../ui/Input';

/**
 * FurnitureEditor - Editor panel for furniture properties
 */
export const FurnitureEditor = ({
  furniture,
  onUpdate,
  onDelete,
  onClose,
  x = 20,
  y = 100,
  isMobile = false,
}) => {
  const [minimized, setMinimized] = useState(false);

  if (!furniture) return null;

  return (
    <FloatingPanel
      title={furniture.name || 'Furniture'}
      onClose={onClose}
      onMinimize={() => setMinimized(!minimized)}
      minimized={minimized}
      x={x}
      y={y}
      isMobile={isMobile}
    >
      <div style={{ padding: '12px' }}>
        <PanelSection title="Dimensions">
          <NumberInput
            label="Width"
            value={furniture.width || 36}
            onChange={(width) => onUpdate({ width })}
            min={6}
            max={240}
            step={1}
            suffix="in"
          />
          <NumberInput
            label="Depth"
            value={furniture.height || 24}
            onChange={(height) => onUpdate({ height })}
            min={6}
            max={240}
            step={1}
            suffix="in"
          />
        </PanelSection>

        <PanelSection title="Rotation">
          <Slider
            value={furniture.rotation || 0}
            onChange={(rotation) => onUpdate({ rotation })}
            min={0}
            max={360}
            step={15}
            suffix="°"
          />
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <Button
              variant="default"
              onClick={() => onUpdate({ rotation: 0 })}
              style={{ flex: 1, fontSize: '11px' }}
            >
              0°
            </Button>
            <Button
              variant="default"
              onClick={() => onUpdate({ rotation: 90 })}
              style={{ flex: 1, fontSize: '11px' }}
            >
              90°
            </Button>
            <Button
              variant="default"
              onClick={() => onUpdate({ rotation: 180 })}
              style={{ flex: 1, fontSize: '11px' }}
            >
              180°
            </Button>
            <Button
              variant="default"
              onClick={() => onUpdate({ rotation: 270 })}
              style={{ flex: 1, fontSize: '11px' }}
            >
              270°
            </Button>
          </div>
        </PanelSection>

        <PanelSection title="Actions">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="default"
              onClick={() => {
                // Flip width and depth
                onUpdate({
                  width: furniture.height,
                  height: furniture.width,
                });
              }}
              style={{ flex: 1 }}
            >
              ↔ Flip
            </Button>
            <Button
              variant="danger"
              onClick={onDelete}
              style={{ flex: 1 }}
            >
              Delete
            </Button>
          </div>
        </PanelSection>
      </div>
    </FloatingPanel>
  );
};

export default FurnitureEditor;
