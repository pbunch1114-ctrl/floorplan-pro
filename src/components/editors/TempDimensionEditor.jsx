import React, { useState, useEffect, useRef, useCallback } from 'react';
import { parseFeetInches, formatMeasurement, pixelsToFeet, feetToPixels } from '../../utils/measurements';
import { WALL_THICKNESS_OPTIONS } from '../../constants/walls';
import { GRID_SIZE } from '../../constants/grid';

// Convert inches to pixels (GRID_SIZE pixels = 6 inches)
const inchesToPixels = (inches) => inches * (GRID_SIZE / 6);

/**
 * Calculate temporary dimension positions for a door/window on a wall
 * Returns screen coordinates for the left and right dimension text boxes
 * Dimensions go to the CENTER of the element
 */
export function calculateTempDimensionPositions(element, wall, scale, offset, units = 'imperial') {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const wallLength = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  // Element center position along wall (0-1 normalized)
  const elementCenterPos = element.position * wallLength;

  // Calculate distances from element CENTER to wall ends
  const distToWallStart = elementCenterPos; // Distance from wall start to center
  const distToWallEnd = wallLength - elementCenterPos; // Distance from center to wall end

  // Get wall thickness for offset
  const thicknessInches = WALL_THICKNESS_OPTIONS[wall.type]?.thickness || 8;
  const thickness = inchesToPixels(thicknessInches);

  // Element center position in world coordinates
  const elementPos = {
    x: wall.start.x + dx * element.position,
    y: wall.start.y + dy * element.position
  };

  // Offset for dimension lines (below the wall)
  const dimOffset = thickness / 2 + 25;

  // Perpendicular offset direction
  const perpX = Math.sin(angle);
  const perpY = -Math.cos(angle);

  const results = [];

  // Left dimension (wall start to element center)
  if (distToWallStart > 20) {
    const startX = wall.start.x + perpX * dimOffset;
    const startY = wall.start.y + perpY * dimOffset;
    const endX = elementPos.x + perpX * dimOffset;
    const endY = elementPos.y + perpY * dimOffset;

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    // Convert to screen coordinates
    const screenX = midX * scale + offset.x;
    const screenY = midY * scale + offset.y;

    results.push({
      side: 'left',
      screenX,
      screenY,
      distancePixels: distToWallStart,
      distanceFeet: pixelsToFeet(distToWallStart),
      label: formatMeasurement(pixelsToFeet(distToWallStart), units),
      angle,
    });
  }

  // Right dimension (element center to wall end)
  if (distToWallEnd > 20) {
    const startX = elementPos.x + perpX * dimOffset;
    const startY = elementPos.y + perpY * dimOffset;
    const endX = wall.end.x + perpX * dimOffset;
    const endY = wall.end.y + perpY * dimOffset;

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    // Convert to screen coordinates
    const screenX = midX * scale + offset.x;
    const screenY = midY * scale + offset.y;

    results.push({
      side: 'right',
      screenX,
      screenY,
      distancePixels: distToWallEnd,
      distanceFeet: pixelsToFeet(distToWallEnd),
      label: formatMeasurement(pixelsToFeet(distToWallEnd), units),
      angle,
    });
  }

  return results;
}

/**
 * TempDimensionEditor - Overlay component for editing temporary dimensions
 * Renders clickable dimension boxes that allow repositioning doors/windows
 */
export const TempDimensionEditor = ({
  element,        // The door or window object
  elementType,    // 'door' or 'window'
  wall,           // The wall the element is on
  scale,          // Current zoom scale
  offset,         // Current pan offset
  units,          // 'imperial' or 'metric'
  onUpdate,       // Callback to update element position
  wallDetailLevel = 'simple',
}) => {
  const [editingSide, setEditingSide] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  // Calculate dimension positions
  const dimensions = calculateTempDimensionPositions(element, wall, scale, offset, units);

  // Focus input when editing starts
  useEffect(() => {
    if (editingSide && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingSide]);

  const handleDimensionClick = useCallback((dim) => {
    setEditingSide(dim.side);
    setInputValue(dim.label);
  }, []);

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    if (!editingSide) return;

    // Parse the new value
    const newDistanceFeet = parseFeetInches(inputValue);
    const newDistancePixels = feetToPixels(newDistanceFeet);

    // Calculate wall length
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const wallLength = Math.sqrt(dx * dx + dy * dy);

    // Get element width for clamping
    const elementWidthInches = element.width || 36;
    const elementWidthPixels = inchesToPixels(elementWidthInches);
    const halfWidth = elementWidthPixels / 2;

    // Calculate new center position based on which side was edited
    // Since dimensions now go to CENTER, the math is simpler
    let newCenterPos;
    if (editingSide === 'left') {
      // Left dimension: distance from wall start to element CENTER
      newCenterPos = newDistancePixels;
    } else {
      // Right dimension: distance from element CENTER to wall end
      newCenterPos = wallLength - newDistancePixels;
    }

    // Convert to normalized position (0-1)
    let newPosition = newCenterPos / wallLength;

    // Clamp to valid range (element must fit within wall)
    const minPosition = halfWidth / wallLength;
    const maxPosition = 1 - halfWidth / wallLength;
    newPosition = Math.max(minPosition, Math.min(maxPosition, newPosition));

    // Update the element
    onUpdate({ position: newPosition });

    setEditingSide(null);
    setInputValue('');
  }, [editingSide, inputValue, element, wall, onUpdate]);

  const handleInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setEditingSide(null);
      setInputValue('');
    }
  }, [handleInputBlur]);

  const isArchitectural = wallDetailLevel === 'architectural';

  return (
    <>
      {dimensions.map((dim) => {
        const isEditing = editingSide === dim.side;

        // Calculate rotation for the box (keep text readable)
        let textAngle = dim.angle * (180 / Math.PI);
        if (textAngle > 90) textAngle -= 180;
        if (textAngle < -90) textAngle += 180;

        return (
          <div
            key={dim.side}
            style={{
              position: 'absolute',
              left: dim.screenX,
              top: dim.screenY,
              transform: `translate(-50%, -50%) rotate(${textAngle}deg)`,
              zIndex: 1000,
              pointerEvents: 'auto',
            }}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  width: '80px',
                  padding: '4px 8px',
                  background: isArchitectural ? '#ffffff' : 'rgba(8,12,16,0.95)',
                  border: `2px solid ${isArchitectural ? '#0066cc' : '#00aaff'}`,
                  borderRadius: '4px',
                  color: isArchitectural ? '#000000' : '#00aaff',
                  fontSize: '12px',
                  fontFamily: '"SF Mono", monospace',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              />
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleDimensionClick(dim);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  padding: '3px 8px',
                  background: isArchitectural ? 'rgba(255,255,255,0.95)' : 'rgba(8,12,16,0.9)',
                  border: `1px solid ${isArchitectural ? '#000000' : '#00aaff'}`,
                  borderRadius: '3px',
                  color: isArchitectural ? '#000000' : '#00aaff',
                  fontSize: '11px',
                  fontFamily: '"SF Mono", monospace',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isArchitectural ? '#e6f3ff' : 'rgba(0,170,255,0.2)';
                  e.currentTarget.style.borderColor = isArchitectural ? '#0066cc' : '#00ffaa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isArchitectural ? 'rgba(255,255,255,0.95)' : 'rgba(8,12,16,0.9)';
                  e.currentTarget.style.borderColor = isArchitectural ? '#000000' : '#00aaff';
                }}
                title="Click to edit"
              >
                {dim.label}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default TempDimensionEditor;
