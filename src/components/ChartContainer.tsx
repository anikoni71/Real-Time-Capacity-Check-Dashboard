import React, { useRef, useState, useEffect } from 'react';
import { Maximize2, Printer, Minimize2, Download, FileImage, FileSpreadsheet, FileText } from 'lucide-react';
import { toJpeg, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useFullscreen } from '../hooks/useFullscreen';

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

    // Find the horizontal scrolling data layer
    const scrollArea = containerRef.current.querySelector('.scrollable-chart-area') as HTMLElement;
    if (!scrollArea) return null;

    // Create an invisible high-res container in the DOM to draw the un-clamped canvas
    const printCanvas = document.createElement('div');
    printCanvas.style.position = 'absolute';
    printCanvas.style.top = '-9999px';
    printCanvas.style.left = '-9999px';
    // Match the full structural width of all data bars combined
    printCanvas.style.width = `${scrollArea.scrollWidth}px`; 
    printCanvas.style.height = `${scrollArea.clientHeight || 500}px`;
    printCanvas.style.backgroundColor = '#ffffff';
    printCanvas.className = 'print-capture-canvas';

    // Clone the chart content inside our off-screen container
    const clonedChart = scrollArea.cloneNode(true) as HTMLElement;
    clonedChart.style.width = '100%';
    clonedChart.style.minWidth = 'unset';
    clonedChart.style.overflow = 'visible';
    printCanvas.appendChild(clonedChart);
    document.body.appendChild(printCanvas);

    // Give charting engines a minor breath tick to evaluate structural paths
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(printCanvas, {
        scale: 2, // Retains premium crystal-clear resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: scrollArea.scrollWidth,
        windowWidth: scrollArea.scrollWidth
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
      document.body.removeChild(printCanvas); // Clean up the DOM node
      return dataUrl;
    } catch (err) {
      console.error('Canvas trace capture aborted:', err);
      if (document.body.contains(printCanvas)) document.body.removeChild(printCanvas);
      return null;
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
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Automatically stretches/shrinks the wide dataset snapshot to cleanly fit 1 A4 page
      pdf.addImage(chartImageDataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`);
    } catch (err) {
      console.error('PDF Download processing broke:', err);
    } finally {
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
        className="flex-1 scrollable-chart-area w-full flex flex-col cursor-pointer" 
        onClick={toggleFullscreen}
        title="Click to toggle fullscreen"
      >
        {children}
      </div>
    </div>
  );
}
