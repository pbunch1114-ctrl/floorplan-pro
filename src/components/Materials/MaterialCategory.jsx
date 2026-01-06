import React from 'react';
import { getMaterialIcon, getCategoryIcon } from './MaterialIcons';

/**
 * MaterialCategory - Displays materials for a single category
 */
const MaterialCategory = ({ materials, categoryName, categoryId }) => {
  if (!materials || materials.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '10px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <span style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {getCategoryIcon(categoryId)}
        </span>
        <span style={{ color: '#00c8ff', fontSize: '13px', fontWeight: '600' }}>
          {categoryName}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {materials.map((material) => (
          <div
            key={material.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.05)',
              gap: '12px',
            }}
          >
            {/* Material Icon - SVG */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(0,200,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              padding: '6px',
            }}>
              {getMaterialIcon(material.id)}
            </div>

            {/* Material Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#c0d0e0', fontSize: '12px', fontWeight: '500' }}>
                {material.name}
              </div>
              <div style={{ color: '#6080a0', fontSize: '10px', marginTop: '2px' }}>
                {material.unitSize}
              </div>
            </div>

            {/* Quantity */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              flexShrink: 0,
            }}>
              <span style={{
                color: '#00c8ff',
                fontSize: '18px',
                fontWeight: '600',
              }}>
                {material.quantity}
              </span>
              <span style={{ color: '#6080a0', fontSize: '10px' }}>
                {material.unit}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaterialCategory;
