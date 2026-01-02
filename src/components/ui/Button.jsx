import React from 'react';

/**
 * Button component with various styles
 */
export const Button = ({
  children,
  onClick,
  active = false,
  disabled = false,
  variant = 'default', // 'default', 'primary', 'danger', 'ghost', 'icon'
  size = 'medium', // 'small', 'medium', 'large'
  style = {},
  className = '',
  title,
  ...props
}) => {
  const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    border: 'none',
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: '500',
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.5 : 1,
    fontFamily: 'inherit',
  };

  const sizeStyles = {
    small: { padding: '6px 10px', fontSize: '11px', minWidth: '28px', minHeight: '28px' },
    medium: { padding: '8px 14px', fontSize: '12px', minWidth: '36px', minHeight: '36px' },
    large: { padding: '12px 20px', fontSize: '14px', minWidth: '44px', minHeight: '44px' },
  };

  const variantStyles = {
    default: {
      background: active ? 'rgba(0,200,255,0.2)' : 'rgba(255,255,255,0.08)',
      color: active ? '#00c8ff' : '#d0d8e0',
      border: active ? '1px solid rgba(0,200,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
    },
    primary: {
      background: 'rgba(0,200,255,0.2)',
      color: '#00c8ff',
      border: '1px solid rgba(0,200,255,0.4)',
    },
    danger: {
      background: 'rgba(255,80,80,0.15)',
      color: '#ff6666',
      border: '1px solid rgba(255,80,80,0.3)',
    },
    ghost: {
      background: 'transparent',
      color: active ? '#00c8ff' : '#8090a0',
      border: 'none',
    },
    icon: {
      background: active ? 'rgba(0,200,255,0.2)' : 'transparent',
      color: active ? '#00c8ff' : '#8090a0',
      border: 'none',
      padding: '6px',
      minWidth: 'auto',
    },
  };

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={combinedStyles}
      title={title}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * IconButton - square button for icons
 */
export const IconButton = ({ icon, ...props }) => (
  <Button variant="icon" {...props}>
    {icon}
  </Button>
);

/**
 * ToolButton - for toolbar tools
 */
export const ToolButton = ({ icon, label, active, onClick, isMobile, ...props }) => (
  <Button
    variant="default"
    active={active}
    onClick={onClick}
    style={{
      flexDirection: isMobile ? 'column' : 'row',
      padding: isMobile ? '8px 12px' : '8px 14px',
      minWidth: isMobile ? 'auto' : '80px',
      gap: isMobile ? '2px' : '6px',
    }}
    {...props}
  >
    <span style={{ fontSize: isMobile ? '16px' : '14px' }}>{icon}</span>
    <span style={{ fontSize: isMobile ? '9px' : '11px' }}>{label}</span>
  </Button>
);

export default Button;
