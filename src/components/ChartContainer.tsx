import React, { useRef, useState, useEffect } from 'react';
import { Maximize2, Printer, Minimize2, Download } from 'lucide-react';
import { toJpeg } from 'html-to-image';

// Dynamically import jsPDF to ensure it doesn't break SSR or initial load
// and to avoid bundle size issues if possible. 
// But since we installed it, we can just import it.
import { jsPDF } from 'jspdf';

interface ChartContainerProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export default function ChartContainer({ title, icon, children }: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPrintingRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen && !isPrintingRef.current) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Dispatch resize event so chart resizes
    setTimeout(() => {
       window.dispatchEvent(new Event('resize'));
    }, 50);
  };

  const handlePrint = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    
    // Hide buttons temporarily
    const buttons = containerRef.current.querySelectorAll('button');
    buttons.forEach(btn => btn.style.display = 'none');

    const header = containerRef.current.querySelector('.print-header') as HTMLElement;
    if (header) {
      header.classList.remove('hidden');
      header.style.display = 'block';
    }

    const scrollInner = containerRef.current.querySelector('.scrollable-chart-inner') as HTMLElement;
    let originalWidth = '';
    if (scrollInner) {
      originalWidth = scrollInner.style.width;
      scrollInner.style.width = '100%';
    }

    await new Promise(resolve => setTimeout(resolve, 300)); // allow interactions and text rendering to subside

    const dataUrl = await toJpeg(containerRef.current, {
      quality: 0.95,
      backgroundColor: '#ffffff',
      pixelRatio: 1.5,
      style: { fontFamily: 'sans-serif' }
    });

    // Restore buttons
    buttons.forEach(btn => btn.style.display = '');

    if (scrollInner) {
      scrollInner.style.width = originalWidth;
    }
    
    if (header) {
      header.classList.add('hidden');
      header.style.display = '';
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print - ${title}</title>
          <style>
            @page { size: A4 landscape; margin: 0; }
            body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: white; }
            img { width: 100%; height: auto; max-height: 100%; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current || isDownloading) return;
    
    setIsDownloading(true);
    try {
      // Hide buttons temporarily
      const buttons = containerRef.current.querySelectorAll('button');
      buttons.forEach(btn => btn.style.display = 'none');
      
      const header = containerRef.current.querySelector('.print-header') as HTMLElement;
      if (header) {
        header.classList.remove('hidden');
        header.style.display = 'block';
      }

      const scrollInner = containerRef.current.querySelector('.scrollable-chart-inner') as HTMLElement;
      let originalWidth = '';
      if (scrollInner) {
        originalWidth = scrollInner.style.width;
        scrollInner.style.width = '100%';
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      const imgData = await toJpeg(containerRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 1.5,
        style: { fontFamily: 'sans-serif' }
      });
      
      // Restore buttons
      buttons.forEach(btn => btn.style.display = '');

      if (scrollInner) {
        scrollInner.style.width = originalWidth;
      }
      
      if (header) {
        header.classList.add('hidden');
        header.style.display = '';
      }
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 5;
      const availableWidth = pdfWidth - margin * 2;
      const availableHeight = pdfHeight - margin * 2;
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgRatio = imgProps.width / imgProps.height;
      
      let finalHeight = availableHeight;
      let finalWidth = finalHeight * imgRatio;
      
      if (finalWidth <= availableWidth) {
         const x = margin + (availableWidth - finalWidth) / 2;
         const y = margin + (availableHeight - finalHeight) / 2;
         pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
      } else {
         finalWidth = availableWidth;
         finalHeight = finalWidth / imgRatio;
         const x = margin;
         const y = margin + (availableHeight - finalHeight) / 2;
         pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
      }
      
      const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`${safeTitle}.pdf`);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col h-full chart-wrapper relative transition-all ${isFullscreen ? 'css-fullscreen' : ''}`}
    >
      <div className="print-header hidden mb-6 text-center border-b pb-4 relative">
        <h1 className="text-2xl font-bold text-gray-900">Capacity Check Report - {title}</h1>
        <p className="text-gray-500 mb-4">Generated on {new Date().toLocaleDateString()}</p>
        <div id="print-scoreboard-placeholder" className="text-left flex justify-center w-full"></div>
        <div className="absolute top-0 right-0 text-xs text-gray-400 italic font-medium">
          App Developed by Anik_Oni
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 header-controls print:hidden">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownloadPDF}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors print:hidden"
            title="Download as PDF"
            disabled={isDownloading}
          >
            <Download className={`h-5 w-5 ${isDownloading ? 'opacity-50 animate-pulse' : ''}`} />
          </button>
          <button 
            onClick={handlePrint}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors print:hidden"
            title="Print Graph to A4"
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
        className="flex-1 w-full flex flex-col cursor-pointer" 
        onClick={toggleFullscreen}
        title="Click to toggle fullscreen"
      >
        {children}
      </div>
    </div>
  );
}
