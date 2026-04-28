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
    
    const existingClone = document.getElementById('print-scoreboard-clone');
    if (existingClone) {
        existingClone.remove();
    }
    
    const scoreboardEl = document.querySelector('.scoreboard-container');
    if (scoreboardEl && containerRef.current) {
        const headerPlaceholder = containerRef.current.querySelector('#print-scoreboard-placeholder');
        if (headerPlaceholder) {
            const clone = scoreboardEl.cloneNode(true) as HTMLElement;
            clone.id = 'print-scoreboard-clone';
            // Use zoom instead of scale so it actually reduces the layout height and prevents spilling onto page 2
            (clone.style as any).zoom = '0.65';
            
            // Allow wrapping if necessary or let it be responsive
            const tableContainer = clone.querySelector('.overflow-x-auto') as HTMLElement;
            if (tableContainer) {
              tableContainer.style.overflow = 'visible';
            }
            headerPlaceholder.appendChild(clone);
        }
    }
    
    document.body.classList.add('print-single-chart');
    if (containerRef.current) {
      containerRef.current.classList.add('printable-area');
      // Dispatch a resize event to trigger ResponsiveContainer immediately
      window.dispatchEvent(new Event('resize'));
    }
    
    // We delay slightly to allow CSS to adjust layout and ResponsiveContainer to rerender before calling window.print()
    isPrintingRef.current = true;
    setTimeout(() => {
      window.print();
      document.body.classList.remove('print-single-chart');
      if (containerRef.current) {
        containerRef.current.classList.remove('printable-area');
        window.dispatchEvent(new Event('resize'));
      }
      
      // Delay resetting the printing ref to avoid race conditions with keyup/keydown
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
      const scrollInner = containerRef.current.querySelector('.scrollable-chart-inner') as HTMLElement;
      let targetWidth = containerRef.current.offsetWidth;
      if (scrollInner) {
         const innerW = parseInt(scrollInner.style.width || '0', 10) || scrollInner.scrollWidth;
         targetWidth = Math.max(targetWidth, innerW + 48); // 48px to account for padding
      }
      
      const canvas = await html2canvas(containerRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        width: targetWidth,
        windowWidth: targetWidth,
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
          
          const scoreboardEl = doc.querySelector('.scoreboard-container');
          if (scoreboardEl) {
              const headerPlaceholder = clonedElement.querySelector('#print-scoreboard-placeholder');
              if (headerPlaceholder) {
                  const clone = scoreboardEl.cloneNode(true) as HTMLElement;
                  (clone.style as any).zoom = '0.65';
                  headerPlaceholder.appendChild(clone);
              }
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
      
      // We want to fit the height of the chart to the page height to make it clear,
      // and if the width exceeds one page, we split it naturally across multiple pages!
      const finalHeight = availableHeight;
      const finalWidth = finalHeight * imgRatio;
      
      if (finalWidth <= availableWidth) {
         // Fits on one page
         const x = margin + (availableWidth - finalWidth) / 2;
         const y = margin + (availableHeight - finalHeight) / 2;
         pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      } else {
         // Chart is very wide. Print across multiple pages.
         let remainingWidth = finalWidth;
         let currentXOffset = 0;
         
         while (remainingWidth > 0) {
            pdf.addImage(imgData, 'PNG', margin - currentXOffset, margin, finalWidth, finalHeight);
            remainingWidth -= availableWidth;
            currentXOffset += availableWidth;
            
            if (remainingWidth > 0) {
               pdf.addPage();
            }
         }
      }
      
      const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`${safeTitle}_Report.pdf`);
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
