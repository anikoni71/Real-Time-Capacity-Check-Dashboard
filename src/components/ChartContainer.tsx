import React, { useRef, useState, useEffect } from 'react';
import { Maximize2, Printer, Minimize2, Download, FileImage, FileSpreadsheet, FileText } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useFullscreen } from '../hooks/useFullscreen';
import { FullscreenContext } from '../contexts/FullscreenContext';

interface ChartContainerProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  data?: any[];
}

export default function ChartContainer({ title, icon, children, data }: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPrintingRef = useRef(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showDropdown) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  // Helper function to capture the absolute full dataset image cleanly
  const captureFullChartImage = async (): Promise<string | null> => {
    if (!containerRef.current) return null;

    const targetElement = (containerRef.current.querySelector('.scrollable-chart-inner') || 
                           containerRef.current.querySelector('.scrollable-chart-area') || 
                           containerRef.current) as HTMLElement;
    
    // Save original styles
    const originalWidth = targetElement.style.width;
    const originalMaxWidth = targetElement.style.maxWidth;
    const originalPosition = targetElement.style.position;
    const originalZIndex = targetElement.style.zIndex;
    const originalBackgroundColor = targetElement.style.backgroundColor;
    const originalOverflow = targetElement.style.overflow;

    // Physical DOM Expansion
    targetElement.style.width = targetElement.scrollWidth + 'px';
    targetElement.style.maxWidth = 'none';
    targetElement.style.position = 'absolute';
    targetElement.style.zIndex = '9999';
    targetElement.style.backgroundColor = '#ffffff';
    targetElement.style.overflow = 'visible';

    // Trigger Recharts Re-render (Crucial)
    window.dispatchEvent(new Event('resize'));

    // Wait for Paint
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // Capture with html-to-image
      const dataUrl = await toJpeg(targetElement, { 
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          padding: '20px',
          overflow: 'hidden'
        }
      });

      return dataUrl;
    } catch (err) {
      console.error('Canvas capture aborted:', err);
      return null;
    } finally {
      // Revert Styles immediately
      targetElement.style.width = originalWidth;
      targetElement.style.maxWidth = originalMaxWidth;
      targetElement.style.position = originalPosition;
      targetElement.style.zIndex = originalZIndex;
      targetElement.style.backgroundColor = originalBackgroundColor;
      targetElement.style.overflow = originalOverflow;
      
      // Trigger Recharts Re-render again to shrink back
      window.dispatchEvent(new Event('resize'));
    }
  };

  const handlePrint = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const chartImageDataUrl = await captureFullChartImage();
    if (!chartImageDataUrl) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print System - ${title}</title>
            <style>
              @page { 
                size: A4 landscape; 
                margin: 5mm; 
              }
              body { 
                margin: 0; 
                padding: 0; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
                background: #fff; 
                overflow: hidden; 
              }
              /* Clamps the entire horizontal graph into exactly one viewport boundary box */
              img { 
                width: 100vw !important; 
                height: 100vh !important; 
                max-width: 100% !important; 
                max-height: 100% !important; 
                object-fit: contain !important; 
                page-break-inside: avoid !important;
              }
            </style>
          </head>
          <body>
            <img src="${chartImageDataUrl}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const downloadPDF = async () => {
    if (!containerRef.current || isDownloading) return;
    setIsDownloading(true);

    const chartImageDataUrl = await captureFullChartImage();
    if (!chartImageDataUrl) {
      setIsDownloading(false);
      return;
    }

    try {
      const img = new Image();
      img.onload = () => {
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeightObj = pdf.internal.pageSize.getHeight();
        
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pdfWidth, pdfHeightObj, 'F');
        
        // Render Main Centered Title
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(18);
        pdf.setTextColor(33, 37, 41);
        pdf.text("Real Time Capacity Check", pdfWidth / 2, 15, { align: 'center' });

        // Render Right-Aligned Attribution
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text("App Develop By Anik_Oni", pdfWidth - 15, 15, { align: 'right' });

        // Render Native PDF Text for Header Title
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.setTextColor(33, 37, 41); // Dark charcoal text
        pdf.text(title, 15, 28); // Positioned slightly below the main header row
        
        // Automatically stretches/shrinks the wide dataset snapshot to cleanly fit 1 A4 page
        // Maintain aspect ratio
        const imgWidth = pdfWidth - 30; // Clean 15px side margins
        const imgHeight = (img.height * imgWidth) / img.width;
        
        pdf.addImage(chartImageDataUrl, 'JPEG', 15, 40, imgWidth, imgHeight);
        pdf.save(`${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`);
        setIsDownloading(false);
      };
      img.onerror = () => {
        console.error('Failed to load image for PDF generation');
        setIsDownloading(false);
      };
      img.src = chartImageDataUrl;
    } catch (err) {
      console.error('PDF Download processing broke:', err);
      setIsDownloading(false);
    }
  };

  const downloadImage = async () => {
    if (!containerRef.current || isDownloading) return;
    setIsDownloading(true);

    const chartImageDataUrl = await captureFullChartImage();
    if (!chartImageDataUrl) {
      setIsDownloading(false);
      return;
    }
    
    try {
      const a = document.createElement('a');
      a.href = chartImageDataUrl;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.jpeg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error generating image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadCSV = () => {
    if (!data || data.length === 0) return;
    const keys = Object.keys(data[0]);
    const csvContent = [
      keys.join(','),
      ...data.map(row => keys.map(k => {
        const val = row[k];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      ref={containerRef} 
      className={`chart-wrapper bg-white shadow-sm flex flex-col h-full relative transition-all ${
        isFullscreen ? 'is-fullscreen' : 'rounded-xl p-4 border border-gray-100'
      }`}
    >
      <div className="print-header hidden mb-6 text-center border-b pb-4 relative">
        <h1 className="text-2xl font-bold text-gray-900">Capacity Check Report - {title}</h1>
        <p className="text-gray-500 mb-4">Generated on {new Date().toLocaleDateString()}</p>
        <div id="print-scoreboard-placeholder" className="text-left flex justify-center w-full"></div>
        <div className="absolute top-0 right-0 text-xs text-gray-400 italic font-medium">
          App Developed by Anik_Oni
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 header-controls print:hidden chart-header">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <div className="flex items-center gap-2 action-buttons relative">
          <button 
            onClick={(e) => { e.stopPropagation(); downloadPDF(); }}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors print:hidden"
            title="Download as PDF"
            disabled={isDownloading}
          >
            <Download className={`h-5 w-5 ${isDownloading ? 'opacity-50 animate-pulse' : ''}`} />
          </button>
          <button 
            onClick={handlePrint}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors print:hidden"
            title="Print Chart"
          >
            <Printer className="h-5 w-5" />
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors print:hidden"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>
      </div>
      
      {/* Chart Content Area with Click-to-Fullscreen */}
      <div 
        className="flex-1 chart-content-wrapper w-full flex flex-col cursor-pointer" 
        onClick={toggleFullscreen}
        title="Click to toggle fullscreen"
        key={isFullscreen ? 'fullscreen' : 'normal'}
      >
        <FullscreenContext.Provider value={isFullscreen}>
          {children}
        </FullscreenContext.Provider>
      </div>
    </div>
  );
}
