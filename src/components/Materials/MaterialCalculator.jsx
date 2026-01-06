import React, { useState, useMemo } from 'react';
import { Button } from '../ui';
import MaterialCategory from './MaterialCategory';
import { getCategoryIcon } from './MaterialIcons';
import {
  MATERIAL_CATEGORIES,
  CATEGORY_LABELS,
  DEFAULT_WALL_HEIGHT,
  DEFAULT_WASTE_FACTOR,
  DEFAULT_CONCRETE_DEPTH,
} from '../../constants/materials';
import {
  calculateMaterialsForCategory,
  formatAllMaterialsAsText,
  calculateAllMaterials,
  analyzeWallsByType,
  calculateFramingFromWalls,
} from '../../utils/materialCalculations';

/**
 * MaterialCalculator - Modal for calculating material estimates
 */
const MaterialCalculator = ({
  sqft = 0,
  perimeter = 0,
  walls = [], // Wall data for framing calculations
  source = 'manual', // 'selection', 'room', 'all', 'manual'
  onClose,
  isMobile = false,
}) => {
  // Ensure we have valid numbers, default to 0
  const initialSqft = (typeof sqft === 'number' && !isNaN(sqft)) ? sqft : 0;
  const initialPerimeter = (typeof perimeter === 'number' && !isNaN(perimeter)) ? perimeter : 0;

  // Calculate average wall height from actual walls, or use default
  const getWallHeightFromWalls = () => {
    if (!walls || walls.length === 0) return DEFAULT_WALL_HEIGHT;

    // Get all wall heights (wall.height is in inches, convert to feet)
    const heights = walls
      .map(w => w.height)
      .filter(h => typeof h === 'number' && !isNaN(h) && h > 0);

    if (heights.length === 0) return DEFAULT_WALL_HEIGHT;

    // Use the most common height, or average if varied
    const avgHeightInches = heights.reduce((sum, h) => sum + h, 0) / heights.length;
    return Math.round(avgHeightInches / 12 * 10) / 10; // Convert to feet with 1 decimal
  };

  const [activeCategory, setActiveCategory] = useState(MATERIAL_CATEGORIES.FLOORING);
  const [settings, setSettings] = useState({
    wallHeight: getWallHeightFromWalls(),
    wasteFactor: DEFAULT_WASTE_FACTOR,
    concreteDepth: DEFAULT_CONCRETE_DEPTH,
  });
  const [manualSqft, setManualSqft] = useState(initialSqft);
  const [manualPerimeter, setManualPerimeter] = useState(initialPerimeter);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  // If source is 'all' but values are 0, switch to manual mode
  const effectiveSource = (source === 'all' && initialSqft === 0 && initialPerimeter === 0) ? 'manual' : source;

  // Use manual values if source is manual, otherwise use props
  const effectiveSqft = effectiveSource === 'manual' ? manualSqft : initialSqft;
  const effectivePerimeter = effectiveSource === 'manual' ? manualPerimeter : initialPerimeter;

  // Calculate wall area
  const wallArea = effectivePerimeter * settings.wallHeight;

  // Analyze walls by type for framing calculations
  const wallBreakdown = useMemo(() => {
    return analyzeWallsByType(walls, 40); // 40 pixels per foot
  }, [walls]);

  // Calculate materials for current category
  const currentMaterials = useMemo(() => {
    // For framing, use wall-type-aware calculation
    if (activeCategory === MATERIAL_CATEGORIES.FRAMING && walls.length > 0) {
      return calculateFramingFromWalls(wallBreakdown, settings.wallHeight);
    }
    return calculateMaterialsForCategory(
      activeCategory,
      effectiveSqft,
      effectivePerimeter,
      settings
    );
  }, [activeCategory, effectiveSqft, effectivePerimeter, settings, walls, wallBreakdown]);

  // Handle copy to clipboard
  const handleCopy = () => {
    const allMaterials = calculateAllMaterials(effectiveSqft, effectivePerimeter, settings);
    const text = formatAllMaterialsAsText(allMaterials, effectiveSqft, effectivePerimeter, settings);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Handle print
  const handlePrint = () => {
    const allMaterials = calculateAllMaterials(effectiveSqft, effectivePerimeter, settings);
    const text = formatAllMaterialsAsText(allMaterials, effectiveSqft, effectivePerimeter, settings);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Material Estimate</title>
          <style>
            body { font-family: monospace; padding: 20px; white-space: pre-wrap; }
          </style>
        </head>
        <body>${text}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const categories = Object.values(MATERIAL_CATEGORIES);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 299,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isMobile ? 'calc(100% - 24px)' : '480px',
          maxWidth: '480px',
          maxHeight: isMobile ? 'calc(100vh - 80px)' : '85vh',
          background: 'linear-gradient(180deg, rgba(15,20,28,0.98) 0%, rgba(8,12,16,0.98) 100%)',
          border: '1px solid rgba(0,200,255,0.3)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,200,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🧮</span>
            <span style={{ color: '#00c8ff', fontWeight: '600', fontSize: '14px' }}>
              Material Calculator
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,100,100,0.15)',
              border: 'none',
              color: '#ff6666',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Area Info */}
        <div style={{
          padding: '12px 16px',
          background: 'rgba(0,200,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: effectiveSource === 'manual' ? '1fr 1fr' : 'repeat(3, 1fr)',
            gap: '12px',
          }}>
            {effectiveSource === 'manual' ? (
              <>
                <div>
                  <label style={{ color: '#6080a0', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Floor Area (sq ft)
                  </label>
                  <input
                    type="number"
                    value={manualSqft}
                    onChange={(e) => setManualSqft(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(0,200,255,0.3)',
                      borderRadius: '6px',
                      color: '#00c8ff',
                      fontSize: '16px',
                      fontWeight: '600',
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: '#6080a0', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Perimeter (lin ft)
                  </label>
                  <input
                    type="number"
                    value={manualPerimeter}
                    onChange={(e) => setManualPerimeter(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(0,200,255,0.3)',
                      borderRadius: '6px',
                      color: '#00c8ff',
                      fontSize: '16px',
                      fontWeight: '600',
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#6080a0', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Floor Area
                  </div>
                  <div style={{ color: '#00c8ff', fontSize: '18px', fontWeight: '600' }}>
                    {effectiveSqft.toLocaleString()}
                  </div>
                  <div style={{ color: '#6080a0', fontSize: '11px' }}>sq ft</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#6080a0', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Perimeter
                  </div>
                  <div style={{ color: '#00c8ff', fontSize: '18px', fontWeight: '600' }}>
                    {effectivePerimeter.toLocaleString()}
                  </div>
                  <div style={{ color: '#6080a0', fontSize: '11px' }}>lin ft</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#6080a0', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Wall Area
                  </div>
                  <div style={{ color: '#00c8ff', fontSize: '18px', fontWeight: '600' }}>
                    {Math.round(wallArea).toLocaleString()}
                  </div>
                  <div style={{ color: '#6080a0', fontSize: '11px' }}>sq ft</div>
                </div>
              </>
            )}
          </div>

          {/* Settings toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              marginTop: '10px',
              background: 'none',
              border: 'none',
              color: '#6080a0',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{showSettings ? '▼' : '▶'}</span>
            <span>Settings</span>
          </button>

          {/* Settings panel */}
          {showSettings && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '6px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
            }}>
              <div>
                <label style={{ color: '#6080a0', fontSize: '10px', display: 'block', marginBottom: '4px' }}>
                  Wall Height (ft)
                </label>
                <input
                  type="number"
                  value={settings.wallHeight}
                  onChange={(e) => setSettings(s => ({ ...s, wallHeight: parseFloat(e.target.value) || 8 }))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    color: '#c0d0e0',
                    fontSize: '12px',
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#6080a0', fontSize: '10px', display: 'block', marginBottom: '4px' }}>
                  Waste Factor (%)
                </label>
                <input
                  type="number"
                  value={Math.round(settings.wasteFactor * 100)}
                  onChange={(e) => setSettings(s => ({ ...s, wasteFactor: (parseFloat(e.target.value) || 10) / 100 }))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    color: '#c0d0e0',
                    fontSize: '12px',
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#6080a0', fontSize: '10px', display: 'block', marginBottom: '4px' }}>
                  Concrete Depth (in)
                </label>
                <input
                  type="number"
                  value={settings.concreteDepth}
                  onChange={(e) => setSettings(s => ({ ...s, concreteDepth: parseFloat(e.target.value) || 4 }))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    color: '#c0d0e0',
                    fontSize: '12px',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '8px 12px',
          overflowX: 'auto',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              style={{
                padding: '6px 10px',
                background: activeCategory === category ? 'rgba(0,200,255,0.2)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeCategory === category ? 'rgba(0,200,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '6px',
                color: activeCategory === category ? '#00c8ff' : '#8899aa',
                fontSize: '10px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getCategoryIcon(category, activeCategory === category ? '#00c8ff' : '#8899aa')}
              </span>
              <span>{CATEGORY_LABELS[category]}</span>
            </button>
          ))}
        </div>

        {/* Materials List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
        }}>
          {effectiveSqft === 0 && effectivePerimeter === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#6080a0',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📐</div>
              <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                No area selected
              </div>
              <div style={{ fontSize: '11px', lineHeight: 1.5 }}>
                Enter square footage and perimeter above,<br />
                or select an area on the floor plan.
              </div>
            </div>
          ) : (
            <MaterialCategory
              materials={currentMaterials}
              categoryName={CATEGORY_LABELS[activeCategory]}
              categoryId={activeCategory}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
        }}>
          <Button
            variant="default"
            onClick={handleCopy}
            disabled={effectiveSqft === 0 && effectivePerimeter === 0}
          >
            {copied ? '✓ Copied!' : '📋 Copy All'}
          </Button>
          <Button
            variant="default"
            onClick={handlePrint}
            disabled={effectiveSqft === 0 && effectivePerimeter === 0}
          >
            🖨️ Print
          </Button>
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
};

export default MaterialCalculator;
