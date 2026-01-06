import { jsPDF } from 'jspdf';

// Paper size dimensions in inches
const PAPER_SIZES = {
  letter: { width: 8.5, height: 11 },
  legal: { width: 8.5, height: 14 },
  tabloid: { width: 11, height: 17 },
  a4: { width: 8.27, height: 11.69 },
  a3: { width: 11.69, height: 16.54 },
};

// Common architectural scales
const SCALES = {
  fit: null, // Fit to page
  '1/8': 1/8,   // 1/8" = 1'
  '1/4': 1/4,   // 1/4" = 1'
  '3/8': 3/8,   // 3/8" = 1'
  '1/2': 1/2,   // 1/2" = 1'
  '3/4': 3/4,   // 3/4" = 1'
  '1': 1,       // 1" = 1'
  '1.5': 1.5,   // 1-1/2" = 1'
};

/**
 * Export the floor plan canvas to PDF
 */
export async function exportToPDF(canvas, options = {}) {
  const {
    paperSize = 'letter',
    orientation = 'landscape',
    scale = 'fit',
    margin = 0.5, // inches
    showHeader = true,
    showFooter = true,
    projectName = 'Floor Plan',
    companyName = '',
    showDate = true,
    showPageNumbers = true,
  } = options;

  // Get paper dimensions
  let paperDims = PAPER_SIZES[paperSize] || PAPER_SIZES.letter;

  // Swap dimensions for landscape
  if (orientation === 'landscape') {
    paperDims = { width: paperDims.height, height: paperDims.width };
  }

  // Create PDF document
  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'in',
    format: [paperDims.width, paperDims.height],
  });

  // Calculate printable area
  const printableWidth = paperDims.width - (margin * 2);
  const printableHeight = paperDims.height - (margin * 2);

  // Reserve space for header and footer
  const headerHeight = showHeader ? 0.5 : 0;
  const footerHeight = showFooter ? 0.4 : 0;
  const contentHeight = printableHeight - headerHeight - footerHeight;
  const contentY = margin + headerHeight;

  // Get canvas image data
  const imgData = canvas.toDataURL('image/png', 1.0);

  // Calculate image dimensions
  const canvasAspect = canvas.width / canvas.height;
  const contentAspect = printableWidth / contentHeight;

  let imgWidth, imgHeight;

  if (scale === 'fit' || !SCALES[scale]) {
    // Fit to page
    if (canvasAspect > contentAspect) {
      // Canvas is wider - fit to width
      imgWidth = printableWidth;
      imgHeight = printableWidth / canvasAspect;
    } else {
      // Canvas is taller - fit to height
      imgHeight = contentHeight;
      imgWidth = contentHeight * canvasAspect;
    }
  } else {
    // Use specific scale (inches per foot on paper)
    // This requires knowing the actual floor plan dimensions
    // For now, we'll use a proportion of the canvas
    const scaleValue = SCALES[scale];
    imgWidth = printableWidth * Math.min(1, scaleValue);
    imgHeight = imgWidth / canvasAspect;

    // If it exceeds content area, scale down
    if (imgHeight > contentHeight) {
      imgHeight = contentHeight;
      imgWidth = contentHeight * canvasAspect;
    }
  }

  // Center the image
  const imgX = margin + (printableWidth - imgWidth) / 2;
  const imgY = contentY + (contentHeight - imgHeight) / 2;

  // Add header
  if (showHeader) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(projectName, margin, margin + 0.25);

    if (companyName) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(companyName, margin, margin + 0.4);
    }

    // Draw header line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.01);
    pdf.line(margin, margin + headerHeight - 0.05, paperDims.width - margin, margin + headerHeight - 0.05);
  }

  // Add the floor plan image
  pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight);

  // Add footer
  if (showFooter) {
    const footerY = paperDims.height - margin;

    // Draw footer line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.01);
    pdf.line(margin, footerY - footerHeight + 0.05, paperDims.width - margin, footerY - footerHeight + 0.05);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);

    // Date on left
    if (showDate) {
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      pdf.text(dateStr, margin, footerY - 0.1);
    }

    // Page number on right
    if (showPageNumbers) {
      const pageText = `Page 1 of 1`;
      const textWidth = pdf.getTextWidth(pageText);
      pdf.text(pageText, paperDims.width - margin - textWidth, footerY - 0.1);
    }

    // "Created with FloorPlan Pro" in center
    const creditText = 'Created with FloorPlan Pro';
    const creditWidth = pdf.getTextWidth(creditText);
    pdf.text(creditText, (paperDims.width - creditWidth) / 2, footerY - 0.1);
  }

  // Generate filename
  const filename = `${projectName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

  // Save the PDF
  pdf.save(filename);

  return filename;
}

/**
 * Export the floor plan canvas to PNG image
 */
export function exportToPNG(canvas, options = {}) {
  const {
    projectName = 'Floor Plan',
    scale = 1, // 1 = original, 2 = 2x, etc.
  } = options;

  // Create a scaled canvas if needed
  let exportCanvas = canvas;

  if (scale !== 1) {
    exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width * scale;
    exportCanvas.height = canvas.height * scale;
    const ctx = exportCanvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.drawImage(canvas, 0, 0);
  }

  // Get image data
  const imgData = exportCanvas.toDataURL('image/png', 1.0);

  // Create download link
  const link = document.createElement('a');
  link.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
  link.href = imgData;
  link.click();

  return link.download;
}

/**
 * Export the floor plan canvas to JPEG image
 */
export function exportToJPEG(canvas, options = {}) {
  const {
    projectName = 'Floor Plan',
    quality = 0.92,
    backgroundColor = '#ffffff',
  } = options;

  // Create a new canvas with white background
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const ctx = exportCanvas.getContext('2d');

  // Fill with background color
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  // Draw the original canvas
  ctx.drawImage(canvas, 0, 0);

  // Get image data
  const imgData = exportCanvas.toDataURL('image/jpeg', quality);

  // Create download link
  const link = document.createElement('a');
  link.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.jpg`;
  link.href = imgData;
  link.click();

  return link.download;
}

export default { exportToPDF, exportToPNG, exportToJPEG };
