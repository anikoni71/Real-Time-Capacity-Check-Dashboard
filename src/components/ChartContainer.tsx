import React, { useRef, useState, useEffect } from "react";
import {
  Maximize2,
  Printer,
  Minimize2,
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { useFullscreen } from "../hooks/useFullscreen";
import { FullscreenContext } from "../contexts/FullscreenContext";

interface ChartContainerProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  data?: any[];
}

export default function ChartContainer({
  title,
  icon,
  children,
  data,
}: ChartContainerProps) {
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
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showDropdown]);

  const captureFullChartImage = async (): Promise<string | null> => {
    if (!containerRef.current) return null;

    const container = containerRef.current;

    // Find if there's a scrollable inner element that needs expansion
    const scrollableInner = container.querySelector(
      ".scrollable-chart-inner",
    ) as HTMLElement;

    // Evaluate required expanded width for container
    let requiredWidth: number | null = null;
    let originalInnerWidth = "";
    let originalInnerOverflow = "";

    if (
      scrollableInner &&
      scrollableInner.scrollWidth > scrollableInner.clientWidth + 10
    ) {
      requiredWidth = Math.max(
        container.offsetWidth,
        scrollableInner.scrollWidth + 40,
      );
      originalInnerWidth = scrollableInner.style.width;
      originalInnerOverflow = scrollableInner.style.overflow;
      scrollableInner.style.width = scrollableInner.scrollWidth + "px";
      scrollableInner.style.overflow = "visible";
    }

    // Save original styles of container
    const originalWidth = container.style.width;
    const originalMaxWidth = container.style.maxWidth;
    const originalPosition = container.style.position;
    const originalZIndex = container.style.zIndex;
    const originalBackgroundColor = container.style.backgroundColor;
    const originalOverflow = container.style.overflow;

    // Physical DOM Expansion (Width only) to fit contents if needed
    if (requiredWidth !== null) {
      container.style.width = requiredWidth + "px";
    }
    container.style.maxWidth = "none";
    container.style.position = "absolute";
    container.style.zIndex = "9999";
    container.style.backgroundColor = "#ffffff";
    container.style.overflow = "visible";

    // Add exporting-chart class to disable transforms during capture
    document.body.classList.add("exporting-chart");

    // Trigger Recharts Re-render
    window.dispatchEvent(new Event("resize"));

    // Wait for Paint
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      // Capture with html-to-image
      const dataUrl = await toJpeg(container, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        style: {
          overflow: "hidden",
        },
        filter: (node) => {
          if (node instanceof Element) {
            return !node.classList.contains("action-buttons");
          }
          return true;
        },
      });

      return dataUrl;
    } catch (err: any) {
      if (err instanceof ProgressEvent || (err && err.type === "error")) {
        console.error(
          "Canvas capture aborted: Network or CORS error (often due to fonts or external SVG fetching).",
        );
      } else {
        console.error("Canvas capture aborted:", err);
      }
      return null;
    } finally {
      document.body.classList.remove("exporting-chart");
      // Revert Styles immediately
      container.style.width = originalWidth;
      container.style.maxWidth = originalMaxWidth;
      container.style.position = originalPosition;
      container.style.zIndex = originalZIndex;
      container.style.backgroundColor = originalBackgroundColor;
      container.style.overflow = originalOverflow;

      if (scrollableInner && requiredWidth !== null) {
        scrollableInner.style.width = originalInnerWidth;
        scrollableInner.style.overflow = originalInnerOverflow;
      }

      // Trigger Recharts Re-render again to shrink back
      window.dispatchEvent(new Event("resize"));
    }
  };

  const handlePrint = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!containerRef.current) return;

    document.body.classList.add("print-single-chart");
    containerRef.current.classList.add("printable-area");

    window.dispatchEvent(new Event("resize"));

    setTimeout(() => {
      window.print();

      document.body.classList.remove("print-single-chart");
      if (containerRef.current) {
        containerRef.current.classList.remove("printable-area");
      }

      window.dispatchEvent(new Event("resize"));
    }, 500);
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
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
        });
        const a4Width = 297;
        const a4Height = 210;
        const margin = 15;
        const topMargin = 40; // Leave space for the professional headers

        // Define the maximum physical box the image is allowed to fill
        const maxImgWidth = a4Width - margin * 2;
        const maxImgHeight = a4Height - topMargin - margin;

        const imgProps = pdf.getImageProperties(img.src);
        const imgRatio = imgProps.width / imgProps.height;
        const pageBoxRatio = maxImgWidth / maxImgHeight;

        let finalWidth, finalHeight;

        // Determine whether the width or the height hits the page boundary first
        if (imgRatio > pageBoxRatio) {
          // Chart is naturally very wide: lock to max width, calculate proportional height
          finalWidth = maxImgWidth;
          finalHeight = maxImgWidth / imgRatio;
        } else {
          // Chart is naturally tall: lock to max height, calculate proportional width
          finalHeight = maxImgHeight;
          finalWidth = maxImgHeight * imgRatio;
        }

        // Center the chart perfectly within that available space
        const xOffset = margin + (maxImgWidth - finalWidth) / 2;
        const yOffset = topMargin + (maxImgHeight - finalHeight) / 2;

        // Flood white background, add professional headers, and stamp the perfectly scaled image
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, a4Width, a4Height, "F");

        // Render Main Centered Title
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(18);
        pdf.setTextColor(33, 37, 41);
        pdf.text("Real Time Capacity Check", a4Width / 2, 15, {
          align: "center",
        });

        // Render Right-Aligned Attribution
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text("App Develop By Anik_Oni", a4Width - 15, 15, {
          align: "right",
        });

        // Render Native PDF Text for Header Title (Removed native rendering to use captured image header instead)

        pdf.addImage(
          img.src,
          "JPEG",
          xOffset,
          yOffset,
          finalWidth,
          finalHeight,
        );
        pdf.save(`${title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.pdf`);
        setIsDownloading(false);
      };
      img.onerror = () => {
        console.error("Failed to load image for PDF generation");
        setIsDownloading(false);
      };
      img.src = chartImageDataUrl;
    } catch (err) {
      console.error("PDF Download processing broke:", err);
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
      const a = document.createElement("a");
      a.href = chartImageDataUrl;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.jpeg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error generating image:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadCSV = () => {
    if (!data || data.length === 0) return;
    const keys = Object.keys(data[0]);
    const csvContent = [
      keys.join(","),
      ...data.map((row) =>
        keys
          .map((k) => {
            const val = row[k];
            return typeof val === "string"
              ? `"${val.replace(/"/g, '""')}"`
              : val;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      ref={containerRef}
      className={`chart-wrapper bg-white shadow-sm flex flex-col h-full relative transition-all ${
        isFullscreen ? "is-fullscreen" : "rounded-xl p-4 border border-gray-100"
      }`}
    >
      <div className="print-header hidden mb-6 text-center border-b pb-4 relative">
        <h1 className="text-2xl font-bold text-gray-900">
          Capacity Check Report - {title}
        </h1>
        <p className="text-gray-500 mb-4">
          Generated on {new Date().toLocaleDateString()}
        </p>
        <div
          id="print-scoreboard-placeholder"
          className="text-left flex justify-center w-full"
        ></div>
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
            onClick={(e) => {
              e.stopPropagation();
              downloadPDF();
            }}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors print:hidden"
            title="Download as PDF"
            disabled={isDownloading}
          >
            <Download
              className={`h-5 w-5 ${isDownloading ? "opacity-50 animate-pulse" : ""}`}
            />
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
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Chart Content Area with Click-to-Fullscreen */}
      <div
        className="flex-1 chart-content-wrapper w-full flex flex-col cursor-pointer"
        onClick={toggleFullscreen}
        title="Click to toggle fullscreen"
        key={isFullscreen ? "fullscreen" : "normal"}
      >
        <FullscreenContext.Provider value={isFullscreen}>
          {children}
        </FullscreenContext.Provider>
      </div>
    </div>
  );
}
