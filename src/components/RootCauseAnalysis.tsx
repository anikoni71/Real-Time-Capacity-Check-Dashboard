import React, { useMemo, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { toPng } from 'html-to-image';
import { ScoreboardRow, ProcessRow } from '../types';
import { Share2, AlertTriangle, Lightbulb, Settings, Users, ArrowRightLeft, Activity, Download, Printer, Maximize, Minimize, X, Cpu, UserX } from 'lucide-react';

interface Props {
  scoreboards: ScoreboardRow[];
  processes?: ProcessRow[];
}

export default function RootCauseAnalysis({ scoreboards, processes = [] }: Props) {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [fullscreenDiagram, setFullscreenDiagram] = useState<'causes' | 'solutions' | null>(null);

  const handleDownload = async (type: 'causes' | 'solutions') => {
    const el = document.getElementById(`fishbone-diagram-container-${type}`);
    if (!el) return;
    try {
      const dataUrl = await toPng(el, { backgroundColor: '#ffffff', quality: 1.0 });
      const link = document.createElement('a');
      link.download = `fishbone-${type}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };

  const handlePrint = async (type: 'causes' | 'solutions') => {
    const el = document.getElementById(`fishbone-diagram-container-${type}`);
    if (!el) return;
    try {
      const dataUrl = await toPng(el, { backgroundColor: '#ffffff', quality: 1.0 });
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Print Diagram</title></head>
            <body style="margin:0; padding:20px; display:flex; justify-content:center;">
              <img src="${dataUrl}" style="max-width:100%; height:auto;" />
              <script>
                window.onload = () => {
                  setTimeout(() => {
                    window.print();
                    window.close();
                  }, 250);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (err) {
      console.error('Failed to print image', err);
    }
  };

  const { flags, averages, bottleneck, context } = useMemo(() => {
    if (!scoreboards || scoreboards.length === 0) {
      return {
        flags: { machine: false, manpower: false, method: false, material: false },
        averages: { eff: 0, todayMp: 0, obMp: 0, todayTarget: 0, lineTarget: 0, tackTime: 0, presentTackTime: 0 },
        bottleneck: { processName: 'N/A', operatorName: 'N/A', flags: { process: false, operator: false, tech: false, quality: false } },
        context: { style: 'N/A', buyer: 'N/A', runday: 'N/A', missingMp: 0 }
      };
    }

    let effSum = 0;
    let todayMpSum = 0;
    let obMpSum = 0;
    let todayTargetSum = 0;
    let lineTargetSum = 0;
    let tackTimeSum = 0;
    let presentTackTimeSum = 0;

    let lowestEffRow = scoreboards[0];

    scoreboards.forEach(sb => {
      effSum += sb.efficiencyValue || 0;
      todayMpSum += parseFloat(sb.todayPreMp) || 0;
      obMpSum += parseFloat(sb.obMp) || 0;
      todayTargetSum += parseFloat(sb.todayPlanLcTarget) || 0;
      lineTargetSum += parseFloat(sb.lineTarget100) || 0;
      tackTimeSum += parseFloat(sb.tackTimeSec) || 0;
      presentTackTimeSum += parseFloat(sb.presentTackTimeSec) || 0;

      if ((sb.efficiencyValue || 0) < (lowestEffRow.efficiencyValue || 0)) {
        lowestEffRow = sb;
      }
    });

    const count = scoreboards.length;
    const avgEff = effSum / count;
    const avgTackTime = tackTimeSum / count;
    const avgPresentTackTime = presentTackTimeSum / count;
    
    // Line specific dynamic anomaly rules
    const machine = avgEff < 75; // Line Machine Breakdown / Micro-stops / Speed Losses
    const manpower = todayMpSum < obMpSum; // Line-Specific Absenteeism / Skill Matrix Mismatch
    const method = todayTargetSum < (lineTargetSum * 0.90); // Line Pitch Diagram & Work Element Imbalance
    const material = avgPresentTackTime > avgTackTime; // Upstream Material Starvation / Line Rework Accumulation

    // Bottleneck logic for Diagram 3
    let minCapacity = Infinity;
    let bottleneckProcess = 'Unknown';
    let bottleneckOperator = 'Unknown';
    
    if (processes && processes.length > 0) {
      processes.forEach(p => {
        const cap = p.capacity || 0;
        if (cap > 0 && cap < minCapacity) {
          minCapacity = cap;
          bottleneckProcess = p.processName;
          bottleneckOperator = p.operatorName || 'Unknown';
        }
      });
    }

    const lineTarget = (lineTargetSum / count) > 0 ? (lineTargetSum / count) : Infinity;
    const bProcessFlag = minCapacity < lineTarget;
    // Assuming 75% efficiency target for pacing deficit
    const bOperatorFlag = minCapacity < (lineTarget * 0.75); 
    const bTechFlag = bProcessFlag; 
    const bQualityFlag = bProcessFlag;

    return {
      flags: { machine, manpower, method, material },
      averages: { 
        eff: avgEff, 
        todayMp: todayMpSum, 
        obMp: obMpSum, 
        todayTarget: todayTargetSum, 
        lineTarget: lineTargetSum, 
        tackTime: avgTackTime, 
        presentTackTime: avgPresentTackTime 
      },
      bottleneck: {
        processName: bottleneckProcess,
        operatorName: bottleneckOperator,
        flags: { process: bProcessFlag, operator: bOperatorFlag, tech: bTechFlag, quality: bQualityFlag }
      },
      context: {
        style: lowestEffRow?.style || 'N/A',
        buyer: lowestEffRow?.buyer || 'N/A',
        runday: lowestEffRow?.runday || 'N/A',
        missingMp: Math.max(0, obMpSum - todayMpSum)
      }
    };
  }, [scoreboards, processes]);

  const toggleNode = (nodeName: string) => {
    setActiveNode(prev => prev === nodeName ? null : nodeName);
  };

  const lossCauses = {
    machine: [
      { id: 'm1', label: `Speed Loss: Operating at ${averages.eff.toFixed(1)}% vs 75% Baseline`, desc: `Efficiency drops below 75% threshold. Current: ${averages.eff.toFixed(1)}%` },
      { id: 'm2', label: 'Maintenance Alert: Mechanical macro-stop risk detected', desc: 'Operating time exceeds standard allowances.' },
      { id: 'm3', label: 'Pressure/Timing Calibration Drift', desc: 'Needle or folder calibrations drifted from optimal.' }
    ],
    manpower: [
      { id: 'mp1', label: `Actual Variance: Missing ${(context.missingMp).toFixed(1)} Operators`, desc: `Present: ${averages.todayMp.toFixed(1)}, Required: ${averages.obMp.toFixed(1)}` },
      { id: 'mp2', label: `Line Layout Unbalancing on Runday ${context.runday}`, desc: 'Missing operators breaking the line sequence.' },
      { id: 'mp3', label: 'Operator Performance Rating Deficit (Pacing drop)', desc: 'Operators working below expected pace.' }
    ],
    method: [
      { id: 'mt1', label: `Method Gap: Plan Target ${averages.todayTarget.toFixed(0)} is short of ${averages.lineTarget.toFixed(0)} Pcs`, desc: `Plan (${averages.todayTarget.toFixed(0)}) < 90% Target (${averages.lineTarget.toFixed(0)})` },
      { id: 'mt2', label: `SMV Deviation: Pitch target variance on Style ${context.style}`, desc: 'Work distributed unevenly violating pitch time.' },
      { id: 'mt3', label: 'Folder/Attachment Setup Adaptation Delays', desc: 'Method changes slowing down operations.' }
    ],
    material: [
      { id: 'mat1', label: `Tack Time Overrun: ${averages.presentTackTime.toFixed(1)}s Actual vs ${averages.tackTime.toFixed(1)}s Standard`, desc: `Present Tack Time (${averages.presentTackTime.toFixed(1)}s) > Tack Time (${averages.tackTime.toFixed(1)}s)` },
      { id: 'mat2', label: `Quality Trap: Active Rework detected on Buyer ${context.buyer} production`, desc: 'Increased rework cycle blocking workflow.' },
      { id: 'mat3', label: 'In-line WIP Accumulation (Bottleneck Blocking)', desc: 'Waiting for parts leading to high present tack time.' }
    ]
  };

  const solutions = {
    machine: [
      { id: 's-m1', label: 'Urgent Preventive Maintenance (PM) for Line Equipment', desc: 'Shift PM activities to off-hours to reduce stops.' },
      { id: 's-m2', label: `Recalibrate RPM limits for Style ${context.style}`, desc: 'Deploy optimized kits to improve setup time.' },
      { id: 's-m3', label: 'Machine Allowance Recalibration', desc: 'Review and correct allowances based on current data.' }
    ],
    manpower: [
      { id: 's-mp1', label: `Deploy ${(context.missingMp).toFixed(1)} Float Operators to Line`, desc: 'Position highly-skilled operators to stabilize bottlenecks.' },
      { id: 's-mp2', label: `Initiate ${context.style} Skill Matrix Cross-Training`, desc: 'Develop secondary skills to handle absenteeism.' },
      { id: 's-mp3', label: 'Real-Time Operator Pacing Feedback', desc: 'Implement visual or audio pacing guides.' }
    ],
    method: [
      { id: 's-mt1', label: 'Yamazumi Line Balancing & Element Redistribution', desc: 'Re-level work to match actual pitch.' },
      { id: 's-mt2', label: 'Method Study & Motion Economy Training', desc: 'Provide immediate workstation method correction.' },
      { id: 's-mt3', label: 'Target Cycle Time (Pitch) Resizing', desc: 'Adjust target to reflect actual batch mix geometry.' }
    ],
    material: [
      { id: 's-mat1', label: 'WIP Buffer Management (Kanban Control)', desc: 'Define hard caps for bundle buffers between steps.' },
      { id: 's-mat2', label: 'Upstream Traffic Light Quality Alert System', desc: 'Instant feedback to cutting/prep on defects.' },
      { id: 's-mat3', label: 'Inline Material Handler Route Optimization', desc: 'Dedicated line walkers to feed bundles smoothly.' }
    ]
  };

  const bottleneckCauses = {
    tech: [
      { id: 'b-t1', label: 'Workstation Machine RPM Throttle', desc: 'Machine preset speed limiting the operator.' },
      { id: 'b-t2', label: 'Specialized Folder/Attachment Slippage', desc: 'Slippage causing uneven feeding and requiring rework.' },
      { id: 'b-t3', label: 'Handling/Disposal Method Waste', desc: 'Layout forces non-value-added motion.' },
      { id: 'b-rec-t', type: 'recommendation', label: 'Tech Recommendation: Upgrade attachment or adjust machine parameters to unlock higher RPM.' }
    ],
    quality: [
      { id: 'b-q1', label: 'Frequent Parts Re-sewing/Rework Trap', desc: 'High defect rate from upstream requires time-consuming rework.' },
      { id: 'b-q2', label: 'Bundle Stacking / WIP Blockage at Workstation', desc: 'Physical space constraints blocking operator motion.' },
      { id: 'b-q3', label: 'Component Feeding Disruption', desc: 'Irregular supply of trims or cut parts.' },
      { id: 'b-rec-q', type: 'recommendation', label: 'Quality Recommendation: Introduce inline traffic light alert system to instantly halt upstream defects.' }
    ],
    operator: [
      { id: 'b-o1', label: `Lowest Capacity Operator: ${bottleneck.operatorName}`, desc: 'Operator pacing falls below the required 75% baseline.' },
      { id: 'b-o2', label: 'Individual Operator Performance Deficit', desc: 'Observed speed represents a skill mismatch for this complex operation.' },
      { id: 'b-o3', label: 'Operation Skill Matrix Gaps', desc: 'Operator not fully trained on this exact operation.' },
      { id: 'b-rec-o', type: 'recommendation', label: `IE Recommendation: Perform a Time Study on ${bottleneck.operatorName} at ${bottleneck.processName} to eliminate non-value-added movements and rebalance the pitch diagram.` }
    ],
    process: [
      { id: 'b-p1', label: 'Critical Operation Bottleneck', desc: 'This process dictates the maximum throughput of the entire line.' },
      { id: 'b-p2', label: 'High Standard Allowed Minutes (SAM/SMV) Deviation', desc: 'Actual time drastically exceeds planned SMV.' },
      { id: 'b-p3', label: 'Pitch Diagram Work Element Overload', desc: 'Too many elements grouped into one operator.' },
      { id: 'b-rec-p', type: 'recommendation', label: `IE Recommendation: Rebalance the pitch diagram for ${bottleneck.processName}.` }
    ]
  };

  if (scoreboards.length === 0) {
    return <div className="p-8 text-center text-gray-500">No data found matching current filters.</div>;
  }

  const renderFishbone = (type: 'causes' | 'solutions') => {
    const isCauses = type === 'causes';
    const headText = isCauses ? 'CAPACITY LOSS' : 'ACTIONABLE CAPA';
    const headColor = isCauses ? 'bg-indigo-600' : 'bg-emerald-600';
    const dataObj = isCauses ? lossCauses : solutions;

    return (
      <div className="w-full overflow-x-auto pb-4">
        <div style={{ minWidth: '950px' }}>
          <svg viewBox="0 -20 1000 660" className="w-full h-auto drop-shadow-sm font-sans" style={{ minHeight: '520px' }}>
            {/* Spine */}
            <line x1="50" y1="300" x2="840" y2="300" stroke="#9ca3af" strokeWidth="4" />
            <polygon points="820,290 840,300 820,310" fill="#9ca3af" /> {/* Arrowhead for spine */}
            
            {/* Head */}
            <foreignObject x="840" y="240" width="150" height="120">
              <div className={`h-full w-full ${headColor} text-white rounded-r-lg flex flex-col items-center justify-center p-3 text-center shadow-md border-l-4 border-white/20`}>
                <Share2 className="h-6 w-6 mb-2 opacity-80" />
                <span className="font-bold text-sm tracking-wide">{headText}</span>
              </div>
            </foreignObject>

            {/* BRANCH: MACHINE (Top-Left) */}
            <line x1="230" y1="150" x2="380" y2="300" stroke={flags.machine ? (isCauses ? "#ef4444" : "#10b981") : "#d1d5db"} strokeWidth={flags.machine ? "4" : "2"} />
            <polygon points="370,298 380,300 373,293" fill={flags.machine ? (isCauses ? "#ef4444" : "#10b981") : "#d1d5db"} />
            <foreignObject x="115" y="-15" width="230" height="175">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className={`h-full w-full p-3 rounded-md shadow bg-white border-2 cursor-pointer transition-all ${flags.machine ? (isCauses ? 'border-red-400' : 'border-emerald-400') : 'border-gray-200'}`}
                onClick={() => toggleNode(`${type}-machine`)}
              >
                <div className="flex items-center gap-2 mb-2 border-b pb-1">
                  <Settings className={`h-4 w-4 ${flags.machine ? (isCauses ? 'text-red-500' : 'text-emerald-500') : 'text-gray-400'}`} />
                  <h4 className={`font-bold text-[11px] ${flags.machine ? 'text-gray-900' : 'text-gray-500'}`}>MACHINE (MAINTENANCE)</h4>
                  {flags.machine && isCauses && <AlertTriangle className="h-4 w-4 text-red-500 ml-auto" />}
                </div>
                <ul className="text-xs space-y-1.5 text-gray-600">
                  {dataObj.machine.map(item => (
                    <li key={item.id} className="flex gap-1.5 leading-tight">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${flags.machine ? (isCauses ? 'bg-red-400' : 'bg-emerald-400') : 'bg-gray-300'}`} />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </foreignObject>

            {/* BRANCH: METHOD (Top-Right) */}
            <line x1="590" y1="150" x2="740" y2="300" stroke={flags.method ? (isCauses ? "#ef4444" : "#10b981") : "#d1d5db"} strokeWidth={flags.method ? "4" : "2"} />
            <polygon points="730,298 740,300 733,293" fill={flags.method ? (isCauses ? "#ef4444" : "#10b981") : "#d1d5db"} />
            <foreignObject x="475" y="-15" width="230" height="175">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className={`h-full w-full p-3 rounded-md shadow bg-white border-2 cursor-pointer transition-all ${flags.method ? (isCauses ? 'border-red-400' : 'border-emerald-400') : 'border-gray-200'}`}
                onClick={() => toggleNode(`${type}-method`)}
              >
                <div className="flex items-center gap-2 mb-2 border-b pb-1">
                  <ArrowRightLeft className={`h-4 w-4 ${flags.method ? (isCauses ? 'text-red-500' : 'text-emerald-500') : 'text-gray-400'}`} />
                  <h4 className={`font-bold text-[11px] ${flags.method ? 'text-gray-900' : 'text-gray-500'}`}>METHOD (IE & TECH)</h4>
                  {flags.method && isCauses && <AlertTriangle className="h-4 w-4 text-red-500 ml-auto" />}
                </div>
                <ul className="text-xs space-y-1.5 text-gray-600">
                  {dataObj.method.map(item => (
                    <li key={item.id} className="flex gap-1.5 leading-tight">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${flags.method ? (isCauses ? 'bg-red-400' : 'bg-emerald-400') : 'bg-gray-300'}`} />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </foreignObject>

            {/* BRANCH: MANPOWER (Bottom-Left) */}
            <line x1="230" y1="450" x2="380" y2="300" stroke={flags.manpower ? (isCauses ? "#ef4444" : "#10b981") : "#d1d5db"} strokeWidth={flags.manpower ? "4" : "2"} />
            <polygon points="370,302 380,300 373,307" fill={flags.manpower ? (isCauses ? "#ef4444" : "#10b981") : "#d1d5db"} />
            <foreignObject x="115" y="435" width="230" height="175">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className={`h-full w-full p-3 rounded-md shadow bg-white border-2 cursor-pointer transition-all ${flags.manpower ? (isCauses ? 'border-red-400' : 'border-emerald-400') : 'border-gray-200'}`}
                onClick={() => toggleNode(`${type}-manpower`)}
              >
                <div className="flex items-center gap-2 mb-2 border-b pb-1">
                  <Users className={`h-4 w-4 ${flags.manpower ? (isCauses ? 'text-red-500' : 'text-emerald-500') : 'text-gray-400'}`} />
                  <h4 className={`font-bold text-[11px] ${flags.manpower ? 'text-gray-900' : 'text-gray-500'}`}>MANPOWER (IE & PROD)</h4>
                  {flags.manpower && isCauses && <AlertTriangle className="h-4 w-4 text-red-500 ml-auto" />}
                </div>
                <ul className="text-xs space-y-1.5 text-gray-600">
                  {dataObj.manpower.map(item => (
                    <li key={item.id} className="flex gap-1.5 leading-tight">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${flags.manpower ? (isCauses ? 'bg-red-400' : 'bg-emerald-400') : 'bg-gray-300'}`} />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </foreignObject>

            {/* BRANCH: MATERIAL / ENV (Bottom-Right) */}
            <line x1="590" y1="450" x2="740" y2="300" stroke={flags.material ? (isCauses ? "#ef4444" : "#10b981") : "#d1d5db"} strokeWidth={flags.material ? "4" : "2"} />
            <polygon points="730,302 740,300 733,307" fill={flags.material ? (isCauses ? "#ef4444" : "#10b981") : "#d1d5db"} />
            <foreignObject x="475" y="435" width="230" height="175">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className={`h-full w-full p-3 rounded-md shadow bg-white border-2 cursor-pointer transition-all ${flags.material ? (isCauses ? 'border-red-400' : 'border-emerald-400') : 'border-gray-200'}`}
                onClick={() => toggleNode(`${type}-material`)}
              >
                <div className="flex items-center gap-2 mb-2 border-b pb-1">
                  <Activity className={`h-4 w-4 ${flags.material ? (isCauses ? 'text-red-500' : 'text-emerald-500') : 'text-gray-400'}`} />
                  <h4 className={`font-bold text-[11px] ${flags.material ? 'text-gray-900' : 'text-gray-500'}`}>MATERIAL & QUALITY</h4>
                  {flags.material && isCauses && <AlertTriangle className="h-4 w-4 text-red-500 ml-auto" />}
                </div>
                <ul className="text-xs space-y-1.5 text-gray-600">
                  {dataObj.material.map(item => (
                    <li key={item.id} className="flex gap-1.5 leading-tight">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${flags.material ? (isCauses ? 'bg-red-400' : 'bg-emerald-400') : 'bg-gray-300'}`} />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </foreignObject>
          </svg>
        </div>
      </div>
    );
  };

  const renderDiagram3 = () => {
    const isFullScreen = fullscreenDiagram === 'bottleneck';
    const type = 'bottleneck';

    return (
      <div 
        id={`fishbone-diagram-container-${type}`}
        className={isFullScreen ? 
          "fixed inset-0 z-[100] bg-white p-6 md:p-12 overflow-y-auto w-full h-full flex flex-col" : 
          "bg-white p-6 rounded-lg border border-gray-200 shadow-sm overflow-hidden relative"
        }
      >
        <div className="flex justify-between items-start md:items-center border-b pb-2 mb-6 flex-col md:flex-row gap-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-purple-600" />
            DIAGRAM 3: BOTTLENECK PROCESS & LOWEST CAPACITY OPERATOR DIAGNOSTICS
          </h3>
          <div className="flex items-center gap-2 action-buttons" data-html2canvas-ignore>
            <button onClick={() => handleDownload(type)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title="Download PNG">
              <Download className="h-5 w-5" />
            </button>
            <button onClick={() => handlePrint(type)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title="Print">
              <Printer className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setFullscreenDiagram(isFullScreen ? null : type)} 
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" 
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
            {isFullScreen && (
              <button 
                onClick={() => setFullscreenDiagram(null)} 
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors ml-2 border-l border-gray-200 pl-4" 
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        
        <div className={isFullScreen ? "max-w-6xl mx-auto w-full flex-1" : ""}>
          <div className="w-full overflow-x-auto pb-4">
            <div style={{ minWidth: '950px' }}>
              <svg viewBox="0 -20 1000 660" className="w-full h-auto drop-shadow-sm font-sans" style={{ minHeight: '520px' }}>
                {/* Spine */}
                <line x1="50" y1="300" x2="840" y2="300" stroke="#9ca3af" strokeWidth="4" />
                <polygon points="820,290 840,300 820,310" fill="#9ca3af" />
                
                {/* Head */}
                <foreignObject x="840" y="240" width="150" height="120">
                  <div className={`h-full w-full bg-purple-600 text-white rounded-r-lg flex flex-col items-center justify-center p-3 text-center shadow-md border-l-4 border-white/20`}>
                    <AlertTriangle className="h-6 w-6 mb-2 opacity-80" />
                    <span className="font-bold text-xs tracking-wider">📉 Lowest Process:<br/>{bottleneck.processName}</span>
                  </div>
                </foreignObject>

                {/* TECH Branch (Top-Left) */}
                <line x1="230" y1="150" x2="380" y2="300" stroke={bottleneck.flags.tech ? "#ef4444" : "#d1d5db"} strokeWidth={bottleneck.flags.tech ? "4" : "2"} />
                <polygon points="370,298 380,300 373,293" fill={bottleneck.flags.tech ? "#ef4444" : "#d1d5db"} />
                <foreignObject x="115" y="-15" width="230" height="175">
                  <motion.div whileHover={{ scale: 1.05 }} className={`h-full w-full p-3 rounded-md shadow bg-white border-2 cursor-pointer transition-all ${bottleneck.flags.tech ? 'border-red-400' : 'border-gray-200'}`} onClick={() => toggleNode('bottleneck-tech')}>
                    <div className="flex items-center gap-2 mb-2 border-b pb-1">
                      <Settings className={`h-4 w-4 ${bottleneck.flags.tech ? 'text-red-500' : 'text-gray-400'}`} />
                      <h4 className={`font-bold text-xs ${bottleneck.flags.tech ? 'text-gray-900' : 'text-gray-500'}`}>TECHNICAL</h4>
                    </div>
                    <ul className="text-[10px] space-y-1 text-gray-600">
                      {bottleneckCauses.tech.filter((item: any) => item.type !== 'recommendation').map(item => (
                        <li key={item.id} className="flex gap-1 leading-tight"><div className={`w-1.5 h-1.5 rounded-full mt-0.5 shrink-0 ${bottleneck.flags.tech ? 'bg-red-400' : 'bg-gray-300'}`} /><span>{item.label}</span></li>
                      ))}
                    </ul>
                  </motion.div>
                </foreignObject>

                {/* PROCESS Branch (Top-Right) */}
                <line x1="590" y1="150" x2="740" y2="300" stroke={bottleneck.flags.process ? "#ef4444" : "#d1d5db"} strokeWidth={bottleneck.flags.process ? "4" : "2"} />
                <polygon points="730,298 740,300 733,293" fill={bottleneck.flags.process ? "#ef4444" : "#d1d5db"} />
                <foreignObject x="475" y="-15" width="230" height="175">
                  <motion.div whileHover={{ scale: 1.05 }} className={`h-full w-full p-3 rounded-md shadow bg-white border-2 cursor-pointer transition-all ${bottleneck.flags.process ? 'border-red-400' : 'border-gray-200'}`} onClick={() => toggleNode('bottleneck-process')}>
                    <div className="flex items-center gap-2 mb-2 border-b pb-1">
                      <ArrowRightLeft className={`h-4 w-4 ${bottleneck.flags.process ? 'text-red-500' : 'text-gray-400'}`} />
                      <h4 className={`font-bold text-xs ${bottleneck.flags.process ? 'text-gray-900' : 'text-gray-500'}`}>PROCESS (IE)</h4>
                    </div>
                    <ul className="text-[10px] space-y-1 text-gray-600">
                      {bottleneckCauses.process.filter((item: any) => item.type !== 'recommendation').map(item => (
                        <li key={item.id} className="flex gap-1 leading-tight"><div className={`w-1.5 h-1.5 rounded-full mt-0.5 shrink-0 ${bottleneck.flags.process ? 'bg-red-400' : 'bg-gray-300'}`} /><span>{item.label}</span></li>
                      ))}
                    </ul>
                  </motion.div>
                </foreignObject>

                {/* OPERATOR Branch (Bottom-Left) */}
                <line x1="230" y1="450" x2="380" y2="300" stroke={bottleneck.flags.operator ? "#ef4444" : "#d1d5db"} strokeWidth={bottleneck.flags.operator ? "4" : "2"} />
                <polygon points="370,302 380,300 373,307" fill={bottleneck.flags.operator ? "#ef4444" : "#d1d5db"} />
                <foreignObject x="115" y="435" width="230" height="175">
                  <motion.div whileHover={{ scale: 1.05 }} className={`h-full w-full p-3 rounded-md shadow bg-white border-2 cursor-pointer transition-all ${bottleneck.flags.operator ? 'border-red-400' : 'border-gray-200'}`} onClick={() => toggleNode('bottleneck-operator')}>
                    <div className="flex items-center gap-2 mb-2 border-b pb-1">
                      <UserX className={`h-4 w-4 ${bottleneck.flags.operator ? 'text-red-500' : 'text-gray-400'}`} />
                      <h4 className={`font-bold text-[11px] ${bottleneck.flags.operator ? 'text-gray-900' : 'text-gray-500'}`}>OPERATOR</h4>
                    </div>
                    <ul className="text-[10px] space-y-1 text-gray-600">
                      {bottleneckCauses.operator.filter((item: any) => item.type !== 'recommendation').map(item => (
                        <li key={item.id} className="flex gap-1 leading-tight"><div className={`w-1.5 h-1.5 rounded-full mt-0.5 shrink-0 ${bottleneck.flags.operator ? 'bg-red-400' : 'bg-gray-300'}`} /><span>{item.label}</span></li>
                      ))}
                    </ul>
                  </motion.div>
                </foreignObject>

                {/* QUALITY Branch (Bottom-Right) */}
                <line x1="590" y1="450" x2="740" y2="300" stroke={bottleneck.flags.quality ? "#ef4444" : "#d1d5db"} strokeWidth={bottleneck.flags.quality ? "4" : "2"} />
                <polygon points="730,302 740,300 733,307" fill={bottleneck.flags.quality ? "#ef4444" : "#d1d5db"} />
                <foreignObject x="475" y="435" width="230" height="175">
                  <motion.div whileHover={{ scale: 1.05 }} className={`h-full w-full p-3 rounded-md shadow bg-white border-2 cursor-pointer transition-all ${bottleneck.flags.quality ? 'border-red-400' : 'border-gray-200'}`} onClick={() => toggleNode('bottleneck-quality')}>
                    <div className="flex items-center gap-2 mb-2 border-b pb-1">
                      <Activity className={`h-4 w-4 ${bottleneck.flags.quality ? 'text-red-500' : 'text-gray-400'}`} />
                      <h4 className={`font-bold text-xs ${bottleneck.flags.quality ? 'text-gray-900' : 'text-gray-500'}`}>QUALITY</h4>
                    </div>
                    <ul className="text-[10px] space-y-1 text-gray-600">
                      {bottleneckCauses.quality.filter((item: any) => item.type !== 'recommendation').map(item => (
                        <li key={item.id} className="flex gap-1 leading-tight"><div className={`w-1.5 h-1.5 rounded-full mt-0.5 shrink-0 ${bottleneck.flags.quality ? 'bg-red-400' : 'bg-gray-300'}`} /><span>{item.label}</span></li>
                      ))}
                    </ul>
                  </motion.div>
                </foreignObject>
              </svg>
            </div>
          </div>
          {activeNode?.startsWith('bottleneck') && activeNodeDetails()}
        </div>
      </div>
    );
  };

  const activeNodeDetails = () => {
    if (!activeNode) return null;
    const [type, branch] = activeNode.split('-');
    const isCauses = type === 'causes';
    const isBottleneck = type === 'bottleneck';
    
    let dataList: any[] = [];
    let isFlagged = false;
    let titleStr = '';
    
    if (isBottleneck) {
      dataList = bottleneckCauses[branch as keyof typeof bottleneckCauses];
      isFlagged = bottleneck.flags[branch as keyof typeof bottleneck.flags];
      titleStr = `Diagnostics: ${branch} Issues`;
    } else {
      dataList = isCauses ? lossCauses[branch as keyof typeof lossCauses] : solutions[branch as keyof typeof solutions];
      isFlagged = flags[branch as keyof typeof flags];
      titleStr = `Deep Dive: ${branch} ${isCauses ? 'Causes' : 'Solutions'}`;
    }
    
    const standardItems = dataList.filter(i => i.type !== 'recommendation');
    const recItem = dataList.find(i => i.type === 'recommendation');

    return (
      <div className={`mt-6 p-4 rounded-lg border-l-4 ${isFlagged ? (isCauses || isBottleneck ? 'bg-red-50 border-red-500' : 'bg-emerald-50 border-emerald-500') : 'bg-gray-50 border-gray-400'}`}>
        <h4 className="font-bold text-lg mb-3 flex items-center gap-2 uppercase tracking-wide text-gray-800">
          {isCauses || isBottleneck ? <AlertTriangle className="h-5 w-5 text-gray-600" /> : <Lightbulb className="h-5 w-5 text-amber-500" />}
          {titleStr}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {standardItems.map(item => (
            <div key={item.id} className="bg-white p-3 rounded shadow-sm border border-gray-100">
              <div className="font-bold text-gray-800 text-sm mb-1">{item.label}</div>
              <div className="text-gray-600 text-sm">{item.desc}</div>
            </div>
          ))}
        </div>
        {recItem && (
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-md text-indigo-900 font-medium">
            {recItem.label}
          </div>
        )}
      </div>
    );
  };

  const renderDiagramSection = (type: 'causes' | 'solutions') => {
    const isCauses = type === 'causes';
    const isFullScreen = fullscreenDiagram === type;

    return (
      <div 
        id={`fishbone-diagram-container-${type}`}
        className={isFullScreen ? 
          "fixed inset-0 z-[100] bg-white p-6 md:p-12 overflow-y-auto w-full h-full flex flex-col" : 
          "bg-white p-6 rounded-lg border border-gray-200 shadow-sm overflow-hidden relative"
        }
      >
        <div className="flex justify-between items-start md:items-center border-b pb-2 mb-6 flex-col md:flex-row gap-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            {isCauses ? <AlertTriangle className="h-5 w-5 text-indigo-600" /> : <Lightbulb className="h-5 w-5 text-amber-500" />}
            {isCauses ? 'DIAGRAM 1: APPAREL CAPACITY LOSS RCA (CROSS-DEPARTMENTAL)' : 'DIAGRAM 2: JOINT ACTIONABLE SOLUTIONS MATRIX (CAPA)'}
          </h3>
          <div className="flex items-center gap-2 action-buttons" data-html2canvas-ignore>
            <button onClick={() => handleDownload(type)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title="Download PNG">
              <Download className="h-5 w-5" />
            </button>
            <button onClick={() => handlePrint(type)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title="Print">
              <Printer className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setFullscreenDiagram(isFullScreen ? null : type)} 
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" 
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
            {isFullScreen && (
              <button 
                onClick={() => setFullscreenDiagram(null)} 
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors ml-2 border-l border-gray-200 pl-4" 
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        
        <div className={isFullScreen ? "max-w-6xl mx-auto w-full flex-1" : ""}>
          {renderFishbone(type)}
          {activeNode && activeNode.startsWith(type) && activeNodeDetails()}
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
          {flags.method && <span className="text-xs text-red-500 mt-1">Significant deficit (&lt; 90%).</span>}
        </div>
        
        <div className={`p-3 rounded-md flex flex-col ${flags.material ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
          <span className="text-xs font-semibold text-gray-500 uppercase">Tack Time (Present / Std)</span>
          <span className={`text-2xl font-bold ${flags.material ? 'text-red-600' : 'text-gray-800'}`}>
            {averages.presentTackTime.toFixed(1)} / {averages.tackTime.toFixed(1)}
          </span>
          {flags.material && <span className="text-xs text-red-500 mt-1">Excessive Tack Time!</span>}
        </div>

        <div className="p-3 rounded-md flex flex-col justify-center bg-blue-50 border border-blue-200 text-blue-800">
           <h3 className="font-bold flex items-center gap-2 text-sm leading-tight">
             <Share2 className="h-4 w-4 shrink-0" />
             Interactive Fishbone diagrams auto-update based on these metrics.
           </h3>
           <p className="text-xs mt-1 opacity-80">Click any branch to view diagnostic details.</p>
        </div>
      </div>

      {renderDiagramSection('causes')}
      {renderDiagramSection('solutions')}
      {renderDiagram3()}
    </div>
  );
}
