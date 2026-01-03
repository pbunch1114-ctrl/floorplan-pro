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

  // Extension line gap and overshoot
  const extensionGap = 3;
  const extensionOvershoot = 8;

  // Perpendicular offset direction
  const perpX = Math.sin(angle);
  const perpY = -Math.cos(angle);

  const results = [];

  // Left dimension (wall start to element center)
  if (distToWallStart > 20) {
    // Dimension line endpoints (in world coords)
    const dimStartX = wall.start.x + perpX * dimOffset;
    const dimStartY = wall.start.y + perpY * dimOffset;
    const dimEndX = elementPos.x + perpX * dimOffset;
    const dimEndY = elementPos.y + perpY * dimOffset;

    const midX = (dimStartX + dimEndX) / 2;
    const midY = (dimStartY + dimEndY) / 2;

    // Extension line points (from wall surface to dimension line)
    const extStart1 = { x: wall.start.x + perpX * extensionGap, y: wall.start.y + perpY * extensionGap };
    const extEnd1 = { x: wall.start.x + perpX * (dimOffset + extensionOvershoot), y: wall.start.y + perpY * (dimOffset + extensionOvershoot) };
    const extStart2 = { x: elementPos.x + perpX * extensionGap, y: elementPos.y + perpY * extensionGap };
    const extEnd2 = { x: elementPos.x + perpX * (dimOffset + extensionOvershoot), y: elementPos.y + perpY * (dimOffset + extensionOvershoot) };

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
      // Screen coords for lines
      dimLine: {
        x1: dimStartX * scale + offset.x,
        y1: dimStartY * scale + offset.y,
        x2: dimEndX * scale + offset.x,
        y2: dimEndY * scale + offset.y,
      },
      extLine1: {
        x1: extStart1.x * scale + offset.x,
        y1: extStart1.y * scale + offset.y,
        x2: extEnd1.x * scale + offset.x,
        y2: extEnd1.y * scale + offset.y,
      },
      extLine2: {
        x1: extStart2.x * scale + offset.x,
        y1: extStart2.y * scale + offset.y,
        x2: extEnd2.x * scale + offset.x,
        y2: extEnd2.y * scale + offset.y,
      },
    });
  }

  // Right dimension (element center to wall end)
  if (distToWallEnd > 20) {
    const dimStartX = elementPos.x + perpX * dimOffset;
    const dimStartY = elementPos.y + perpY * dimOffset;
    const dimEndX = wall.end.x + perpX * dimOffset;
    const dimEndY = wall.end.y + perpY * dimOffset;

    const midX = (dimStartX + dimEndX) / 2;
    const midY = (dimStartY + dimEndY) / 2;

    // Extension line points
    const extStart1 = { x: elementPos.x + perpX * extensionGap, y: elementPos.y + perpY * extensionGap };
    const extEnd1 = { x: elementPos.x + perpX * (dimOffset + extensionOvershoot), y: elementPos.y + perpY * (dimOffset + extensionOvershoot) };
    const extStart2 = { x: wall.end.x + perpX * extensionGap, y: wall.end.y + perpY * extensionGap };
    const extEnd2 = { x: wall.end.x + perpX * (dimOffset + extensionOvershoot), y: wall.end.y + perpY * (dimOffset + extensionOvershoot) };

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
      // Screen coords for lines
      dimLine: {
        x1: dimStartX * scale + offset.x,
        y1: dimStartY * scale + offset.y,
        x2: dimEndX * scale + offset.x,
        y2: dimEndY * scale + offset.y,
      },
      extLine1: {
        x1: extStart1.x * scale + offset.x,
        y1: extStart1.y * scale + offset.y,
        x2: extEnd1.x * scale + offset.x,
        y2: extEnd1.y * scale + offset.y,
      },
      extLine2: {
        x1: extStart2.x * scale + offset.x,
        y1: extStart2.y * scale + offset.y,
        x2: extEnd2.x * scale + offset.x,
        y2: extEnd2.y * scale + offset.y,
      },
    });
  }

  return results;
}

/**
 * TempDimensionEditor - Overlay component for editing temporary dimensions
 * Renders clickable dimension boxes that allow repositioning doors/windows
 * Also renders extension lines and dimension lines as SVG
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
  const lineColor = isArchitectural ? '#000000' : '#00aaff';

  return (
    <>
      {/* SVG layer for dimension lines and extension lines */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      >
        {dimensions.map((dim) => (
          <g key={`lines-${dim.side}`}>
            {/* Extension line 1 */}
            <line
              x1={dim.extLine1.x1}
              y1={dim.extLine1.y1}
              x2={dim.extLine1.x2}
              y2={dim.extLine1.y2}
              stroke={lineColor}
              strokeWidth={isArchitectural ? 0.5 : 1}
            />
            {/* Extension line 2 */}
            <line
              x1={dim.extLine2.x1}
              y1={dim.extLine2.y1}
              x2={dim.extLine2.x2}
              y2={dim.extLine2.y2}
              stroke={lineColor}
              strokeWidth={isArchitectural ? 0.5 : 1}
            />
            {/* Dimension line with tick marks */}
            <line
              x1={dim.dimLine.x1}
              y1={dim.dimLine.y1}
              x2={dim.dimLine.x2}
              y2={dim.dimLine.y2}
              stroke={lineColor}
              strokeWidth={isArchitectural ? 0.5 : 1}
            />
            {/* Tick mark at start */}
            <line
              x1={dim.dimLine.x1}
              y1={dim.dimLine.y1 - 4}
              x2={dim.dimLine.x1}
              y2={dim.dimLine.y1 + 4}
              stroke={lineColor}
              strokeWidth={isArchitectural ? 0.5 : 1}
              transform={`rotate(${dim.angle * 180 / Math.PI}, ${dim.dimLine.x1}, ${dim.dimLine.y1})`}
            />
            {/* Tick mark at end */}
            <line
              x1={dim.dimLine.x2}
              y1={dim.dimLine.y2 - 4}
              x2={dim.dimLine.x2}
              y2={dim.dimLine.y2 + 4}
              stroke={lineColor}
              strokeWidth={isArchitectural ? 0.5 : 1}
              transform={`rotate(${dim.angle * 180 / Math.PI}, ${dim.dimLine.x2}, ${dim.dimLine.y2})`}
            />
          </g>
        ))}
      </svg>

      {/* Text boxes for editable dimensions */}
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
              zIndex: 60,
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
                  zIndex: 1000,
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

/**
 * WallTempDimensionEditor - Shows editable dimension for wall length
 * When a wall is selected, displays a clickable dimension that can be edited
 * to change the wall length (extending/contracting from the end point)
 */
export const WallTempDimensionEditor = ({
  wall,           // The wall object
  scale,          // Current zoom scale
  offset,         // Current pan offset
  units,          // 'imperial' or 'metric'
  onUpdate,       // Callback to update wall
  onUpdateWithElements, // Callback to update wall and recalculate door/window positions
  wallDetailLevel = 'simple',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  // Calculate wall properties
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const wallLength = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  // Get wall thickness for offset
  const thicknessInches = WALL_THICKNESS_OPTIONS[wall.type]?.thickness || 8;
  const thickness = inchesToPixels(thicknessInches);

  // Offset for dimension line (below the wall)
  const dimOffset = thickness / 2 + 25;

  // Extension line parameters
  const extensionGap = 3;
  const extensionOvershoot = 8;

  // Perpendicular offset direction
  const perpX = Math.sin(angle);
  const perpY = -Math.cos(angle);

  // Dimension line endpoints (in world coords)
  const dimStartX = wall.start.x + perpX * dimOffset;
  const dimStartY = wall.start.y + perpY * dimOffset;
  const dimEndX = wall.end.x + perpX * dimOffset;
  const dimEndY = wall.end.y + perpY * dimOffset;

  const midX = (dimStartX + dimEndX) / 2;
  const midY = (dimStartY + dimEndY) / 2;

  // Extension line points
  const extStart1 = { x: wall.start.x + perpX * extensionGap, y: wall.start.y + perpY * extensionGap };
  const extEnd1 = { x: wall.start.x + perpX * (dimOffset + extensionOvershoot), y: wall.start.y + perpY * (dimOffset + extensionOvershoot) };
  const extStart2 = { x: wall.end.x + perpX * extensionGap, y: wall.end.y + perpY * extensionGap };
  const extEnd2 = { x: wall.end.x + perpX * (dimOffset + extensionOvershoot), y: wall.end.y + perpY * (dimOffset + extensionOvershoot) };

  // Screen coordinates
  const screenX = midX * scale + offset.x;
  const screenY = midY * scale + offset.y;

  const dimLine = {
    x1: dimStartX * scale + offset.x,
    y1: dimStartY * scale + offset.y,
    x2: dimEndX * scale + offset.x,
    y2: dimEndY * scale + offset.y,
  };

  const extLine1 = {
    x1: extStart1.x * scale + offset.x,
    y1: extStart1.y * scale + offset.y,
    x2: extEnd1.x * scale + offset.x,
    y2: extEnd1.y * scale + offset.y,
  };

  const extLine2 = {
    x1: extStart2.x * scale + offset.x,
    y1: extStart2.y * scale + offset.y,
    x2: extEnd2.x * scale + offset.x,
    y2: extEnd2.y * scale + offset.y,
  };

  const label = formatMeasurement(pixelsToFeet(wallLength), units);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDimensionClick = useCallback(() => {
    setIsEditing(true);
    setInputValue(label);
  }, [label]);

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    if (!isEditing) return;

    // Parse the new value
    const newLengthFeet = parseFeetInches(inputValue);
    const newLengthPixels = feetToPixels(newLengthFeet);

    if (newLengthPixels > 10) { // Minimum wall length
      // Calculate new end point (extend/contract from end)
      const unitX = dx / wallLength;
      const unitY = dy / wallLength;

      const newEnd = {
        x: wall.start.x + unitX * newLengthPixels,
        y: wall.start.y + unitY * newLengthPixels
      };

      // Use onUpdateWithElements if available to keep doors/windows at absolute positions
      if (onUpdateWithElements) {
        onUpdateWithElements({ end: newEnd }, wallLength, newLengthPixels);
      } else {
        onUpdate({ end: newEnd });
      }
    }

    setIsEditing(false);
    setInputValue('');
  }, [isEditing, inputValue, wall, dx, dy, wallLength, onUpdate, onUpdateWithElements]);

  const handleInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue('');
    }
  }, [handleInputBlur]);

  const isArchitectural = wallDetailLevel === 'architectural';
  const lineColor = isArchitectural ? '#000000' : '#00aaff';

  // Calculate rotation for the text box
  let textAngle = angle * (180 / Math.PI);
  if (textAngle > 90) textAngle -= 180;
  if (textAngle < -90) textAngle += 180;

  return (
    <>
      {/* SVG layer for dimension lines and extension lines */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      >
        {/* Extension line 1 */}
        <line
          x1={extLine1.x1}
          y1={extLine1.y1}
          x2={extLine1.x2}
          y2={extLine1.y2}
          stroke={lineColor}
          strokeWidth={isArchitectural ? 0.5 : 1}
        />
        {/* Extension line 2 */}
        <line
          x1={extLine2.x1}
          y1={extLine2.y1}
          x2={extLine2.x2}
          y2={extLine2.y2}
          stroke={lineColor}
          strokeWidth={isArchitectural ? 0.5 : 1}
        />
        {/* Dimension line with tick marks */}
        <line
          x1={dimLine.x1}
          y1={dimLine.y1}
          x2={dimLine.x2}
          y2={dimLine.y2}
          stroke={lineColor}
          strokeWidth={isArchitectural ? 0.5 : 1}
        />
        {/* Tick mark at start */}
        <line
          x1={dimLine.x1}
          y1={dimLine.y1 - 4}
          x2={dimLine.x1}
          y2={dimLine.y1 + 4}
          stroke={lineColor}
          strokeWidth={isArchitectural ? 0.5 : 1}
          transform={`rotate(${angle * 180 / Math.PI}, ${dimLine.x1}, ${dimLine.y1})`}
        />
        {/* Tick mark at end */}
        <line
          x1={dimLine.x2}
          y1={dimLine.y2 - 4}
          x2={dimLine.x2}
          y2={dimLine.y2 + 4}
          stroke={lineColor}
          strokeWidth={isArchitectural ? 0.5 : 1}
          transform={`rotate(${angle * 180 / Math.PI}, ${dimLine.x2}, ${dimLine.y2})`}
        />
      </svg>

      {/* Text box for editable dimension */}
      <div
        style={{
          position: 'absolute',
          left: screenX,
          top: screenY,
          transform: `translate(-50%, -50%) rotate(${textAngle}deg)`,
          zIndex: 60,
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
              zIndex: 1000,
            }}
          />
        ) : (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleDimensionClick();
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
            title="Click to edit wall length"
          >
            {label}
          </div>
        )}
      </div>
    </>
  );
};

export default TempDimensionEditor;
