import React, { useState, useCallback } from 'react';
import { FloatingPanel, PanelSection } from '../ui/Panel';
import { Button } from '../ui/Button';
import { TextInput, Select, Checkbox } from '../ui/Input';

// Paper size options
const PAPER_SIZES = [
  { value: 'letter', label: 'Letter (8.5" x 11")' },
  { value: 'legal', label: 'Legal (8.5" x 14")' },
  { value: 'tabloid', label: 'Tabloid (11" x 17")' },
  { value: 'a4', label: 'A4 (210 x 297 mm)' },
  { value: 'a3', label: 'A3 (297 x 420 mm)' },
];

// Orientation options
const ORIENTATIONS = [
  { value: 'landscape', label: 'Landscape' },
  { value: 'portrait', label: 'Portrait' },
];

// Scale options
const SCALES = [
  { value: 'fit', label: 'Fit to Page' },
  { value: '1/8', label: '1/8" = 1\'-0"' },
  { value: '1/4', label: '1/4" = 1\'-0"' },
  { value: '3/8', label: '3/8" = 1\'-0"' },
  { value: '1/2', label: '1/2" = 1\'-0"' },
  { value: '3/4', label: '3/4" = 1\'-0"' },
  { value: '1', label: '1" = 1\'-0"' },
];

// Export format options
const FORMATS = [
  { value: 'pdf', label: 'PDF Document' },
  { value: 'png', label: 'PNG Image' },
  { value: 'jpeg', label: 'JPEG Image' },
];

/**
 * ExportModal - Modal for configuring and executing exports
 */
export const ExportModal = ({
  onExport,
  onClose,
  isMobile = false,
  projectName = '',
  companyName = '',
}) => {
  const [format, setFormat] = useState('pdf');
  const [exporting, setExporting] = useState(false);

  // PDF options
  const [paperSize, setPaperSize] = useState('letter');
  const [orientation, setOrientation] = useState('landscape');
  const [scale, setScale] = useState('fit');

  // Content options
  const [includeFloorPlan, setIncludeFloorPlan] = useState(true);
  const [includePdfBackground, setIncludePdfBackground] = useState(true);
  const [includeAnnotations, setIncludeAnnotations] = useState(true);
  const [includeDimensions, setIncludeDimensions] = useState(true);
  const [includeRoomLabels, setIncludeRoomLabels] = useState(true);

  // Header/Footer options
  const [showHeader, setShowHeader] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [customProjectName, setCustomProjectName] = useState(projectName || 'Floor Plan');
  const [customCompanyName, setCustomCompanyName] = useState(companyName || '');
  const [showDate, setShowDate] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);

  // Image export options
  const [imageScale, setImageScale] = useState('1');
  const [jpegQuality, setJpegQuality] = useState('high');

  const handleExport = useCallback(async () => {
    setExporting(true);

    try {
      const options = {
        format,
        // PDF options
        paperSize,
        orientation,
        scale,
        // Content
        includeFloorPlan,
        includePdfBackground,
        includeAnnotations,
        includeDimensions,
        includeRoomLabels,
        // Header/Footer
        showHeader,
        showFooter,
        projectName: customProjectName,
        companyName: customCompanyName,
        showDate,
        showPageNumbers,
        // Image options
        imageScale: parseFloat(imageScale),
        jpegQuality: jpegQuality === 'high' ? 0.92 : jpegQuality === 'medium' ? 0.8 : 0.6,
      };

      await onExport(options);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [
    format, paperSize, orientation, scale,
    includeFloorPlan, includePdfBackground, includeAnnotations, includeDimensions, includeRoomLabels,
    showHeader, showFooter, customProjectName, customCompanyName, showDate, showPageNumbers,
    imageScale, jpegQuality, onExport, onClose
  ]);

  return (
    <FloatingPanel
      title="Export Floor Plan"
      onClose={onClose}
      x={isMobile ? 10 : window.innerWidth / 2 - 180}
      y={isMobile ? 60 : 80}
      width={isMobile ? 300 : 360}
      maxHeight={isMobile ? window.innerHeight - 120 : 600}
      isMobile={isMobile}
    >
      <div style={{ padding: '12px', overflowY: 'auto' }}>
        {/* Export Format */}
        <PanelSection title="Export Format">
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {FORMATS.map(f => (
              <button
                key={f.value}
                onClick={() => setFormat(f.value)}
                style={{
                  flex: 1,
                  minWidth: '80px',
                  padding: '10px 8px',
                  background: format === f.value ? 'rgba(0,200,255,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${format === f.value ? '#00c8ff' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '6px',
                  color: format === f.value ? '#00c8ff' : '#8899aa',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </PanelSection>

        {/* PDF-specific options */}
        {format === 'pdf' && (
          <>
            <PanelSection title="Page Setup">
              <Select
                label="Paper Size"
                value={paperSize}
                onChange={setPaperSize}
                options={PAPER_SIZES}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {ORIENTATIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setOrientation(o.value)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: orientation === o.value ? 'rgba(0,200,255,0.2)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${orientation === o.value ? '#00c8ff' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '6px',
                      color: orientation === o.value ? '#00c8ff' : '#8899aa',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <Select
                label="Scale"
                value={scale}
                onChange={setScale}
                options={SCALES}
                style={{ marginTop: '8px' }}
              />
            </PanelSection>

            <PanelSection title="Header & Footer">
              <TextInput
                label="Project Name"
                value={customProjectName}
                onChange={setCustomProjectName}
                placeholder="Floor Plan"
              />
              <TextInput
                label="Company Name"
                value={customCompanyName}
                onChange={setCustomCompanyName}
                placeholder="Optional"
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                <Checkbox
                  label="Show Header"
                  checked={showHeader}
                  onChange={setShowHeader}
                  style={{ flex: '1 0 45%', marginBottom: '4px' }}
                />
                <Checkbox
                  label="Show Footer"
                  checked={showFooter}
                  onChange={setShowFooter}
                  style={{ flex: '1 0 45%', marginBottom: '4px' }}
                />
                <Checkbox
                  label="Show Date"
                  checked={showDate}
                  onChange={setShowDate}
                  style={{ flex: '1 0 45%', marginBottom: '4px' }}
                />
                <Checkbox
                  label="Page Numbers"
                  checked={showPageNumbers}
                  onChange={setShowPageNumbers}
                  style={{ flex: '1 0 45%', marginBottom: '4px' }}
                />
              </div>
            </PanelSection>
          </>
        )}

        {/* Image-specific options */}
        {(format === 'png' || format === 'jpeg') && (
          <PanelSection title="Image Options">
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', color: '#6080a0', fontSize: '10px', marginBottom: '6px' }}>
                Resolution
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { value: '1', label: '1x (Standard)' },
                  { value: '2', label: '2x (High)' },
                  { value: '3', label: '3x (Print)' },
                ].map(s => (
                  <button
                    key={s.value}
                    onClick={() => setImageScale(s.value)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      background: imageScale === s.value ? 'rgba(0,200,255,0.2)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${imageScale === s.value ? '#00c8ff' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '6px',
                      color: imageScale === s.value ? '#00c8ff' : '#8899aa',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {format === 'jpeg' && (
              <div>
                <label style={{ display: 'block', color: '#6080a0', fontSize: '10px', marginBottom: '6px' }}>
                  Quality
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' },
                  ].map(q => (
                    <button
                      key={q.value}
                      onClick={() => setJpegQuality(q.value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: jpegQuality === q.value ? 'rgba(0,200,255,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${jpegQuality === q.value ? '#00c8ff' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '6px',
                        color: jpegQuality === q.value ? '#00c8ff' : '#8899aa',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <TextInput
              label="File Name"
              value={customProjectName}
              onChange={setCustomProjectName}
              placeholder="Floor Plan"
              style={{ marginTop: '10px' }}
            />
          </PanelSection>
        )}

        {/* What to Include */}
        <PanelSection title="Include in Export">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Checkbox
              label="Floor plan (walls, doors, windows)"
              checked={includeFloorPlan}
              onChange={setIncludeFloorPlan}
            />
            <Checkbox
              label="PDF background layer"
              checked={includePdfBackground}
              onChange={setIncludePdfBackground}
            />
            <Checkbox
              label="Annotations & markups"
              checked={includeAnnotations}
              onChange={setIncludeAnnotations}
            />
            <Checkbox
              label="Measurements & dimensions"
              checked={includeDimensions}
              onChange={setIncludeDimensions}
            />
            <Checkbox
              label="Room labels"
              checked={includeRoomLabels}
              onChange={setIncludeRoomLabels}
            />
          </div>
        </PanelSection>

        {/* Export Button */}
        <div style={{ marginTop: '16px' }}>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={exporting}
            style={{ width: '100%', padding: '12px' }}
          >
            {exporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
          </Button>
        </div>

        {/* Info text */}
        <p style={{
          color: '#6080a0',
          fontSize: '10px',
          textAlign: 'center',
          marginTop: '12px',
          lineHeight: 1.4,
        }}>
          {format === 'pdf'
            ? 'PDF export includes vector-quality output suitable for printing.'
            : format === 'png'
            ? 'PNG preserves transparency and is ideal for digital use.'
            : 'JPEG is best for sharing via email or web.'}
        </p>
      </div>
    </FloatingPanel>
  );
};

export default ExportModal;
