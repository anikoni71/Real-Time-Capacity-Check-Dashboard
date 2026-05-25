import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ScoreboardRow } from '../types';
import { Share2, AlertTriangle, Lightbulb, Settings, Users, ArrowRightLeft, Activity } from 'lucide-react';

interface Props {
  scoreboards: ScoreboardRow[];
}

export default function RootCauseAnalysis({ scoreboards }: Props) {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const { flags, averages } = useMemo(() => {
    if (!scoreboards || scoreboards.length === 0) {
      return {
        flags: { machine: false, manpower: false, method: false, material: false },
        averages: { eff: 0, todayMp: 0, obMp: 0, todayTarget: 0, lineTarget: 0 }
      };
    }

    let effSum = 0;
    let todayMpSum = 0;
    let obMpSum = 0;
    let todayTargetSum = 0;
    let lineTargetSum = 0;

    scoreboards.forEach(sb => {
      effSum += sb.efficiencyValue || 0;
      todayMpSum += parseFloat(sb.todayPreMp) || 0;
      obMpSum += parseFloat(sb.obMp) || 0;
      todayTargetSum += parseFloat(sb.todayPlanLcTarget) || 0;
      lineTargetSum += parseFloat(sb.lineTarget100) || 0;
    });

    const count = scoreboards.length;
    const avgEff = effSum / count;
    
    // Total numbers for MP and Targets make more sense if filtered to line/day, 
    // but sums work well for "overall is it missing?" checking.
    const machine = avgEff < 75; // "TODAY PLAN LC EFFICIENCY falls below 75%"
    const manpower = todayMpSum < obMpSum; // "TODAY PRE M/P is less than OB MP"
    // "TODAY PLAN LC TARGET is significantly below LINE TARGET 100%" (let's say < 95% of target)
    const method = todayTargetSum < (lineTargetSum * 0.95);
    const material = false; // Placeholder if needed

    return {
      flags: { machine, manpower, method, material },
      averages: { eff: avgEff, todayMp: todayMpSum, obMp: obMpSum, todayTarget: todayTargetSum, lineTarget: lineTargetSum }
    };
  }, [scoreboards]);

  const toggleNode = (nodeName: string) => {
    setActiveNode(prev => prev === nodeName ? null : nodeName);
  };

  const lossCauses = {
    machine: [
      { id: 'm1', label: 'Speed Losses', desc: `Machine operating below rated speed. Current efficiency: ${averages.eff.toFixed(1)}%` },
      { id: 'm2', label: 'Minor Stops', desc: 'Frequent jams or minor resets slowing down pace.' },
      { id: 'm3', label: 'Tool Wear Trends', desc: 'Needle breakages, folder adjustments needed.' }
    ],
    manpower: [
      { id: 'mp1', label: 'Headcount Gaps', desc: `Missing operators. Present: ${averages.todayMp.toFixed(1)}, Required: ${averages.obMp.toFixed(1)}` },
      { id: 'mp2', label: 'Pacing Issues', desc: 'Rhythm breaks or operator fatigue.' },
      { id: 'mp3', label: 'Skill Deficit', desc: 'New operator in critical bottleneck.' }
    ],
    method: [
      { id: 'mt1', label: 'Line Imbalances', desc: 'Work content not distributed evenly.' },
      { id: 'mt2', label: 'Structural Target Buffers', desc: `Plan (${averages.todayTarget.toFixed(0)}) < 100% Target (${averages.lineTarget.toFixed(0)})` },
      { id: 'mt3', label: 'Layout Constraints', desc: 'Poor material flow between stations.' }
    ],
    material: [
      { id: 'mat1', label: 'Material Shortage', desc: 'Waiting for trims or cut panels.' },
      { id: 'mat2', label: 'Quality Defects', desc: 'Fabric shading or sizing issues.' },
      { id: 'mat3', label: 'Handling Time', desc: 'Excessive time spent untying bundles.' }
    ]
  };

  const solutions = {
    machine: [
      { id: 's-m1', label: 'Preventive Tooling replacement', desc: 'Schedule folder/needle checks at shift start.' },
      { id: 's-m2', label: 'Sensor Alignment Checks', desc: 'Calibrate edge guides and thread sensors.' },
      { id: 's-m3', label: 'Machine Swap', desc: 'Bring in standby machine for slow bottlenecks.' }
    ],
    manpower: [
      { id: 's-mp1', label: 'Cross-training matrix', desc: 'Deploy floaters to cover absenteeism.' },
      { id: 's-mp2', label: 'Real-time Ergonomics', desc: 'Adjust chair heights and lighting.' },
      { id: 's-mp3', label: 'Pacing feedback', desc: 'Increase digital target visibility.' }
    ],
    method: [
      { id: 's-mt1', label: 'Yamazumi Re-allocation', desc: 'Shift elements from highest capacity ops to underutilized ops.' },
      { id: 's-mt2', label: 'Element Redistribution', desc: 'Break down long tasks into two shorter tasks.' },
      { id: 's-mt3', label: 'Flow layout update', desc: 'Move material staging closer to operator.' }
    ],
    material: [
      { id: 's-mat1', label: 'Buffer sizing', desc: 'Increase WIP limits at bottleneck feeding stations.' },
      { id: 's-mat2', label: 'Upstream QA Alert', desc: 'Send feedback to cutting/prep department.' },
      { id: 's-mat3', label: 'Material Handler Aid', desc: 'Assign handler to un-bundle pieces.' }
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
          <svg viewBox="0 0 1000 600" className="w-full h-auto drop-shadow-sm font-sans" style={{ minHeight: '500px' }}>
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
            <foreignObject x="120" y="10" width="220" height="140">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className={`h-full w-full p-3 rounded-md shadow bg-white border-2 cursor-pointer transition-all ${flags.machine ? (isCauses ? 'border-red-400' : 'border-emerald-400') : 'border-gray-200'}`}
                onClick={() => toggleNode(`${type}-machine`)}
              >
                <div className="flex items-center gap-2 mb-2 border-b pb-1">
                  <Settings className={`h-4 w-4 ${flags.machine ? (isCauses ? 'text-red-500' : 'text-emerald-500') : 'text-gray-400'}`} />
                  <h4 className={`font-bold text-sm ${flags.machine ? 'text-gray-900' : 'text-gray-500'}`}>MACHINE</h4>
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
            <foreignObject x="480" y="10" width="220" height="140">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className={`h-full w-full p-3 rounded-md shadow bg-white border-2 cursor-pointer transition-all ${flags.method ? (isCauses ? 'border-red-400' : 'border-emerald-400') : 'border-gray-200'}`}
                onClick={() => toggleNode(`${type}-method`)}
              >
                <div className="flex items-center gap-2 mb-2 border-b pb-1">
                  <ArrowRightLeft className={`h-4 w-4 ${flags.method ? (isCauses ? 'text-red-500' : 'text-emerald-500') : 'text-gray-400'}`} />
                  <h4 className={`font-bold text-sm ${flags.method ? 'text-gray-900' : 'text-gray-500'}`}>METHOD</h4>
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
            <foreignObject x="120" y="450" width="220" height="140">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className={`h-full w-full p-3 rounded-md shadow bg-white border-2 cursor-pointer transition-all ${flags.manpower ? (isCauses ? 'border-red-400' : 'border-emerald-400') : 'border-gray-200'}`}
                onClick={() => toggleNode(`${type}-manpower`)}
              >
                <div className="flex items-center gap-2 mb-2 border-b pb-1">
                  <Users className={`h-4 w-4 ${flags.manpower ? (isCauses ? 'text-red-500' : 'text-emerald-500') : 'text-gray-400'}`} />
                  <h4 className={`font-bold text-sm ${flags.manpower ? 'text-gray-900' : 'text-gray-500'}`}>MANPOWER</h4>
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
            <foreignObject x="480" y="450" width="220" height="140">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className={`h-full w-full p-3 rounded-md shadow bg-white border-2 cursor-pointer transition-all ${flags.material ? (isCauses ? 'border-red-400' : 'border-emerald-400') : 'border-gray-200'}`}
                onClick={() => toggleNode(`${type}-material`)}
              >
                <div className="flex items-center gap-2 mb-2 border-b pb-1">
                  <Activity className={`h-4 w-4 ${flags.material ? (isCauses ? 'text-red-500' : 'text-emerald-500') : 'text-gray-400'}`} />
                  <h4 className={`font-bold text-sm ${flags.material ? 'text-gray-900' : 'text-gray-500'}`}>MATERIAL</h4>
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

  const activeNodeDetails = () => {
    if (!activeNode) return null;
    const [type, branch] = activeNode.split('-');
    const isCauses = type === 'causes';
    const dataList = isCauses ? lossCauses[branch as keyof typeof lossCauses] : solutions[branch as keyof typeof solutions];
    const isFlagged = flags[branch as keyof typeof flags];
    
    return (
      <div className={`mt-6 p-4 rounded-lg border-l-4 ${isFlagged ? (isCauses ? 'bg-red-50 border-red-500' : 'bg-emerald-50 border-emerald-500') : 'bg-gray-50 border-gray-400'}`}>
        <h4 className="font-bold text-lg mb-3 flex items-center gap-2 uppercase tracking-wide text-gray-800">
          {isCauses ? <AlertTriangle className="h-5 w-5 text-gray-600" /> : <Lightbulb className="h-5 w-5 text-amber-500" />}
          Deep Dive: {branch} {isCauses ? 'Causes' : 'Solutions'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dataList.map(item => (
            <div key={item.id} className="bg-white p-3 rounded shadow-sm border border-gray-100">
              <div className="font-bold text-gray-800 text-sm mb-1">{item.label}</div>
              <div className="text-gray-600 text-sm">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Overview stats panel to show why things are flagged */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
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
        
        <div className="p-3 rounded-md flex flex-col justify-center bg-blue-50 border border-blue-200 text-blue-800">
           <h3 className="font-bold flex items-center gap-2 text-sm leading-tight">
             <Share2 className="h-4 w-4 shrink-0" />
             Interactive Fishbone diagrams auto-update based on these metrics.
           </h3>
           <p className="text-xs mt-1 opacity-80">Click any branch to view diagnostic details.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm overflow-hidden relative">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2">
          <AlertTriangle className="h-5 w-5 text-indigo-600" />
          DIAGRAM 1: Capacity Loss Root Cause Analysis
        </h3>
        
        {renderFishbone('causes')}
        {activeNode && activeNode.startsWith('causes') && activeNodeDetails()}
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm overflow-hidden relative">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          DIAGRAM 2: Actionable CAPA Solutions Matrix
        </h3>
        
        {renderFishbone('solutions')}
        {activeNode && activeNode.startsWith('solutions') && activeNodeDetails()}
      </div>
    </div>
  );
}
