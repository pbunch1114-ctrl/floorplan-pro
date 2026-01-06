import React, { useState, useEffect, useRef } from 'react';
import { parseFeetInches } from '../../utils/measurements';
import { formatToFeetInches } from '../../utils/drawing';

/**
 * TextInput component
 */
export const TextInput = ({
  value,
  onChange,
  placeholder,
  label,
  style = {},
  ...props
}) => {
  return (
    <div style={{ marginBottom: '10px' }}>
      {label && (
        <label style={{ display: 'block', color: '#6080a0', fontSize: '10px', marginBottom: '4px' }}>
          {label}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.1)',
          border: '2px solid rgba(0,200,255,0.3)',
          borderRadius: '6px',
          color: '#fff',
          fontSize: '14px',
          boxSizing: 'border-box',
          ...style,
        }}
        {...props}
      />
    </div>
  );
};

/**
 * NumberInput component - commits value on blur to prevent erratic updates
 */
export const NumberInput = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  suffix,
  style = {},
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Sync local value with prop when not focused
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value);
    }
  }, [value, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    let parsed = parseFloat(localValue);
    if (isNaN(parsed)) {
      parsed = value; // Revert to original if invalid
    } else {
      // Clamp to min/max
      if (min !== undefined && parsed < min) parsed = min;
      if (max !== undefined && parsed > max) parsed = max;
    }
    setLocalValue(parsed);
    if (parsed !== value) {
      onChange(parsed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <div style={{ marginBottom: '10px' }}>
      {label && (
        <label style={{ display: 'block', color: '#6080a0', fontSize: '10px', marginBottom: '4px' }}>
          {label}
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="number"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          step={step}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid rgba(0,200,255,0.3)',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '14px',
            boxSizing: 'border-box',
            ...style,
          }}
          {...props}
        />
        {suffix && (
          <span style={{ color: '#6080a0', fontSize: '12px' }}>{suffix}</span>
        )}
      </div>
    </div>
  );
};

/**
 * MeasurementInput - for feet/inches input with parsing
 */
export const MeasurementInput = React.memo(({
  label,
  value,
  onChange,
  units = 'feetInches',
  formatMeasurement,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Update display value when value or units change (only when not focused)
  useEffect(() => {
    if (!isFocused) {
      if (units === 'feetInches') {
        setInputValue(formatToFeetInches(value));
      } else {
        setInputValue(String(value));
      }
    }
  }, [value, units, isFocused]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFeetInches(inputValue);
    onChange(parsed);
  };

  const handleFocus = (e) => {
    e.stopPropagation();
    setIsFocused(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const handleContainerTouch = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      style={{ marginBottom: '10px' }}
      onTouchStart={handleContainerTouch}
      onTouchMove={handleContainerTouch}
      onTouchEnd={handleContainerTouch}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <label style={{ color: '#6080a0', fontSize: '10px' }}>{label}</label>
        {formatMeasurement && (
          <span style={{ color: '#00c8ff', fontSize: '11px', fontWeight: '500' }}>
            {formatMeasurement(value)}
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        inputMode={units === 'feetInches' ? 'text' : 'decimal'}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); e.target.focus(); }}
        placeholder={units === 'feetInches' ? "e.g., 14'-6 1/2\"" : "feet"}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        style={{
          width: '100%',
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.1)',
          border: '2px solid rgba(0,200,255,0.3)',
          borderRadius: '6px',
          color: '#fff',
          fontSize: '16px', // Prevents zoom on iOS
          boxSizing: 'border-box',
          touchAction: 'manipulation',
          WebkitAppearance: 'none',
        }}
      />
      {units === 'feetInches' && (
        <div style={{ color: '#6080a0', fontSize: '8px', marginTop: '2px' }}>
          Formats: 14'-6 1/2" or 14-6.5 or 14.54
        </div>
      )}
    </div>
  );
});

/**
 * Select component - Custom styled dropdown
 */
export const Select = ({
  value,
  onChange,
  options,
  label,
  style = {},
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div style={{ marginBottom: '10px', position: 'relative' }} ref={containerRef}>
      {label && (
        <label style={{ display: 'block', color: '#6080a0', fontSize: '10px', marginBottom: '4px' }}>
          {label}
        </label>
      )}
      {/* Custom select button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: '#1a2030',
          border: '2px solid rgba(0,200,255,0.3)',
          borderRadius: '6px',
          color: '#fff',
          fontSize: '14px',
          boxSizing: 'border-box',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          ...style,
        }}
        {...props}
      >
        <span>{selectedOption?.label || 'Select...'}</span>
        <span style={{ fontSize: '10px', marginLeft: '8px' }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown options */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: '#1a2030',
            border: '2px solid rgba(0,200,255,0.3)',
            borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              style={{
                padding: '10px 12px',
                color: opt.value === value ? '#00c8ff' : '#fff',
                background: opt.value === value ? 'rgba(0,200,255,0.15)' : 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value) {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = opt.value === value ? 'rgba(0,200,255,0.15)' : 'transparent';
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Checkbox component
 */
export const Checkbox = ({
  checked,
  onChange,
  label,
  style = {},
  ...props
}) => {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '10px',
        cursor: 'pointer',
        color: '#d0d8e0',
        fontSize: '12px',
        ...style,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          width: '16px',
          height: '16px',
          accentColor: '#00c8ff',
        }}
        {...props}
      />
      {label}
    </label>
  );
};

/**
 * Slider component
 */
export const Slider = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  suffix = '',
  style = {},
  ...props
}) => {
  return (
    <div style={{ marginBottom: '10px' }}>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          {label && (
            <label style={{ color: '#6080a0', fontSize: '10px' }}>{label}</label>
          )}
          {showValue && (
            <span style={{ color: '#00c8ff', fontSize: '11px' }}>
              {value}{suffix}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        style={{
          width: '100%',
          accentColor: '#00c8ff',
          ...style,
        }}
        {...props}
      />
    </div>
  );
};

export default TextInput;
