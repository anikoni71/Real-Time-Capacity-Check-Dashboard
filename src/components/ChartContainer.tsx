import React, { useRef, useState, useEffect } from 'react';
import { Maximize2, Printer, Minimize2, Download, FileImage, FileSpreadsheet, FileText } from 'lucide-react';
import { toJpeg } from 'html-to-image';
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

  const handlePrint = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    try {
      const actionsEl = containerRef.current.querySelector('.action-buttons') as HTMLElement;
      if (actionsEl) actionsEl.style.visibility = 'hidden';

      const chartImageDataUrl = await toJpeg(containerRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        fontEmbedCSS: ''
      });

      if (actionsEl) actionsEl.style.visibility = 'visible';

      const printWindow = window.open('', '_blank');

      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print System - ${title}</title>
              <style>
                @page { size: A4 landscape; margin: 0; }
                body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #fff; }
                img { width: 100%; height: auto; max-height: 100vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${chartImageDataUrl}" onload="window.print(); window.close();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (err) {
      console.error('Print layout window generation failed:', err);
    }
  };

  const downloadPDF = async () => {
    if (!containerRef.current || isDownloading) return;
    setIsDownloading(true);

    try {
      const actionsEl = containerRef.current.querySelector('.action-buttons') as HTMLElement;
      if (actionsEl) actionsEl.style.visibility = 'hidden';

      const imgData = await toJpeg(containerRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        fontEmbedCSS: ''
      });

      if (actionsEl) actionsEl.style.visibility = 'visible';

      const pdf = new jsPDF('l', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
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
    try {
      const buttons = containerRef.current.querySelectorAll('.action-buttons');
      buttons.forEach(btn => (btn as HTMLElement).style.display = 'none');
      
      const scrollInner = containerRef.current.querySelector('.scrollable-chart-inner') as HTMLElement;
      let originalWidth = '';
      if (scrollInner) {
        originalWidth = scrollInner.style.width;
        scrollInner.style.width = '100%';
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      const imgData = await toJpeg(containerRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        fontEmbedCSS: ''
      });
      
      buttons.forEach(btn => (btn as HTMLElement).style.display = '');
      if (scrollInner) {
        scrollInner.style.width = originalWidth;
      }
      
      const a = document.createElement('a');
      a.href = imgData;
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
