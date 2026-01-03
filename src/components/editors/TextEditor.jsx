import React, { useState, useRef, useEffect } from 'react';
import { FloatingPanel, PanelSection } from '../ui/Panel';
import { Button } from '../ui/Button';
import { NumberInput, Slider } from '../ui/Input';

/**
 * TextEditor - Editor panel for text annotation properties
 */
export const TextEditor = ({
  text,
  onUpdate,
  onDelete,
  onClose,
  x = 20,
  y = 100,
  isMobile = false,
}) => {
  const [minimized, setMinimized] = useState(false);
  const [editingText, setEditingText] = useState(false);
  const [textValue, setTextValue] = useState(text?.text || 'Text');
  const inputRef = useRef(null);

  useEffect(() => {
    if (text) {
      setTextValue(text.text || 'Text');
    }
  }, [text]);

  useEffect(() => {
    if (editingText && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingText]);

  if (!text) return null;

  const handleTextBlur = () => {
    if (textValue.trim()) {
      onUpdate({ text: textValue });
    } else {
      setTextValue(text.text || 'Text');
    }
    setEditingText(false);
  };

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTextBlur();
    } else if (e.key === 'Escape') {
      setTextValue(text.text || 'Text');
      setEditingText(false);
    }
  };

  const colorOptions = [
    { value: '#ffffff', label: 'White' },
    { value: '#000000', label: 'Black' },
    { value: '#ff0000', label: 'Red' },
    { value: '#00ff00', label: 'Green' },
    { value: '#0088ff', label: 'Blue' },
    { value: '#ffaa00', label: 'Orange' },
    { value: '#ff00ff', label: 'Magenta' },
    { value: '#00ffff', label: 'Cyan' },
  ];

  return (
    <FloatingPanel
      title="Text Properties"
      onClose={onClose}
      onMinimize={() => setMinimized(!minimized)}
      minimized={minimized}
      isMobile={isMobile}
      x={x}
      y={y}
    >
      <div style={{ padding: '12px' }}>
        <PanelSection title="Text Content">
          {editingText ? (
            <input
              ref={inputRef}
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onBlur={handleTextBlur}
              onKeyDown={handleTextKeyDown}
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'rgba(16,20,24,0.9)',
                border: '1px solid #00aaff',
                borderRadius: '4px',
                color: '#ffffff',
                fontSize: '13px',
                fontFamily: '"SF Mono", monospace',
                outline: 'none',
              }}
            />
          ) : (
            <div
              onClick={() => setEditingText(true)}
              style={{
                padding: '8px 10px',
                background: 'rgba(16,20,24,0.9)',
                border: '1px solid #3a4a5a',
                borderRadius: '4px',
                color: '#ffffff',
                fontSize: '13px',
                cursor: 'pointer',
                minHeight: '20px',
              }}
              title="Click to edit"
            >
              {text.text || 'Text'}
            </div>
          )}
        </PanelSection>

        <PanelSection title="Font Size">
          <NumberInput
            label="Size"
            value={text.fontSize || 14}
            onChange={(fontSize) => onUpdate({ fontSize })}
            min={8}
            max={72}
            step={1}
            suffix="px"
          />
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <Button
              variant="default"
              onClick={() => onUpdate({ fontSize: 10 })}
              style={{ flex: 1, fontSize: '10px' }}
            >
              Small
            </Button>
            <Button
              variant="default"
              onClick={() => onUpdate({ fontSize: 14 })}
              style={{ flex: 1, fontSize: '10px' }}
            >
              Normal
            </Button>
            <Button
              variant="default"
              onClick={() => onUpdate({ fontSize: 20 })}
              style={{ flex: 1, fontSize: '10px' }}
            >
              Large
            </Button>
          </div>
        </PanelSection>

        <PanelSection title="Color">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {colorOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onUpdate({ color: value })}
                title={label}
                style={{
                  width: '28px',
                  height: '28px',
                  background: value,
                  border: text.color === value ? '2px solid #00ffaa' : '2px solid #3a4a5a',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  boxShadow: text.color === value ? '0 0 6px rgba(0,255,170,0.5)' : 'none',
                }}
              />
            ))}
          </div>
        </PanelSection>

        <PanelSection title="Rotation">
          <Slider
            value={text.rotation || 0}
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
          <Button
            variant="danger"
            onClick={onDelete}
            style={{ width: '100%' }}
          >
            Delete Text
          </Button>
        </PanelSection>
      </div>
    </FloatingPanel>
  );
};

export default TextEditor;
