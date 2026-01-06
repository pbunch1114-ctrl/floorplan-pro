import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FloatingPanel, PanelSection } from '../ui/Panel';
import { Button } from '../ui/Button';
import { NumberInput } from '../ui/Input';

// Common architectural scale presets
const SCALE_PRESETS = [
  { label: '1/8" = 1\'-0"', ratio: 96 },   // 1:96
  { label: '1/4" = 1\'-0"', ratio: 48 },   // 1:48
  { label: '3/8" = 1\'-0"', ratio: 32 },   // 1:32
  { label: '1/2" = 1\'-0"', ratio: 24 },   // 1:24
  { label: '3/4" = 1\'-0"', ratio: 16 },   // 1:16
  { label: '1" = 1\'-0"', ratio: 12 },     // 1:12
  { label: '1-1/2" = 1\'-0"', ratio: 8 },  // 1:8
  { label: '3" = 1\'-0"', ratio: 4 },      // 1:4
];

/**
 * ScaleCalibration - Component for calibrating the PDF scale
 * User draws a line on a known dimension and enters the real measurement
 */
export const ScaleCalibration = ({
  pdfLayer,
  canvasRef,
  scale: viewScale,
  offset,
  onCalibrate,
  onClose,
  isMobile = false,
}) => {
  const [step, setStep] = useState(1); // 1: instructions, 2: drawing, 3: enter measurement
  const [lineStart, setLineStart] = useState(null);
  const [lineEnd, setLineEnd] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [feet, setFeet] = useState(0);
  const [inches, setInches] = useState(0);
  const [pixelLength, setPixelLength] = useState(0);

  // Convert screen coordinates to canvas world coordinates
  const screenToCanvas = useCallback((clientX, clientY) => {
    const canvas = canvasRef?.current;
    if (!canvas) return { x: clientX, y: clientY };

    const rect = canvas.getBoundingClientRect();
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    // Convert to world coordinates
    const x = (canvasX - offset.x) / viewScale;
    const y = (canvasY - offset.y) / viewScale;

    return { x, y };
  }, [canvasRef, viewScale, offset]);

  // Handle pointer events for drawing the calibration line
  const handlePointerDown = useCallback((e) => {
    if (step !== 2) return;

    const pos = screenToCanvas(e.clientX, e.clientY);
    setLineStart(pos);
    setLineEnd(pos);
    setIsDrawing(true);
  }, [step, screenToCanvas]);

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing || step !== 2) return;

    const pos = screenToCanvas(e.clientX, e.clientY);
    setLineEnd(pos);
  }, [isDrawing, step, screenToCanvas]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || step !== 2) return;

    setIsDrawing(false);

    if (lineStart && lineEnd) {
      // Calculate pixel length of the line
      const dx = lineEnd.x - lineStart.x;
      const dy = lineEnd.y - lineStart.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 10) {
        setPixelLength(length);
        setStep(3);
      }
    }
  }, [isDrawing, step, lineStart, lineEnd]);

  // Add event listeners when in drawing mode
  useEffect(() => {
    if (step === 2) {
      window.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);

      return () => {
        window.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [step, handlePointerDown, handlePointerMove, handlePointerUp]);

  // Calculate and apply scale
  const handleApplyScale = useCallback(() => {
    const totalInches = (feet * 12) + inches;
    if (totalInches <= 0 || pixelLength <= 0) return;

    // pixels per inch = pixel length / real world inches
    const pixelsPerInch = pixelLength / totalInches;

    onCalibrate(pixelsPerInch);
    onClose();
  }, [feet, inches, pixelLength, onCalibrate, onClose]);

  // Apply a preset scale
  const handlePresetScale = useCallback((ratio) => {
    // The ratio is how many real inches = 1 drawing inch
    // E.g., 1/4" = 1'-0" means 0.25 drawing inches = 12 real inches
    // So 1 drawing inch = 48 real inches
    // If we know the PDF's DPI (typically 72 or 96), we can calculate pixels per inch
    // For now, assume the PDF is at 72 DPI as a baseline
    const assumedPdfDpi = 72;
    const pixelsPerInch = assumedPdfDpi / ratio;

    onCalibrate(pixelsPerInch);
    onClose();
  }, [onCalibrate, onClose]);

  const handleStartDrawing = () => {
    setStep(2);
    setLineStart(null);
    setLineEnd(null);
  };

  const handleReset = () => {
    setStep(1);
    setLineStart(null);
    setLineEnd(null);
    setPixelLength(0);
    setFeet(0);
    setInches(0);
  };

  return (
    <>
      {/* Calibration line overlay when drawing */}
      {step === 2 && lineStart && lineEnd && (
        <svg
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          <line
            x1={lineStart.x * viewScale + offset.x}
            y1={lineStart.y * viewScale + offset.y}
            x2={lineEnd.x * viewScale + offset.x}
            y2={lineEnd.y * viewScale + offset.y}
            stroke="#ff00ff"
            strokeWidth="3"
            strokeDasharray="8,4"
          />
          {/* Start point */}
          <circle
            cx={lineStart.x * viewScale + offset.x}
            cy={lineStart.y * viewScale + offset.y}
            r="6"
            fill="#ff00ff"
          />
          {/* End point */}
          <circle
            cx={lineEnd.x * viewScale + offset.x}
            cy={lineEnd.y * viewScale + offset.y}
            r="6"
            fill="#ff00ff"
          />
        </svg>
      )}

      <FloatingPanel
        title="Calibrate Scale"
        onClose={onClose}
        x={isMobile ? 10 : 150}
        y={isMobile ? 60 : 150}
        width={isMobile ? 280 : 320}
        maxHeight={isMobile ? 400 : 500}
        isMobile={isMobile}
      >
        <div style={{ padding: '16px' }}>
          {step === 1 && (
            <>
              <PanelSection title="Method 1: Draw a known dimension">
                <p style={{
                  color: '#a0b0c0',
                  fontSize: '11px',
                  marginBottom: '12px',
                  lineHeight: 1.5,
                }}>
                  Draw a line along a dimension line in the PDF that you know
                  the measurement of (e.g., a wall labeled "10'-0"").
                </p>
                <Button
                  variant="primary"
                  onClick={handleStartDrawing}
                  style={{ width: '100%' }}
                >
                  Start Calibration
                </Button>
              </PanelSection>

              <PanelSection title="Method 2: Use a standard scale">
                <p style={{
                  color: '#a0b0c0',
                  fontSize: '11px',
                  marginBottom: '12px',
                  lineHeight: 1.5,
                }}>
                  If you know the drawing scale, select it below:
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                }}>
                  {SCALE_PRESETS.map((preset) => (
                    <button
                      key={preset.ratio}
                      onClick={() => handlePresetScale(preset.ratio)}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '4px',
                        padding: '8px 4px',
                        color: '#a0b0c0',
                        fontSize: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = 'rgba(0,200,255,0.2)';
                        e.target.style.borderColor = '#00c8ff';
                        e.target.style.color = '#00c8ff';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.08)';
                        e.target.style.borderColor = 'rgba(255,255,255,0.15)';
                        e.target.style.color = '#a0b0c0';
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </PanelSection>
            </>
          )}

          {step === 2 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: 'rgba(255,0,255,0.1)',
                border: '2px dashed #ff00ff',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '16px',
              }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>
                  ✏️
                </span>
                <p style={{
                  color: '#ff00ff',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                }}>
                  Draw a line on the PDF
                </p>
                <p style={{
                  color: '#a0b0c0',
                  fontSize: '11px',
                }}>
                  Click and drag along a dimension
                  line that you know the measurement of
                </p>
              </div>
              <Button
                variant="default"
                onClick={handleReset}
              >
                Cancel
              </Button>
            </div>
          )}

          {step === 3 && (
            <>
              <div style={{
                background: 'rgba(0,255,170,0.1)',
                border: '1px solid rgba(0,255,170,0.3)',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '16px',
                textAlign: 'center',
              }}>
                <span style={{
                  color: '#00ffaa',
                  fontSize: '12px',
                  display: 'block',
                }}>
                  Line length: {Math.round(pixelLength)} pixels
                </span>
              </div>

              <PanelSection title="Enter the real measurement">
                <p style={{
                  color: '#a0b0c0',
                  fontSize: '11px',
                  marginBottom: '12px',
                }}>
                  What is the actual dimension of the line you drew?
                </p>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '16px',
                }}>
                  <NumberInput
                    label="Feet"
                    value={feet}
                    onChange={setFeet}
                    min={0}
                    max={500}
                    step={1}
                  />
                  <NumberInput
                    label="Inches"
                    value={inches}
                    onChange={setInches}
                    min={0}
                    max={11}
                    step={1}
                  />
                </div>

                {(feet > 0 || inches > 0) && pixelLength > 0 && (
                  <div style={{
                    background: 'rgba(0,200,255,0.1)',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '12px',
                    textAlign: 'center',
                  }}>
                    <span style={{ color: '#00c8ff', fontSize: '11px' }}>
                      Scale: {(pixelLength / ((feet * 12) + inches)).toFixed(2)} pixels/inch
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="default"
                    onClick={handleReset}
                    style={{ flex: 1 }}
                  >
                    Start Over
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleApplyScale}
                    disabled={feet <= 0 && inches <= 0}
                    style={{ flex: 1 }}
                  >
                    Apply Scale
                  </Button>
                </div>
              </PanelSection>
            </>
          )}
        </div>
      </FloatingPanel>
    </>
  );
};

export default ScaleCalibration;
