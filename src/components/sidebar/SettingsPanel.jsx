import React from 'react';
import { Panel, PanelSection } from '../ui/Panel';
import { Select, Checkbox } from '../ui/Input';
import { GRID_OPTIONS } from '../../constants/grid';

/**
 * SettingsPanel - Application settings
 */
export const SettingsPanel = ({
  units,
  setUnits,
  gridSize,
  setGridSize,
  angleSnap,
  setAngleSnap,
  showDimensions,
  setShowDimensions,
  showGrips,
  setShowGrips,
  thinLines,
  setThinLines,
  wallDetailLevel,
  setWallDetailLevel,
  snaps = {},
  setSnaps,
  onClose,
  isMobile = false,
}) => {
  // Helper to toggle individual snap types
  const toggleSnap = (snapType) => {
    if (setSnaps) {
      setSnaps(prev => ({
        ...prev,
        [snapType]: !prev[snapType]
      }));
    }
  };
  const unitOptions = [
    { value: 'imperial', label: 'Imperial (ft-in)' },
    { value: 'metric', label: 'Metric (m)' },
    { value: 'decimal', label: 'Decimal (ft)' },
  ];

  const gridOptions = Object.entries(GRID_OPTIONS).map(([key, val]) => ({
    value: key,
    label: val.label,
  }));

  const angleSnapOptions = [
    { value: 'off', label: 'Off' },
    { value: '15', label: '15°' },
    { value: '30', label: '30°' },
    { value: '45', label: '45°' },
    { value: '90', label: '90°' },
  ];

  const wallDetailOptions = [
    { value: 'simple', label: 'Simple' },
    { value: 'architectural', label: 'Architectural' },
    { value: 'standard', label: 'Standard' },
    { value: 'detailed', label: 'Detailed' },
  ];

  return (
    <Panel
      title="Settings"
      onClose={onClose}
      position="right"
      width={isMobile ? 280 : 260}
    >
      <PanelSection title="Units & Grid">
        <Select
          label="Measurement Units"
          value={units}
          onChange={setUnits}
          options={unitOptions}
        />
        <Select
          label="Grid Size"
          value={gridSize}
          onChange={setGridSize}
          options={gridOptions}
        />
        <Select
          label="Angle Snap"
          value={angleSnap}
          onChange={setAngleSnap}
          options={angleSnapOptions}
        />
      </PanelSection>

      <PanelSection title="Display">
        <Checkbox
          label="Show Dimensions"
          checked={showDimensions}
          onChange={setShowDimensions}
        />
        <Checkbox
          label="Show Grips"
          checked={showGrips}
          onChange={setShowGrips}
        />
        <Checkbox
          label="Thin Lines"
          checked={thinLines}
          onChange={setThinLines}
        />
        <Select
          label="Wall Detail Level"
          value={wallDetailLevel}
          onChange={setWallDetailLevel}
          options={wallDetailOptions}
        />
      </PanelSection>

      <PanelSection title="Object Snaps">
        <Checkbox
          label="Endpoint"
          checked={snaps.endpoint ?? true}
          onChange={() => toggleSnap('endpoint')}
        />
        <Checkbox
          label="Midpoint"
          checked={snaps.midpoint ?? true}
          onChange={() => toggleSnap('midpoint')}
        />
        <Checkbox
          label="Perpendicular"
          checked={snaps.perpendicular ?? true}
          onChange={() => toggleSnap('perpendicular')}
        />
        <Checkbox
          label="Nearest"
          checked={snaps.nearest ?? true}
          onChange={() => toggleSnap('nearest')}
        />
        <Checkbox
          label="Grid"
          checked={snaps.grid ?? true}
          onChange={() => toggleSnap('grid')}
        />
      </PanelSection>
    </Panel>
  );
};

export default SettingsPanel;
