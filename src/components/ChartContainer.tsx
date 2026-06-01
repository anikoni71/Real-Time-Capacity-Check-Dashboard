import React, { useRef, useState, useEffect } from 'react';
import { Maximize2, Printer, Minimize2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

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

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Create a temporary stylesheet for printing
    const styleId = 'print-single-chart-style';
    let style = document.getElementById(styleId);
    if (!style) {
       style = document.createElement('style');
       style.id = styleId;
       style.innerHTML = `
        @media print {
            body * {
                visibility: hidden;
            }
            .printing-active, .printing-active * {
                visibility: visible;
            }
            .printing-active {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100vw !important;
                height: auto !important;
                margin: 0 !important;
                padding: 20px !important;
                box-sizing: border-box !important;
            }
        }
       `;
       document.head.appendChild(style);
    }
    
    if (containerRef.current) {
      containerRef.current.classList.add('printing-active');
      window.dispatchEvent(new Event('resize'));
    }
    
    isPrintingRef.current = true;
    setTimeout(() => {
      window.print();
      
      if (containerRef.current) {
        containerRef.current.classList.remove('printing-active');
      }
      window.dispatchEvent(new Event('resize'));
      
      setTimeout(() => {
        isPrintingRef.current = false;
      }, 100);
    }, 800);
  };

  const handleDownloadPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current || isDownloading) return;
    
    setIsDownloading(true);
    try {
      // Small delay to ensure any hovering or interactions are cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const scrollInner = containerRef.current.querySelector('.scrollable-chart-inner') as HTMLElement;
      let targetWidth = containerRef.current.offsetWidth;
      let targetHeight = containerRef.current.offsetHeight;
      
      // If the chart internally scrolls, capture its full canvas width
      if (scrollInner) {
         const innerW = parseInt(scrollInner.style.width || '0', 10) || scrollInner.scrollWidth;
         targetWidth = Math.max(targetWidth, innerW + 48); // 48px to account for padding
      }
      
      const canvas = await html2canvas(containerRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        width: targetWidth,
        height: targetHeight,
        windowWidth: targetWidth,
        logging: false,
        onclone: (doc, clonedElement) => {
          // Remove the utility buttons from the cloned canvas
          const buttons = clonedElement.querySelectorAll('button');
          buttons.forEach(btn => btn.style.display = 'none');
          
          // Show the report header in the PDF
          const header = clonedElement.querySelector('.print-header') as HTMLElement;
          if (header) {
            header.style.display = 'block';
            header.classList.remove('hidden');
          }
          
          const scrollableArea = clonedElement.querySelector('.scrollable-chart-area') as HTMLElement;
          const innerChart = clonedElement.querySelector('.scrollable-chart-inner') as HTMLElement;
          
          if (scrollableArea && innerChart) {
             scrollableArea.style.overflow = 'visible';
             clonedElement.style.width = `${targetWidth}px`;
             scrollableArea.style.width = `${targetWidth}px`;
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 10;
      const availableWidth = pdfWidth - margin * 2;
      const availableHeight = pdfHeight - margin * 2;
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgRatio = imgProps.width / imgProps.height;
      
      let finalHeight = availableHeight;
      let finalWidth = finalHeight * imgRatio;
      
      // If the width happens to be smaller than the page width, we just center it
      if (finalWidth <= availableWidth) {
         const x = margin + (availableWidth - finalWidth) / 2;
         const y = margin + (availableHeight - finalHeight) / 2;
         pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      } else {
         // Auto-scale to fit width instead of multiple pages to make a coherent PDF
         finalWidth = availableWidth;
         finalHeight = finalWidth / imgRatio;
         
         const x = margin;
         const y = margin + (availableHeight - finalHeight) / 2;
         pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
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
