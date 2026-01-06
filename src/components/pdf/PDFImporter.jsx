import React, { useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { FloatingPanel, PanelSection } from '../ui/Panel';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Input';

// Set up the worker for pdf.js
// Using unpkg CDN which has version 5.x available (cdnjs only has up to 4.x)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * PDFImporter - Component for importing and managing PDF background layers
 */
export const PDFImporter = ({
  onImport,
  onClose,
  isMobile = false,
}) => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageThumbnails, setPageThumbnails] = useState([]);
  const [selectedPage, setSelectedPage] = useState(1);
  const [fileName, setFileName] = useState('');
  const [loadingPage, setLoadingPage] = useState(false);

  // Load PDF and generate thumbnails
  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(10);
    setFileName(file.name);

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      setProgress(30);

      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);
      setProgress(50);

      // Generate thumbnails for all pages
      const thumbnails = [];
      const thumbScale = 0.3; // Small scale for thumbnails

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: thumbScale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        thumbnails.push({
          pageNum: i,
          dataUrl: canvas.toDataURL('image/jpeg', 0.7),
          width: viewport.width,
          height: viewport.height,
        });

        setProgress(50 + Math.floor((i / pdf.numPages) * 40));
      }

      setPageThumbnails(thumbnails);
      setSelectedPage(1);
      setProgress(100);

    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF. Please try another file.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Import the selected page at full resolution
  const handleImportPage = useCallback(async () => {
    if (!pdfDoc) return;

    setLoadingPage(true);
    setError(null);

    try {
      const page = await pdfDoc.getPage(selectedPage);

      // Use a higher scale for better quality
      const scale = 2; // 2x resolution for crisp display
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png');

      // Get original dimensions (at scale 1)
      const originalViewport = page.getViewport({ scale: 1 });

      // Pass the imported PDF data to parent
      onImport({
        dataUrl,
        width: originalViewport.width,
        height: originalViewport.height,
        renderScale: scale,
        fileName: fileName,
        pageCount: pdfDoc.numPages,
        pageNumber: selectedPage,
      });

    } catch (err) {
      console.error('Error importing page:', err);
      setError('Failed to import page. Please try again.');
    } finally {
      setLoadingPage(false);
    }
  }, [pdfDoc, selectedPage, fileName, onImport]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Reset to select a different file
  const handleSelectDifferentFile = useCallback(() => {
    setPdfDoc(null);
    setPageThumbnails([]);
    setSelectedPage(1);
    setFileName('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <FloatingPanel
      title="Import PDF"
      onClose={onClose}
      x={isMobile ? 10 : 100}
      y={isMobile ? 60 : 100}
      width={isMobile ? 300 : 400}
      isMobile={isMobile}
    >
      <div style={{ padding: '16px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {error && (
          <div style={{
            background: 'rgba(255,80,80,0.2)',
            border: '1px solid rgba(255,80,80,0.5)',
            borderRadius: '6px',
            padding: '10px',
            marginBottom: '16px',
            color: '#ff6666',
            fontSize: '12px',
          }}>
            {error}
          </div>
        )}

        {/* Initial state - no PDF loaded */}
        {!pdfDoc && !loading && (
          <>
            <p style={{
              color: '#a0b0c0',
              fontSize: '12px',
              marginBottom: '16px',
              lineHeight: 1.5,
            }}>
              Import a PDF floor plan as a background layer.
              After importing, you'll be able to calibrate the scale
              by measuring a known dimension.
            </p>

            <Button
              variant="primary"
              onClick={handleButtonClick}
              style={{ width: '100%' }}
            >
              Select PDF File
            </Button>

            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: 'rgba(0,200,255,0.1)',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#6080a0',
            }}>
              <strong style={{ color: '#00c8ff' }}>Tip:</strong> For best results,
              use a PDF with clear dimension lines. Multi-page PDFs are supported.
            </div>
          </>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '12px',
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #00c8ff, #00ffaa)',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{ color: '#6080a0', fontSize: '12px' }}>
              Loading PDF... {progress}%
            </span>
          </div>
        )}

        {/* Page selection state */}
        {pdfDoc && !loading && (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}>
              <span style={{ color: '#00c8ff', fontSize: '12px', fontWeight: '500' }}>
                {fileName} ({pdfDoc.numPages} page{pdfDoc.numPages > 1 ? 's' : ''})
              </span>
              <button
                onClick={handleSelectDifferentFile}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6080a0',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Change
              </button>
            </div>

            <p style={{
              color: '#a0b0c0',
              fontSize: '11px',
              marginBottom: '12px',
            }}>
              Select the page to import:
            </p>

            {/* Page thumbnails grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: '10px',
              maxHeight: '300px',
              overflowY: 'auto',
              padding: '4px',
              marginBottom: '16px',
            }}>
              {pageThumbnails.map((thumb) => (
                <div
                  key={thumb.pageNum}
                  onClick={() => setSelectedPage(thumb.pageNum)}
                  style={{
                    cursor: 'pointer',
                    border: selectedPage === thumb.pageNum
                      ? '3px solid #00c8ff'
                      : '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '4px',
                    background: selectedPage === thumb.pageNum
                      ? 'rgba(0,200,255,0.1)'
                      : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <img
                    src={thumb.dataUrl}
                    alt={`Page ${thumb.pageNum}`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      borderRadius: '3px',
                    }}
                  />
                  <div style={{
                    textAlign: 'center',
                    marginTop: '4px',
                    fontSize: '10px',
                    color: selectedPage === thumb.pageNum ? '#00c8ff' : '#6080a0',
                    fontWeight: selectedPage === thumb.pageNum ? '600' : '400',
                  }}>
                    Page {thumb.pageNum}
                  </div>
                </div>
              ))}
            </div>

            {/* Import button */}
            <Button
              variant="primary"
              onClick={handleImportPage}
              disabled={loadingPage}
              style={{ width: '100%' }}
            >
              {loadingPage ? 'Importing...' : `Import Page ${selectedPage}`}
            </Button>
          </>
        )}
      </div>
    </FloatingPanel>
  );
};

/**
 * PDFControls - Panel for controlling the PDF layer
 */
export const PDFControls = ({
  pdfLayer,
  onUpdate,
  onRemove,
  onRecalibrate,
  onClose,
  isMobile = false,
}) => {
  if (!pdfLayer) return null;

  const scaleDisplay = pdfLayer.scale
    ? `${(pdfLayer.scale).toFixed(2)} px/in`
    : 'Not calibrated';

  return (
    <FloatingPanel
      title="PDF Layer"
      onClose={onClose}
      x={isMobile ? 10 : 20}
      y={isMobile ? 60 : 400}
      width={isMobile ? 200 : 220}
      isMobile={isMobile}
    >
      <div style={{ padding: '12px' }}>
        <PanelSection title="Visibility">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px',
          }}>
            <button
              onClick={() => onUpdate({ visible: !pdfLayer.visible })}
              style={{
                background: pdfLayer.visible ? 'rgba(0,200,255,0.2)' : 'rgba(255,255,255,0.1)',
                border: '1px solid ' + (pdfLayer.visible ? '#00c8ff' : '#3a4a5a'),
                borderRadius: '4px',
                padding: '6px 12px',
                color: pdfLayer.visible ? '#00c8ff' : '#6080a0',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              {pdfLayer.visible ? 'Visible' : 'Hidden'}
            </button>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              color: '#6080a0',
              fontSize: '10px',
              marginBottom: '6px',
            }}>
              Opacity: {Math.round(pdfLayer.opacity * 100)}%
            </label>
            <Slider
              value={pdfLayer.opacity * 100}
              onChange={(val) => onUpdate({ opacity: val / 100 })}
              min={10}
              max={100}
              step={5}
            />
          </div>
        </PanelSection>

        <PanelSection title="Scale">
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '4px',
            padding: '8px',
            marginBottom: '10px',
          }}>
            <span style={{
              color: pdfLayer.scale ? '#00ffaa' : '#ffaa00',
              fontSize: '11px',
            }}>
              {scaleDisplay}
            </span>
          </div>
          <Button
            variant="default"
            onClick={onRecalibrate}
            style={{ width: '100%', fontSize: '11px' }}
          >
            {pdfLayer.scale ? 'Re-calibrate' : 'Calibrate Scale'}
          </Button>
        </PanelSection>

        <PanelSection title="Actions">
          <Button
            variant="danger"
            onClick={onRemove}
            style={{ width: '100%', fontSize: '11px' }}
          >
            Remove PDF
          </Button>
        </PanelSection>
      </div>
    </FloatingPanel>
  );
};

export default PDFImporter;
