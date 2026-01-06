import React, { useState, useEffect } from 'react';
import { FloatingPanel, PanelSection } from '../ui/Panel';
import { Button } from '../ui/Button';
import { TextInput, Select } from '../ui/Input';

const ROOM_COLOR_OPTIONS = [
  { value: 'rgba(100, 200, 255, 0.15)', label: 'Blue (Default)' },
  { value: 'rgba(100, 255, 100, 0.15)', label: 'Green' },
  { value: 'rgba(255, 200, 100, 0.15)', label: 'Orange' },
  { value: 'rgba(255, 100, 100, 0.15)', label: 'Red' },
  { value: 'rgba(200, 100, 255, 0.15)', label: 'Purple' },
  { value: 'rgba(255, 255, 100, 0.15)', label: 'Yellow' },
  { value: 'rgba(150, 150, 150, 0.15)', label: 'Gray' },
  { value: 'rgba(255, 255, 255, 0.15)', label: 'White' },
];

const ROOM_TYPE_PRESETS = [
  { value: 'Room', label: 'Room (Generic)' },
  { value: 'Living Room', label: 'Living Room' },
  { value: 'Bedroom', label: 'Bedroom' },
  { value: 'Master Bedroom', label: 'Master Bedroom' },
  { value: 'Kitchen', label: 'Kitchen' },
  { value: 'Dining Room', label: 'Dining Room' },
  { value: 'Bathroom', label: 'Bathroom' },
  { value: 'Master Bath', label: 'Master Bath' },
  { value: 'Half Bath', label: 'Half Bath' },
  { value: 'Office', label: 'Office' },
  { value: 'Den', label: 'Den' },
  { value: 'Family Room', label: 'Family Room' },
  { value: 'Laundry', label: 'Laundry' },
  { value: 'Garage', label: 'Garage' },
  { value: 'Closet', label: 'Closet' },
  { value: 'Walk-in Closet', label: 'Walk-in Closet' },
  { value: 'Pantry', label: 'Pantry' },
  { value: 'Mudroom', label: 'Mudroom' },
  { value: 'Foyer', label: 'Foyer' },
  { value: 'Hallway', label: 'Hallway' },
  { value: 'Utility', label: 'Utility' },
  { value: 'Storage', label: 'Storage' },
  { value: 'Basement', label: 'Basement' },
  { value: 'Attic', label: 'Attic' },
  { value: 'Porch', label: 'Porch' },
  { value: 'Deck', label: 'Deck' },
  { value: 'Patio', label: 'Patio' },
];

/**
 * RoomEditor - Editor panel for room properties
 */
export const RoomEditor = ({
  room,
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
  const [customName, setCustomName] = useState(room?.name || 'Room');

  // Update custom name when room changes
  useEffect(() => {
    setCustomName(room?.name || 'Room');
  }, [room?.id, room?.name]);

  // Notify parent when vertex selection changes (for canvas highlighting)
  useEffect(() => {
    onVertexSelect?.(selectedVertexIndex);
    // Clear selection when component unmounts
    return () => onVertexSelect?.(null);
  }, [selectedVertexIndex, onVertexSelect]);

  if (!room) return null;

  const pointCount = room.points?.length || 0;

  // Delete a vertex by index
  const deleteVertex = (index) => {
    if (pointCount <= 3) return; // Need at least 3 points for a polygon
    const newPoints = [...room.points];
    newPoints.splice(index, 1);
    onUpdate({ points: newPoints });
    setSelectedVertexIndex(null);
  };

  // Add a vertex at the midpoint between two vertices
  const addVertexAfter = (index) => {
    const newPoints = [...room.points];
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

  // Handle preset selection
  const handlePresetSelect = (name) => {
    setCustomName(name);
    onUpdate({ name });
  };

  // Handle custom name input
  const handleNameChange = (name) => {
    setCustomName(name);
    onUpdate({ name });
  };

  return (
    <FloatingPanel
      title="Room Properties"
      onClose={onClose}
      onMinimize={() => setMinimized(!minimized)}
      minimized={minimized}
      isMobile={isMobile}
      x={x}
      y={y}
    >
      <div style={{ padding: '12px' }}>
        <PanelSection title="Room Name">
          <TextInput
            value={customName}
            onChange={handleNameChange}
            placeholder="Enter room name..."
          />
          <div style={{ marginTop: '8px' }}>
            <div style={{ color: '#6080a0', fontSize: '10px', marginBottom: '4px' }}>Quick Select</div>
            <Select
              value={ROOM_TYPE_PRESETS.find(p => p.value === customName) ? customName : ''}
              onChange={handlePresetSelect}
              options={[{ value: '', label: '-- Select Type --' }, ...ROOM_TYPE_PRESETS]}
            />
          </div>
        </PanelSection>

        <PanelSection title="Color">
          <Select
            value={room.color || 'rgba(100, 200, 255, 0.15)'}
            onChange={(color) => onUpdate({ color })}
            options={ROOM_COLOR_OPTIONS}
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
            {room.points?.map((_, index) => (
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
              - Delete
            </Button>
          </div>
        </PanelSection>

        <PanelSection title="Actions">
          <Button
            variant="danger"
            onClick={onDelete}
            style={{ width: '100%' }}
          >
            Delete Room
          </Button>
        </PanelSection>
      </div>
    </FloatingPanel>
  );
};

export default RoomEditor;
