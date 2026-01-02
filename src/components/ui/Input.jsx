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
 * NumberInput component
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
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
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
 * Select component
 */
export const Select = ({
  value,
  onChange,
  options,
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.1)',
          border: '2px solid rgba(0,200,255,0.3)',
          borderRadius: '6px',
          color: '#fff',
          fontSize: '14px',
          boxSizing: 'border-box',
          cursor: 'pointer',
          ...style,
        }}
        {...props}
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{ background: '#1a2030', color: '#fff' }}
          >
            {opt.label}
          </option>
        ))}
      </select>
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
