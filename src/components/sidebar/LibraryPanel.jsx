import React, { useState } from 'react';
import { Panel, PanelSection } from '../ui/Panel';
import { Button } from '../ui/Button';
import { FURNITURE_LIBRARY, FURNITURE_CATEGORIES } from '../../constants/furniture';
import { STAIRS_LIBRARY } from '../../constants/stairs';
import { ELECTRICAL_LIBRARY, ELECTRICAL_CATEGORIES } from '../../constants/electrical';
import { PLUMBING_LIBRARY } from '../../constants/plumbing';

/**
 * FurnitureLibrary - Library of furniture items
 */
export const FurnitureLibrary = ({
  onSelect,
  onClose,
  isMobile = false,
}) => {
  const [category, setCategory] = useState('all');

  const filteredItems = category === 'all'
    ? FURNITURE_LIBRARY
    : FURNITURE_LIBRARY.filter(f => f.category === category);

  return (
    <Panel
      title="Furniture"
      onClose={onClose}
      position="right"
      width={isMobile ? 280 : 260}
    >
      {/* Category filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
        {FURNITURE_CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            variant="ghost"
            active={category === cat.id}
            onClick={() => setCategory(cat.id)}
            size="small"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Items grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
        }}
      >
        {filteredItems.map((item) => (
          <Button
            key={item.id}
            variant="default"
            onClick={() => onSelect(item)}
            style={{
              flexDirection: 'column',
              padding: '12px 8px',
              minHeight: '70px',
            }}
          >
            <span style={{ fontSize: '24px', marginBottom: '4px' }}>{item.icon}</span>
            <span style={{ fontSize: '10px', textAlign: 'center', lineHeight: 1.2 }}>
              {item.name}
            </span>
          </Button>
        ))}
      </div>
    </Panel>
  );
};

/**
 * StairsLibrary - Library of stairs items
 */
export const StairsLibrary = ({
  onSelect,
  onClose,
  isMobile = false,
}) => {
  return (
    <Panel
      title="Stairs & Ramps"
      onClose={onClose}
      position="right"
      width={isMobile ? 280 : 260}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
        }}
      >
        {STAIRS_LIBRARY.map((item) => (
          <Button
            key={item.id}
            variant="default"
            onClick={() => onSelect(item)}
            style={{
              flexDirection: 'column',
              padding: '12px 8px',
              minHeight: '70px',
            }}
          >
            <span style={{ fontSize: '24px', marginBottom: '4px' }}>{item.icon}</span>
            <span style={{ fontSize: '10px', textAlign: 'center', lineHeight: 1.2 }}>
              {item.name}
            </span>
          </Button>
        ))}
      </div>
    </Panel>
  );
};

/**
 * ElectricalLibrary - Library of electrical symbols
 */
export const ElectricalLibrary = ({
  onSelect,
  onClose,
  isMobile = false,
}) => {
  const [category, setCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All' },
    ...ELECTRICAL_CATEGORIES,
  ];

  const filteredItems = category === 'all'
    ? ELECTRICAL_LIBRARY
    : ELECTRICAL_LIBRARY.filter(e => e.category === category);

  return (
    <Panel
      title="Electrical"
      onClose={onClose}
      position="right"
      width={isMobile ? 280 : 260}
    >
      {/* Category filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant="ghost"
            active={category === cat.id}
            onClick={() => setCategory(cat.id)}
            size="small"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Items grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
        }}
      >
        {filteredItems.map((item) => (
          <Button
            key={item.id}
            variant="default"
            onClick={() => onSelect(item)}
            style={{
              flexDirection: 'column',
              padding: '12px 8px',
              minHeight: '70px',
            }}
          >
            <span style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</span>
            <span style={{ fontSize: '10px', textAlign: 'center', lineHeight: 1.2 }}>
              {item.name}
            </span>
          </Button>
        ))}
      </div>
    </Panel>
  );
};

/**
 * PlumbingLibrary - Library of plumbing symbols
 */
export const PlumbingLibrary = ({
  onSelect,
  onClose,
  isMobile = false,
}) => {
  return (
    <Panel
      title="Plumbing"
      onClose={onClose}
      position="right"
      width={isMobile ? 280 : 260}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
        }}
      >
        {PLUMBING_LIBRARY.map((item) => (
          <Button
            key={item.id}
            variant="default"
            onClick={() => onSelect(item)}
            style={{
              flexDirection: 'column',
              padding: '12px 8px',
              minHeight: '70px',
            }}
          >
            <span style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</span>
            <span style={{ fontSize: '10px', textAlign: 'center', lineHeight: 1.2 }}>
              {item.name}
            </span>
          </Button>
        ))}
      </div>
    </Panel>
  );
};

export default FurnitureLibrary;
