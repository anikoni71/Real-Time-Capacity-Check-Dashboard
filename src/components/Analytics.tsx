import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { FullscreenResponsiveContainer as ResponsiveContainer } from './FullscreenResponsiveContainer';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, ReferenceLine } from 'recharts';
import { PieChart, ArrowUpRight } from 'lucide-react';
import ChartContainer from './ChartContainer';
import { useFullscreenContext } from '../contexts/FullscreenContext';

export default function Analytics({ processes }: { processes: ProcessRow[] }) {
  const isFullscreen = useFullscreenContext();
  const { processStats, topProcesses, target1, target2 } = useMemo(() => {
    const processOps: string[] = [];
    processes.forEach(p => {
      const g = p.operatorName ? `${p.processName} (${p.operatorName})` : p.processName;
      if (!processOps.includes(g)) processOps.push(g);
    });

    const processStats = processOps.map(g => {
      const rows = processes.filter(p => {
        const pg = p.operatorName ? `${p.processName} (${p.operatorName})` : p.processName;
        return pg === g;
      });
      const len = rows.length || 1;
      return {
        name: g,
        Capacity: Math.round(rows.reduce((s, r) => s + r.capacity, 0) / len),
        ActualOutput: Math.round(rows.reduce((s, r) => s + r.actualOutput, 0) / len),
        Target100: Math.round(rows.reduce((s, r) => s + r.target100, 0) / len),
      };
    });

    // Top processes for line chart (say top 15 by Target or Capacity)
    // Based on requirements, showing all now, in original sequence
    const topProcesses = processStats;

    const target1 = processes.length > 0 ? processes[0].todayPlanLcTarget : 0;
    const target2 = processes.length > 0 ? processes[0].lineTarget100 : 0;

    return { processStats, topProcesses, target1, target2 };
  }, [processes]);

  if (processes.length === 0) return <div className="p-8 text-center text-gray-500">No data found matching current filters.</div>;

  return (
    <div className="space-y-6">
      <ChartContainer title="Capacity vs Actual Output by Process" icon={<PieChart className="h-5 w-5 text-indigo-600" />}>
        <div className="overflow-x-auto w-full pb-4 scrollable-chart-area flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div className="scrollable-chart-inner" style={{ width: isFullscreen ? '100%' : `${Math.max(1200, processStats.length * 60)}px`, height: isFullscreen ? 'auto' : '600px', minHeight: isFullscreen ? `${Math.max(processStats.length * 30, 800)}px` : undefined }}>
             <ResponsiveContainer width="100%" height={isFullscreen ? Math.max(processStats.length * 30, 800) : "100%"} minHeight={isFullscreen ? Math.max(processStats.length * 30, 800) : 600} key={isFullscreen ? 'fs-scroll-engine' : 'normal-view'}>
               <BarChart layout={isFullscreen ? "vertical" : "horizontal"} data={processStats} margin={{ top: 30, right: 30, left: isFullscreen ? 150 : 20, bottom: isFullscreen ? 20 : 220 }} barCategoryGap="1%">
                 <CartesianGrid strokeDasharray="3 3" vertical={!isFullscreen} horizontal={isFullscreen} stroke="#E5E7EB" />
                 {isFullscreen ? (
                   <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 9, fill: '#4B5563' }} />
                 ) : (
                   <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4B5563' }} interval={0} angle={-45} textAnchor="end" height={150}/>
                 )}
                 {isFullscreen ? (
                   <XAxis type="number" domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Math.max(m, target1, target2) * 1.2); }]} tick={{ fontSize: 11 }} />
                 ) : (
                   <YAxis type="number" domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Math.max(m, target1, target2) * 1.2); }]} tick={{ fontSize: 11 }} />
                 )}
                 <Tooltip isAnimationActive={false} />
                 <Legend verticalAlign="top" height={isFullscreen ? 50 : 150} />
                 
                 {target1 > 0 && isFullscreen ? (
                   <ReferenceLine x={target1} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={2} ifOverflow="extendDomain" label={{ position: 'insideTopLeft', value: `LC Target: ${target1}`, fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} />
                 ) : target1 > 0 ? (
                   <ReferenceLine y={target1} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={2} ifOverflow="extendDomain" label={{ position: 'top', value: `LC Target: ${target1}`, fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} />
                 ) : null}
                 {target2 > 0 && isFullscreen ? (
                   <ReferenceLine x={target2} stroke="#047857" strokeWidth={2} ifOverflow="extendDomain" label={{ position: 'insideTopRight', value: `100% Target: ${target2}`, fill: '#047857', fontSize: 11, fontWeight: 'bold' }} />
                 ) : target2 > 0 ? (
                   <ReferenceLine y={target2} stroke="#047857" strokeWidth={2} ifOverflow="extendDomain" label={{ position: 'top', value: `100% Target: ${target2}`, fill: '#047857', fontSize: 11, fontWeight: 'bold' }} />
                 ) : null}

                 <Bar isAnimationActive={false} dataKey="Capacity" fill="#10b981" name="Capacity" minPointSize={2}>
                   <LabelList dataKey="Capacity" position={isFullscreen ? "right" : "top"} fill="#111827" fontSize={11} fontWeight="bold" angle={isFullscreen ? 0 : -55} offset={10} formatter={(v: number) => v > 0 ? String(v) : ''} />
                 </Bar>
                 <Bar isAnimationActive={false} dataKey="ActualOutput" fill="#ef4444" name="Output" minPointSize={2}>
                   <LabelList dataKey="ActualOutput" position={isFullscreen ? "right" : "top"} fill="#111827" fontSize={11} fontWeight="bold" angle={isFullscreen ? 0 : -55} offset={10} formatter={(v: number) => v > 0 ? String(v) : ''} />
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </ChartContainer>

      <ChartContainer title="100% Target vs Capacity (Top Processes)" icon={<ArrowUpRight className="h-5 w-5 text-emerald-600" />}>
        <div className="overflow-x-auto w-full pb-4 scrollable-chart-area flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div className="scrollable-chart-inner" style={{ width: isFullscreen ? '100%' : `${Math.max(1200, topProcesses.length * 60)}px`, height: isFullscreen ? 'auto' : '600px', minHeight: isFullscreen ? `${Math.max(topProcesses.length * 30, 800)}px` : undefined }}>
             <ResponsiveContainer width="100%" height={isFullscreen ? Math.max(topProcesses.length * 30, 800) : "100%"} minHeight={isFullscreen ? Math.max(topProcesses.length * 30, 800) : 600} key={isFullscreen ? 'fs-scroll-engine' : 'normal-view'}>
               <LineChart layout={isFullscreen ? "vertical" : "horizontal"} data={topProcesses} margin={{ top: 30, right: 30, left: isFullscreen ? 150 : 20, bottom: isFullscreen ? 20 : 220 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={!isFullscreen} horizontal={isFullscreen} stroke="#E5E7EB" />
                 {isFullscreen ? (
                   <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 9, fill: '#4B5563' }} />
                 ) : (
                   <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4B5563' }} interval={0} angle={-45} textAnchor="end" height={150}/>
                 )}
                 {isFullscreen ? (
                   <XAxis type="number" tick={{ fontSize: 11 }}  domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Number(m) * 1.2); }]} />
                 ) : (
                   <YAxis type="number" tick={{ fontSize: 11 }}  domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Number(m) * 1.2); }]} />
                 )}
                 <Tooltip isAnimationActive={false} />
                 <Legend verticalAlign="top" height={isFullscreen ? 50 : 150} />
                 <Line isAnimationActive={false} type="monotone" dataKey="Target100" name="100% Target" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }}>
                   <LabelList dataKey="Target100" position={isFullscreen ? "right" : "top"} fill="#6366f1" fontSize={11} fontWeight="bold" angle={isFullscreen ? 0 : -55} offset={10} />
                 </Line>
                 <Line isAnimationActive={false} type="monotone" dataKey="Capacity" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }}>
                   <LabelList dataKey="Capacity" position={isFullscreen ? "right" : "bottom"} fill="#10b981" fontSize={11} fontWeight="bold" angle={isFullscreen ? 0 : -55} offset={10} />
                 </Line>
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </ChartContainer>
    </div>
  );
}
