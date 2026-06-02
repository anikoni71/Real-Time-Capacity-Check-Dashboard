import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScoreboardRow, ProcessRow } from '../types';
import { Share2, AlertTriangle, Lightbulb, Settings, Users, ArrowRightLeft, Activity, Info, Maximize, Printer, Download, Minimize } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useFullscreen } from '../hooks/useFullscreen';

const DiagramWrapper = ({ title, icon: Icon, children }: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen: isFullScreen, toggleFullscreen: toggleFullScreen } = useFullscreen(containerRef);
  
  const handlePrint = async () => {
    const elem = containerRef.current;
    if (!elem) return;
    
    const buttons = elem.querySelectorAll('.action-buttons');
    buttons.forEach(btn => (btn as HTMLElement).style.display = 'none');

    await new Promise(resolve => setTimeout(resolve, 250)); // Explicit delay for rendering

    const canvas = await html2canvas(elem, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      ignoreElements: (element) => element.classList?.contains('action-buttons')
    });
    const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
    
    // Restore buttons
    buttons.forEach(btn => (btn as HTMLElement).style.display = '');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <style>
            @page { size: A4 landscape; margin: 0; }
            body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #fff; }
            img { width: 100%; height: auto; max-height: 100vh; object-fit: contain; image-rendering: -webkit-optimize-contrast; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = async () => {
    const elem = containerRef.current;
    if (!elem) return;
    try {
      const buttons = elem.querySelectorAll('.action-buttons');
      buttons.forEach(btn => (btn as HTMLElement).style.display = 'none');

      await new Promise(resolve => setTimeout(resolve, 250)); // Force text rendering wait
      
      const canvas = await html2canvas(elem, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        ignoreElements: (element) => element.classList?.contains('action-buttons')
      });
      const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
      
      buttons.forEach(btn => (btn as HTMLElement).style.display = '');
      
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
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgRatio = imgProps.width / imgProps.height;
      
      let finalHeight = availableHeight;
      let finalWidth = finalHeight * imgRatio;
      
      if (finalWidth <= availableWidth) {
         const x = margin + (availableWidth - finalWidth) / 2;
         const y = margin + (availableHeight - finalHeight) / 2;
         pdf.addImage(dataUrl, 'JPEG', x, y, finalWidth, finalHeight);
      } else {
         finalWidth = availableWidth;
         finalHeight = finalWidth / imgRatio;
         const x = margin;
         const y = margin + (availableHeight - finalHeight) / 2;
         pdf.addImage(dataUrl, 'JPEG', x, y, finalWidth, finalHeight);
      }
      
      pdf.save(`${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`);
    } catch (e) {
      console.error('Failed to download image', e);
    }
  };

  return (
    <div ref={containerRef} className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm overflow-hidden relative ${isFullScreen ? 'is-fullscreen overflow-y-auto m-0 p-8 pt-16 flex flex-col' : ''}`}>
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon className={`h-5 w-5 ${title.includes('1') ? 'text-indigo-600' : title.includes('2') ? 'text-emerald-500' : 'text-rose-500'}`} />
          {title}
        </h3>
        <div className="flex bg-gray-50 rounded shadow-sm border p-1 space-x-1 shrink-0 z-50 action-buttons">
          <button onClick={toggleFullScreen} className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors" title="Toggle Fullscreen">
            {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
          <button onClick={handlePrint} className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors" title="Print Diagram">
            <Printer className="h-4 w-4" />
          </button>
          <button onClick={handleDownload} className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors" title="Download PDF">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className={isFullScreen ? 'flex-1 overflow-auto bg-white' : ''}>
        {children}
      </div>
    </div>
  );
};

interface Props {
  scoreboards: ScoreboardRow[];
  processes?: ProcessRow[];
}

export default function RootCauseAnalysis({ scoreboards, processes = [] }: Props) {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const { flags, averages, worstRow, minCapacityProcess } = useMemo(() => {
    if (!scoreboards || scoreboards.length === 0) {
      return {
        flags: { machine: false, manpower: false, method: false, material: false },
        averages: { eff: 0, todayMp: 0, obMp: 0, todayTarget: 0, lineTarget: 0 },
        worstRow: null,
        minCapacityProcess: null
      };
    }

    let effSum = 0;
    let todayMpSum = 0;
    let obMpSum = 0;
    let todayTargetSum = 0;
    let lineTargetSum = 0;
    let presentTackSum = 0;
    let tackSum = 0;

    scoreboards.forEach(sb => {
      effSum += sb.efficiencyValue || 0;
      todayMpSum += parseFloat(sb.todayPreMp) || 0;
      obMpSum += parseFloat(sb.obMp) || 0;
      todayTargetSum += parseFloat(sb.todayPlanLcTarget) || 0;
      lineTargetSum += parseFloat(sb.lineTarget100) || 0;
      presentTackSum += parseFloat(sb.presentTackTimeSec) || 0;
      tackSum += parseFloat(sb.tackTimeSec) || 0;
    });

    const count = scoreboards.length;
    const avgEff = effSum / count;
    
    const machine = avgEff < 75; 
    const manpower = todayMpSum < obMpSum; 
    const method = todayTargetSum < (lineTargetSum * 0.95);
    const material = presentTackSum > tackSum; 

    // Find worst performing line row for dynamic text
    const worstRow = scoreboards.reduce((worst, curr) => (curr.efficiencyValue < worst.efficiencyValue ? curr : worst), scoreboards[0]);

    // Find lowest capacity process across the filtered processes
    const minCapacityProcess = processes && processes.length > 0
      ? processes.reduce((min, p) => (p.capacity < min.capacity ? p : min), processes[0])
      : null;

    return {
      flags: { machine, manpower, method, material },
      averages: { eff: avgEff, todayMp: todayMpSum, obMp: obMpSum, todayTarget: todayTargetSum, lineTarget: lineTargetSum, presentTackSum, tackSum },
      worstRow,
      minCapacityProcess
    };
  }, [scoreboards, processes]);

  const toggleNode = (nodeName: string) => {
    setActiveNode(prev => prev === nodeName ? null : nodeName);
  };

  if (scoreboards.length === 0 || !worstRow) {
    return <div className="p-8 text-center text-gray-500">No data found matching current filters.</div>;
  }

  // Diagram 1: Dynamic Causes based on worstRow
  const lossCauses = {
    machine: [
      { id: 'm1', label: 'Speed Loss', desc: `Operating at ${worstRow.todayPlanLcEfficiency}% vs 75% Baseline` },
      { id: 'm2', label: 'Maintenance Alert', desc: 'Mechanical macro-stop risk detected' },
      { id: 'm3', label: 'Tool Wear Trends', desc: 'Needle breakages, folder adjustments needed.' }
    ],
    manpower: [
      { id: 'mp1', label: 'Actual Variance', desc: `Missing ${Math.max(0, parseFloat(worstRow.obMp) - parseFloat(worstRow.todayPreMp))} Operators` },
      { id: 'mp2', label: 'Line Layout Unbalancing', desc: `on Runday ${worstRow.runday}` },
      { id: 'mp3', label: 'Skill Deficit', desc: 'New operator in critical bottleneck.' }
    ],
    method: [
      { id: 'mt1', label: 'Method Gap', desc: `Plan Target ${worstRow.todayPlanLcTarget} is short of ${worstRow.lineTarget100} Pcs` },
      { id: 'mt2', label: 'SMV Deviation', desc: `Pitch target variance on Style ${worstRow.style}` },
      { id: 'mt3', label: 'Layout Constraints', desc: 'Poor material flow between stations.' }
    ],
    material: [
      { id: 'mat1', label: 'Tack Time Overrun', desc: `${worstRow.presentTackTimeSec}s Actual vs ${worstRow.tackTimeSec}s Standard` },
      { id: 'mat2', label: 'Quality Trap', desc: `Active Rework detected on Buyer ${worstRow.buyer} production` },
      { id: 'mat3', label: 'Handling Time', desc: 'Excessive time spent untying bundles.' }
    ]
  };

  // Diagram 2: Dynamic CAPA Solutions
  const solutions = {
    machine: [
      { id: 's-m1', label: 'Urgent Preventive Maintenance (PM)', desc: 'for Line Equipment' },
      { id: 's-m2', label: 'Recalibrate Limits', desc: `Recalibrate RPM limits for Style ${worstRow.style}` },
      { id: 's-m3', label: 'Machine Swap', desc: 'Bring in standby machine for slow bottlenecks.' }
    ],
    manpower: [
      { id: 's-mp1', label: 'Float Operators', desc: `Deploy ${Math.max(0, parseFloat(worstRow.obMp) - parseFloat(worstRow.todayPreMp))} Float Operators to Line` },
      { id: 's-mp2', label: 'Cross-Training', desc: `Initiate ${worstRow.style} Skill Matrix Cross-Training` },
      { id: 's-mp3', label: 'Pacing feedback', desc: 'Increase digital target visibility.' }
    ],
    method: [
      { id: 's-mt1', label: 'Yamazumi Re-balance', desc: `Yamazumi Re-balance to meet ${worstRow.lineTarget100} Pcs` },
      { id: 's-mt2', label: 'Element Shift', desc: `Shift critical elements for Style ${worstRow.style}` },
      { id: 's-mt3', label: 'Flow layout update', desc: 'Move material staging closer to operator.' }
    ],
    material: [
      { id: 's-mat1', label: 'Buffer sizing', desc: `Increase WIP buffering to handle ${Math.max(0, parseFloat(worstRow.presentTackTimeSec) - parseFloat(worstRow.tackTimeSec)).toFixed(1)}s variations` },
      { id: 's-mat2', label: 'Upstream QA Alert', desc: `Issue QA Alert to cutter for ${worstRow.buyer}` },
      { id: 's-mat3', label: 'Material Handler Aid', desc: 'Assign handler to un-bundle pieces.' }
    ]
  };

  // Diagram 3: Bottleneck Diagnostics
  const bottleneckDiag = {
    machine: [ // Technical
      { id: 'bt-1', label: 'Machine Tuning', desc: `Tuning needed for ${minCapacityProcess?.processName || 'Unknown'}` },
      { id: 'bt-2', label: 'RPM Settings', desc: 'Check if RPM matches SMV requirements' }
    ],
    method: [ // Process
      { id: 'bp-1', label: 'Cycle Time Gap', desc: `Cycle time exceeds takt time by ${minCapacityProcess?.diffr || 0}s` },
      { id: 'bp-2', label: 'Work Breakdown', desc: 'Review process for unnecessary non-value adding steps' }
    ],
    manpower: [ // Operator
      { id: 'bo-1', label: 'Pacing Support', desc: `Operator: ${minCapacityProcess?.operatorName || 'Unknown'} needs pacing support` },
      { id: 'bo-2', label: 'Skill Matrix', desc: 'Verify operator proficiency for this specific task' }
    ],
    material: [ // Quality
      { id: 'bq-1', label: 'Handling Delay', desc: `Check handling time around ${minCapacityProcess?.processName || 'Unknown'}` },
      { id: 'bq-2', label: 'Incoming Parts', desc: 'Ensure upstream quality is not causing rework here' }
    ]
  };

  const currentTheme = {
    machine: { label: 'MACHINE', icon: Settings },
    method: { label: 'METHOD', icon: ArrowRightLeft },
    manpower: { label: 'MANPOWER', icon: Users },
    material: { label: 'MATERIAL', icon: Activity }
  };
  
  const bottleneckTheme = {
    machine: { label: 'TECHNICAL', icon: Settings },
    method: { label: 'PROCESS', icon: ArrowRightLeft },
    manpower: { label: 'OPERATOR', icon: Users },
    material: { label: 'QUALITY', icon: Activity }
  };

  const renderFishbone = (type: 'causes' | 'solutions' | 'bottleneck') => {
    let headText = 'CAPACITY LOSS';
    let headColor = 'bg-indigo-600';
    let dataObj = lossCauses;
    let labelTheme = currentTheme;

    if (type === 'solutions') {
      headText = 'ACTIONABLE CAPA';
      headColor = 'bg-emerald-600';
      dataObj = solutions;
    } else if (type === 'bottleneck') {
      headText = `📉 Lowest Process: ${minCapacityProcess?.processName || 'Unknown'}`;
      headColor = 'bg-rose-600';
      dataObj = bottleneckDiag;
      labelTheme = bottleneckTheme;
    }

    return (
      <div className="w-full overflow-x-auto pb-4 flex justify-center">
        <div style={{ width: '1100px', height: '650px', position: 'relative' }} className="drop-shadow-sm font-sans shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 650" className="absolute top-0 left-0 w-full h-full">
            {/* Spine */}
            <line x1="50" y1="325" x2="940" y2="325" stroke="#9ca3af" strokeWidth="4" />
            <polygon points="920,315 940,325 920,335" fill="#9ca3af" />
            
            {/* BRANCH lines */}
            <line x1="230" y1="160" x2="430" y2="325" stroke={flags.machine ? (type === 'causes' || type === 'bottleneck' ? "#ef4444" : "#10b981") : "#d1d5db"} strokeWidth={flags.machine ? "4" : "2"} />
            <polygon points="418,321 430,325 423,314" fill={flags.machine ? (type === 'causes' || type === 'bottleneck' ? "#ef4444" : "#10b981") : "#d1d5db"} />
            
            <line x1="680" y1="160" x2="830" y2="325" stroke={flags.method ? (type === 'causes' || type === 'bottleneck' ? "#ef4444" : "#10b981") : "#d1d5db"} strokeWidth={flags.method ? "4" : "2"} />
            <polygon points="818,321 830,325 823,314" fill={flags.method ? (type === 'causes' || type === 'bottleneck' ? "#ef4444" : "#10b981") : "#d1d5db"} />
            
            <line x1="230" y1="490" x2="430" y2="325" stroke={flags.manpower ? (type === 'causes' || type === 'bottleneck' ? "#ef4444" : "#10b981") : "#d1d5db"} strokeWidth={flags.manpower ? "4" : "2"} />
            <polygon points="418,329 430,325 423,336" fill={flags.manpower ? (type === 'causes' || type === 'bottleneck' ? "#ef4444" : "#10b981") : "#d1d5db"} />
            
            <line x1="680" y1="490" x2="830" y2="325" stroke={flags.material ? (type === 'causes' || type === 'bottleneck' ? "#ef4444" : "#10b981") : "#d1d5db"} strokeWidth={flags.material ? "4" : "2"} />
            <polygon points="818,329 830,325 823,336" fill={flags.material ? (type === 'causes' || type === 'bottleneck' ? "#ef4444" : "#10b981") : "#d1d5db"} />
          </svg>

          {/* Head */}
          <div style={{ position: 'absolute', left: 940, top: 265, width: 155, height: 120 }}>
            <div className={`h-full w-full ${headColor} text-white rounded-r-lg flex flex-col items-center justify-center p-3 text-center shadow-md border-l-4 border-white/20`} style={{wordBreak: "break-word"}}>
              {type === 'bottleneck' ? (
                <Activity className="h-6 w-6 mb-2 opacity-80" />
              ) : (
                <Share2 className="h-6 w-6 mb-2 opacity-80" />
              )}
              <span className="font-bold text-sm leading-snug">{headText}</span>
            </div>
          </div>

          {/* BRANCH: MACHINE/TECHNICAL (Top-Left) */}
          <div style={{ position: 'absolute', left: 20, top: 5, width: 310, height: 155 }}>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className={`h-full w-full p-3 rounded-md shadow bg-white border-2 cursor-pointer transition-all ${flags.machine ? (type === 'causes' || type === 'bottleneck' ? 'border-red-400' : 'border-emerald-400') : 'border-gray-200'}`}
              onClick={() => toggleNode(`${type}-machine`)}
            >
              <div className="flex items-center gap-2 mb-2 border-b pb-1">
                {React.createElement(labelTheme.machine.icon, { className: `h-4 w-4 ${flags.machine ? (type === 'causes' || type === 'bottleneck' ? 'text-red-500' : 'text-emerald-500') : 'text-gray-400'}` })}
                <h4 className={`font-bold text-sm ${flags.machine ? 'text-gray-900' : 'text-gray-500'}`}>{labelTheme.machine.label}</h4>
                {flags.machine && (type === 'causes' || type === 'bottleneck') && <AlertTriangle className="h-4 w-4 text-red-500 ml-auto" />}
              </div>
              <ul className="text-xs space-y-2 text-gray-600">
                {dataObj.machine.map((item, idx) => (
                  <li key={idx} className="flex gap-1.5 leading-tight">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${flags.machine ? (type === 'causes' || type === 'bottleneck' ? 'bg-red-400' : 'bg-emerald-400') : 'bg-gray-300'}`} />
                    <span className="break-words w-full"><span className="font-semibold text-gray-700">{item.label}:</span> {item.desc}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* BRANCH: METHOD/PROCESS (Top-Right) */}
          <div style={{ position: 'absolute', left: 470, top: 5, width: 310, height: 155 }}>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className={`h-full w-full p-3 rounded-md shadow bg-white border-2 cursor-pointer transition-all ${flags.method ? (type === 'causes' || type === 'bottleneck' ? 'border-red-400' : 'border-emerald-400') : 'border-gray-200'}`}
              onClick={() => toggleNode(`${type}-method`)}
            >
              <div className="flex items-center gap-2 mb-2 border-b pb-1">
                {React.createElement(labelTheme.method.icon, { className: `h-4 w-4 ${flags.method ? (type === 'causes' || type === 'bottleneck' ? 'text-red-500' : 'text-emerald-500') : 'text-gray-400'}` })}
                <h4 className={`font-bold text-sm ${flags.method ? 'text-gray-900' : 'text-gray-500'}`}>{labelTheme.method.label}</h4>
                {flags.method && (type === 'causes' || type === 'bottleneck') && <AlertTriangle className="h-4 w-4 text-red-500 ml-auto" />}
              </div>
              <ul className="text-xs space-y-2 text-gray-600">
                {dataObj.method.map((item, idx) => (
                  <li key={idx} className="flex gap-1.5 leading-tight">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${flags.method ? (type === 'causes' || type === 'bottleneck' ? 'bg-red-400' : 'bg-emerald-400') : 'bg-gray-300'}`} />
                    <span className="break-words w-full"><span className="font-semibold text-gray-700">{item.label}:</span> {item.desc}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* BRANCH: MANPOWER/OPERATOR (Bottom-Left) */}
          <div style={{ position: 'absolute', left: 20, top: 490, width: 310, height: 155 }}>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className={`h-full w-full p-3 rounded-md shadow bg-white border-2 cursor-pointer transition-all ${flags.manpower ? (type === 'causes' || type === 'bottleneck' ? 'border-red-400' : 'border-emerald-400') : 'border-gray-200'}`}
              onClick={() => toggleNode(`${type}-manpower`)}
            >
              <div className="flex items-center gap-2 mb-2 border-b pb-1">
                {React.createElement(labelTheme.manpower.icon, { className: `h-4 w-4 ${flags.manpower ? (type === 'causes' || type === 'bottleneck' ? 'text-red-500' : 'text-emerald-500') : 'text-gray-400'}` })}
                <h4 className={`font-bold text-sm ${flags.manpower ? 'text-gray-900' : 'text-gray-500'}`}>{labelTheme.manpower.label}</h4>
                {flags.manpower && (type === 'causes' || type === 'bottleneck') && <AlertTriangle className="h-4 w-4 text-red-500 ml-auto" />}
              </div>
              <ul className="text-xs space-y-2 text-gray-600">
                {dataObj.manpower.map((item, idx) => (
                  <li key={idx} className="flex gap-1.5 leading-tight">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${flags.manpower ? (type === 'causes' || type === 'bottleneck' ? 'bg-red-400' : 'bg-emerald-400') : 'bg-gray-300'}`} />
                    <span className="break-words w-full"><span className="font-semibold text-gray-700">{item.label}:</span> {item.desc}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* BRANCH: MATERIAL/QUALITY (Bottom-Right) */}
          <div style={{ position: 'absolute', left: 470, top: 490, width: 310, height: 155 }}>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className={`h-full w-full p-3 rounded-md shadow bg-white border-2 cursor-pointer transition-all ${flags.material ? (type === 'causes' || type === 'bottleneck' ? 'border-red-400' : 'border-emerald-400') : 'border-gray-200'}`}
              onClick={() => toggleNode(`${type}-material`)}
            >
              <div className="flex items-center gap-2 mb-2 border-b pb-1">
                {React.createElement(labelTheme.material.icon, { className: `h-4 w-4 ${flags.material ? (type === 'causes' || type === 'bottleneck' ? 'text-red-500' : 'text-emerald-500') : 'text-gray-400'}` })}
                <h4 className={`font-bold text-sm ${flags.material ? 'text-gray-900' : 'text-gray-500'}`}>{labelTheme.material.label}</h4>
                {flags.material && (type === 'causes' || type === 'bottleneck') && <AlertTriangle className="h-4 w-4 text-red-500 ml-auto" />}
              </div>
              <ul className="text-xs space-y-2 text-gray-600">
                {dataObj.material.map((item, idx) => (
                  <li key={idx} className="flex gap-1.5 leading-tight">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${flags.material ? (type === 'causes' || type === 'bottleneck' ? 'bg-red-400' : 'bg-emerald-400') : 'bg-gray-300'}`} />
                    <span className="break-words w-full"><span className="font-semibold text-gray-700">{item.label}:</span> {item.desc}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    );
  };

  const activeNodeDetails = () => {
    if (!activeNode) return null;
    const [type, branch] = activeNode.split('-');
    const isCauses = type === 'causes' || type === 'bottleneck';
    const isBottleneck = type === 'bottleneck';
    const dataList = type === 'causes' ? lossCauses[branch as keyof typeof lossCauses] :
                     type === 'bottleneck' ? bottleneckDiag[branch as keyof typeof bottleneckDiag] :
                     solutions[branch as keyof typeof solutions];
    const isFlagged = flags[branch as keyof typeof flags];
    const theme = isBottleneck ? bottleneckTheme : currentTheme;
    const SectionIcon = theme[branch as keyof typeof theme].icon;
    
    return (
      <div className={`mt-6 p-4 rounded-lg border-l-4 ${isFlagged ? (isCauses ? 'bg-red-50 border-red-500' : 'bg-emerald-50 border-emerald-500') : 'bg-gray-50 border-gray-400'}`}>
        <h4 className="font-bold text-lg mb-3 flex items-center gap-2 uppercase tracking-wide text-gray-800">
          {isCauses ? <AlertTriangle className="h-5 w-5 text-gray-600" /> : <Lightbulb className="h-5 w-5 text-amber-500" />}
          Deep Dive: {theme[branch as keyof typeof theme].label} {isCauses ? (isBottleneck ? "Diagnostics" : "Causes") : 'Solutions'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dataList.map((item: any, idx: number) => (
            <div key={idx} className="bg-white p-3 rounded shadow-sm border border-gray-100 flex items-start gap-3">
               <SectionIcon className={`h-5 w-5 shrink-0 mt-0.5 ${isFlagged ? (isCauses ? 'text-red-400' : 'text-emerald-400') : 'text-gray-400'}`} />
               <div>
                 <div className="font-bold text-gray-800 text-sm mb-1">{item.label}</div>
                 <div className="text-gray-600 text-sm">{item.desc}</div>
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Overview stats panel to show why things are flagged */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className={`p-3 rounded-md flex flex-col ${flags.machine ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
          <span className="text-xs font-semibold text-gray-500 uppercase">Avg Efficiency</span>
          <span className={`text-2xl font-bold ${flags.machine ? 'text-red-600' : 'text-gray-800'}`}>
            {averages.eff.toFixed(1)}%
          </span>
          {flags.machine && <span className="text-xs text-red-500 mt-1">Below target (&lt; 75%)</span>}
        </div>
        
        <div className={`p-3 rounded-md flex flex-col ${flags.manpower ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
          <span className="text-xs font-semibold text-gray-500 uppercase">Manpower (Present / OB)</span>
          <span className={`text-2xl font-bold ${flags.manpower ? 'text-red-600' : 'text-gray-800'}`}>
            {averages.todayMp.toFixed(1)} / {averages.obMp.toFixed(1)}
          </span>
          {flags.manpower && <span className="text-xs text-red-500 mt-1">Gap identified!</span>}
        </div>

        <div className={`p-3 rounded-md flex flex-col ${flags.method ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
          <span className="text-xs font-semibold text-gray-500 uppercase">Target (Plan / 100%)</span>
          <span className={`text-2xl font-bold ${flags.method ? 'text-red-600' : 'text-gray-800'}`}>
            {averages.todayTarget.toFixed(0)} / {averages.lineTarget.toFixed(0)}
          </span>
          {flags.method && <span className="text-xs text-red-500 mt-1">Significant deficit.</span>}
        </div>

        <div className={`p-3 rounded-md flex flex-col ${flags.material ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
          <span className="text-xs font-semibold text-gray-500 uppercase">IE Takt Time Tracker</span>
          <span className={`text-sm font-bold mt-1 leading-tight ${flags.material ? 'text-red-600' : 'text-gray-800'}`}>
            PLAN TAKT TIME: {(averages.tackSum/scoreboards.length).toFixed(1)}s<br/>
            vs<br/>
            ACTUAL TAKT TIME: {(averages.presentTackSum/scoreboards.length).toFixed(1)}s
          </span>
          {flags.material && <span className="text-xs text-red-500 mt-2 font-medium">Actual exceeds plan.</span>}
        </div>
        
        <div className="p-3 rounded-md flex flex-col justify-center bg-blue-50 border border-blue-200 text-blue-800">
           <h3 className="font-bold flex items-center gap-2 text-sm leading-tight">
             <Info className="h-5 w-5 shrink-0 text-blue-600" />
             Dynamic Line Filtering Active
           </h3>
           <p className="text-xs mt-1 text-blue-700 opacity-90">Showing localized RCA metrics for {scoreboards.length === 1 ? `Line ${worstRow.line}` : 'aggregate flow'}. Lowest process: {minCapacityProcess?.processName || 'N/A'}</p>
        </div>
      </div>

      <DiagramWrapper title="DIAGRAM 1: Capacity Loss Root Cause Analysis" icon={AlertTriangle}>
        {renderFishbone('causes')}
        <AnimatePresence>
          {activeNode && activeNode.startsWith('causes') && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              {activeNodeDetails()}
            </motion.div>
          )}
        </AnimatePresence>
      </DiagramWrapper>

      <DiagramWrapper title="DIAGRAM 2: Actionable CAPA Solutions Matrix" icon={Lightbulb}>
        {renderFishbone('solutions')}
        <AnimatePresence>
          {activeNode && activeNode.startsWith('solutions') && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              {activeNodeDetails()}
            </motion.div>
          )}
        </AnimatePresence>
      </DiagramWrapper>

      <DiagramWrapper title="DIAGRAM 3: Bottleneck Diagnostics" icon={Activity}>
        {minCapacityProcess ? (
           <>
             {renderFishbone('bottleneck')}
             <AnimatePresence>
               {activeNode && activeNode.startsWith('bottleneck') && (
                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                   {activeNodeDetails()}
                 </motion.div>
               )}
             </AnimatePresence>
           </>
        ) : (
           <div className="p-8 text-center text-gray-500 bg-gray-50 rounded border border-dashed border-gray-300">
             Process detail data unavailable for bottleneck extraction.
           </div>
        )}
      </DiagramWrapper>
    </div>
  );
}
