import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { FullscreenResponsiveContainer as ResponsiveContainer } from './FullscreenResponsiveContainer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from 'recharts';
import { Activity, Target } from 'lucide-react';
import ChartContainer from './ChartContainer';
import { useFullscreenContext } from '../contexts/FullscreenContext';

export default function LineTargets({ processes }: { processes: ProcessRow[] }) {
  const isFullscreen = useFullscreenContext();
  const lineData = useMemo(() => {
    let l100 = 0;
    let tPlan = 0;
    for (const p of processes) {
      if (l100 === 0 && p.lineTarget100) l100 = p.lineTarget100;
      if (tPlan === 0 && p.todayPlanLcTarget) tPlan = p.todayPlanLcTarget;
    }

    // Link with filter and maintain serial as same as Google Sheet
    return processes.map((p, index) => {
      // Adding index to ensure unique keys just in case, though name might suffice for visual
      return {
        key: `${p.sl}-${index}`,
        name: p.operatorName ? `${p.processName} (${p.operatorName})` : p.processName,
        'Line 100% Target': l100,
        'Today Plan LC Target': tPlan,
        'Capacity': p.capacity || 0
      };
    });
  }, [processes]);

  if (processes.length === 0) return <div className="p-8 text-center text-gray-500">No data found matching current filters.</div>;

  return (
    <div className="space-y-6">
      <ChartContainer title="Line 100% Target vs Capacity" icon={<Target className="h-5 w-5 text-indigo-600" />}>
        <div className="overflow-x-auto w-full pb-4 scrollable-chart-area flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div className="scrollable-chart-inner" style={{ width: isFullscreen ? '100%' : `${Math.max(1200, lineData.length * 60)}px`, height: '100%', minHeight: '600px', flex: 1 }}>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart layout={isFullscreen ? "vertical" : "horizontal"} data={lineData} margin={{ top: 30, right: 30, left: isFullscreen ? 150 : 20, bottom: isFullscreen ? 20 : 220 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={!isFullscreen} horizontal={isFullscreen} stroke="#E5E7EB" />
                 {isFullscreen ? (
                   <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 9, fill: '#4B5563' }} />
                 ) : (
                   <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4B5563' }} interval={0} angle={-45} textAnchor="end" height={150}/>
                 )}
                 {isFullscreen ? (
                   <XAxis type="number" domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(m * 1.2); }]} tick={{ fontSize: 11 }} />
                 ) : (
                   <YAxis domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(m * 1.2); }]} tick={{ fontSize: 11 }} />
                 )}
                 <Tooltip isAnimationActive={false} />
                 <Legend verticalAlign="top" height={isFullscreen ? 50 : 150} />
                 <Line isAnimationActive={false} type="monotone" dataKey="Capacity" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }}>
                   <LabelList dataKey="Capacity" position={isFullscreen ? "right" : "bottom"} fill="#3b82f6" fontSize={11} fontWeight="bold" angle={isFullscreen ? 0 : -55} offset={10} formatter={(v: number) => String(v)} />
                 </Line>
                 <Line isAnimationActive={false} type="monotone" dataKey="Line 100% Target" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={false}>
                   <LabelList dataKey="Line 100% Target" position={isFullscreen ? "right" : "top"} fill="#ef4444" fontSize={11} fontWeight="bold" angle={isFullscreen ? 0 : -55} offset={10} formatter={(v: number) => String(v)} />
                 </Line>
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </ChartContainer>

      <ChartContainer title="Today Plan LC Target vs Capacity" icon={<Activity className="h-5 w-5 text-emerald-600" />}>
        <div className="overflow-x-auto w-full pb-4 scrollable-chart-area flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div className="scrollable-chart-inner" style={{ width: isFullscreen ? '100%' : `${Math.max(1200, lineData.length * 60)}px`, height: '100%', minHeight: '600px', flex: 1 }}>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart layout={isFullscreen ? "vertical" : "horizontal"} data={lineData} margin={{ top: 30, right: 30, left: isFullscreen ? 150 : 20, bottom: isFullscreen ? 20 : 220 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={!isFullscreen} horizontal={isFullscreen} stroke="#E5E7EB" />
                 {isFullscreen ? (
                   <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 9, fill: '#4B5563' }} />
                 ) : (
                   <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4B5563' }} interval={0} angle={-45} textAnchor="end" height={150}/>
                 )}
                 {isFullscreen ? (
                   <XAxis type="number" domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(m * 1.2); }]} tick={{ fontSize: 11 }} />
                 ) : (
                   <YAxis domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(m * 1.2); }]} tick={{ fontSize: 11 }} />
                 )}
                 <Tooltip isAnimationActive={false} />
                 <Legend verticalAlign="top" height={isFullscreen ? 50 : 150} />
                 <Line isAnimationActive={false} type="monotone" dataKey="Capacity" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }}>
                   <LabelList dataKey="Capacity" position={isFullscreen ? "right" : "bottom"} fill="#3b82f6" fontSize={11} fontWeight="bold" angle={isFullscreen ? 0 : -55} offset={10} formatter={(v: number) => String(v)} />
                 </Line>
                 <Line isAnimationActive={false} type="monotone" dataKey="Today Plan LC Target" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={false}>
                   <LabelList dataKey="Today Plan LC Target" position={isFullscreen ? "right" : "top"} fill="#ef4444" fontSize={11} fontWeight="bold" angle={isFullscreen ? 0 : -55} offset={10} formatter={(v: number) => String(v)} />
                 </Line>
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </ChartContainer>
    </div>
  );
}
