import React, { useRef, useState, useEffect } from 'react';
import { Maximize2, Printer, Minimize2, Download, FileImage, FileSpreadsheet } from 'lucide-react';
import { toJpeg } from 'html-to-image';

// Dynamically import jsPDF to ensure it doesn't break SSR or initial load
// and to avoid bundle size issues if possible. 
// But since we installed it, we can just import it.
import { jsPDF } from 'jspdf';

interface ChartContainerProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  data?: any[];
}

export default function ChartContainer({ title, icon, children, data }: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPrintingRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen && !isPrintingRef.current) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showDropdown) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  const toggleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
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
    const buttons = containerRef.current.querySelectorAll('.action-buttons');
    buttons.forEach(btn => (btn as HTMLElement).style.display = 'none');

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
      pixelRatio: 1.5,
      backgroundColor: '#ffffff',
      filter: (node) => !node.classList?.contains('action-buttons')
    });

    // Restore buttons
    buttons.forEach(btn => (btn as HTMLElement).style.display = '');

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
        quality: 0.95,
        pixelRatio: 1.5,
        backgroundColor: '#ffffff',
        filter: (node) => !node.classList?.contains('action-buttons')
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
      className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col h-full chart-wrapper relative transition-all ${isFullscreen ? 'fixed inset-4 z-50 overflow-auto' : ''}`}
    >
      {isFullscreen && <div className="fixed inset-0 bg-black/50 -z-10" onClick={(e) => toggleFullscreen(e)} />}
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
        <div className="flex items-center gap-2 action-buttons relative">
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors print:hidden"
              title="Download Data or Image"
              disabled={isDownloading}
            >
              <Download className={`h-5 w-5 ${isDownloading ? 'opacity-50 animate-pulse' : ''}`} />
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1" onClick={e => e.stopPropagation()}>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                  onClick={() => { setShowDropdown(false); downloadImage(); }}
                >
                  <FileImage className="h-4 w-4" /> Download as Image
                </button>
                {data && data.length > 0 && (
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                    onClick={() => { setShowDropdown(false); downloadCSV(); }}
                  >
                    <FileSpreadsheet className="h-4 w-4" /> Download Data (CSV)
                  </button>
                )}
              </div>
            )}
          </div>
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
        className="flex-1 w-full flex flex-col cursor-pointer" 
        onClick={toggleFullscreen}
        title="Click to toggle fullscreen"
      >
        {children}
      </div>
    </div>
  );
}
