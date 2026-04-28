import React, { useRef, useState, useEffect } from 'react';
import { Maximize2, Printer, Minimize2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ChartContainerProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export default function ChartContainer({ title, icon, children }: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err: any) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    document.body.classList.add('print-single-chart');
    if (containerRef.current) {
      containerRef.current.classList.add('this-is-printing');
    }
    
    // We delay slightly to allow CSS to adjust layout before calling window.print()
    setTimeout(() => {
      window.print();
      document.body.classList.remove('print-single-chart');
      if (containerRef.current) {
        containerRef.current.classList.remove('this-is-printing');
      }
    }, 100);
  };

  const handleDownloadPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(containerRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        onclone: (doc, clonedElement) => {
          // Remove the utility buttons from the cloned canvas
          const buttons = clonedElement.querySelectorAll('button');
          buttons.forEach(btn => btn.style.display = 'none');
          
          const scrollableArea = clonedElement.querySelector('.scrollable-chart-area') as HTMLElement;
          const innerChart = clonedElement.querySelector('.scrollable-chart-inner') as HTMLElement;
          
          if (scrollableArea && innerChart) {
             scrollableArea.style.overflow = 'hidden';
             
             // Expand the cloned element to show the entire chart
             // Use the inner width if it's wider than the container
             const innerWidth = parseInt(innerChart.style.width || '0', 10) || innerChart.scrollWidth;
             if (innerWidth > scrollableArea.clientWidth) {
               clonedElement.style.width = `${innerWidth + 48}px`; // 48px to account for container padding
               scrollableArea.style.width = '100%';
             }
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 10;
      const availableWidth = pdfWidth - margin * 2;
      const availableHeight = pdfHeight - margin * 2;
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgRatio = imgProps.width / imgProps.height;
      const pageRatio = availableWidth / availableHeight;
      
      let finalWidth = availableWidth;
      let finalHeight = availableWidth / imgRatio;
      
      if (imgRatio < pageRatio) {
         finalHeight = availableHeight;
         finalWidth = availableHeight * imgRatio;
      }
      
      const x = margin + (availableWidth - finalWidth) / 2;
      const y = margin + (availableHeight - finalHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
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
      className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col h-full chart-wrapper relative transition-all"
    >
      <div className="flex items-center justify-between mb-4">
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
