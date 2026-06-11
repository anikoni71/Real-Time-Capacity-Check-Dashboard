import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { FullscreenResponsiveContainer as ResponsiveContainer } from './FullscreenResponsiveContainer';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, Cell, ReferenceLine, ReferenceArea } from 'recharts';
import { Activity, Cpu, TrendingUp } from 'lucide-react';
import ChartContainer from './ChartContainer';
import { useFullscreenContext } from '../contexts/FullscreenContext';
import { CustomizedAxisTick } from './CustomizedAxisTick';

export default function ProcessAnalysis({ processes }: { processes: ProcessRow[] }) {
  const isFullscreen = useFullscreenContext();
  const { capacityData, compareData, targetData, target1, target2 } = useMemo(() => {
    const processOps: string[] = [];
    processes.forEach(p => {
      const g = p.operatorName ? `${p.processName} (${p.operatorName})` : p.processName;
      if (!processOps.includes(g)) processOps.push(g);
    });

    const capacityData = processOps.map(g => {
      const row: any = { name: g };
      const pRows = processes.filter(p => {
        const pg = p.operatorName ? `${p.processName} (${p.operatorName})` : p.processName;
        return pg === g;
      });
      pRows.forEach(p => {
        if (p.operatorName) {
           row[`${p.operatorName} Cap`] = (row[`${p.operatorName} Cap`] || 0) + p.capacity;
        }
      });
      const len = pRows.length || 1;
      Object.keys(row).forEach(k => {
        if (k !== 'name') {
           row[k] = Math.round(row[k] / len);
        }
      });
      return row;
    });
    
    // Compare each operator's capacity vs actual output (Can group by process + operator)
    const compareData = processOps.map(g => {
      const pRows = processes.filter(p => {
        const pg = p.operatorName ? `${p.processName} (${p.operatorName})` : p.processName;
        return pg === g;
      });
      const len = pRows.length || 1;
      return {
         name: g,
         Capacity: Math.round(pRows.reduce((acc, curr) => acc + curr.capacity, 0) / len),
         Output: Math.round(pRows.reduce((acc, curr) => acc + curr.actualOutput, 0) / len)
      };
    });

    // 100% Target vs Capacity per process
    const targetData = processOps.map(g => {
      const pRows = processes.filter(p => {
        const pg = p.operatorName ? `${p.processName} (${p.operatorName})` : p.processName;
        return pg === g;
      });
      const len = pRows.length || 1;
      return {
        name: g,
        Target: Math.round(pRows.reduce((s, x) => s + x.target100, 0) / len),
        Capacity: Math.round(pRows.reduce((s, x) => s + x.capacity, 0) / len),
      };
    });
    
    const target1 = processes.length > 0 ? processes[0].todayPlanLcTarget : 0;
    const target2 = processes.length > 0 ? processes[0].lineTarget100 : 0;

    return { capacityData, compareData, targetData, target1, target2 };
  }, [processes]);

  if (processes.length === 0) return <div className="p-8 text-center text-gray-500">No data found matching current filters.</div>;

  const getColsFromData = (data: any[], filterStr: string) => {
    const cols = new Set<string>();
    data.forEach(d => {
      Object.keys(d).forEach(k => {
        if (k !== 'name' && k.includes(filterStr)) cols.add(k);
      });
    });
    return Array.from(cols);
  };

  const capKeys = getColsFromData(capacityData, 'Cap');

  return (
    <div className="space-y-6">
      <ChartContainer title="Capacity per Operator per Process" icon={<Cpu className="h-5 w-5 text-blue-600" />}>
        <div className="overflow-x-auto w-full pb-4 scrollable-chart-area flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div className="scrollable-chart-inner" style={{ width: isFullscreen ? '100%' : `${Math.max(1200, capacityData.length * 60)}px`, height: isFullscreen ? 'auto' : '650px', minHeight: isFullscreen ? `${Math.max(capacityData.length * 30, 800)}px` : undefined, overflow: 'visible' }}>
             <ResponsiveContainer width="100%" height={isFullscreen ? Math.max(capacityData.length * 30, 800) : "100%"} minHeight={isFullscreen ? Math.max(capacityData.length * 30, 800) : 650} key={isFullscreen ? 'fs-scroll-engine' : 'normal-view'}>
               <BarChart layout={isFullscreen ? "vertical" : "horizontal"} data={capacityData} margin={{ top: 20, right: 30, left: isFullscreen ? 150 : 20, bottom: isFullscreen ? 20 : 250 }} barCategoryGap="1%">
                 <CartesianGrid strokeDasharray="3 3" vertical={!isFullscreen} horizontal={isFullscreen} stroke="#E5E7EB" />
                 {isFullscreen ? (
                   <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 9, fill: '#4B5563' }} />
                 ) : (
                   <XAxis dataKey="name" tick={<CustomizedAxisTick />} interval={0} height={250}/>
                 )}
                 {isFullscreen ? (
                   <XAxis type="number" domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Math.max(m, target1, target2) * 1.2); }]} tick={{ fontSize: 11 }} />
                 ) : (
                   <YAxis type="number" domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Math.max(m, target1, target2) * 1.2); }]} tick={{ fontSize: 11 }} />
                 )}
                 <Tooltip isAnimationActive={false} />
                 <Legend verticalAlign="top" height={isFullscreen ? 50 : 150} />
                 
                 {target1 > 0 && capacityData.map((entry, idx) => {
                    const totalCap = capKeys.reduce((sum, key) => sum + (entry[key] || 0), 0);
                    if (totalCap > 0 && totalCap <= target1 * 0.9) {
                       return (
                         <React.Fragment key={`bg-cap-${idx}`}>
                           {isFullscreen ? (
                             <ReferenceArea {...{y1: entry.name, y2: entry.name, fill: "#fee2e2", fillOpacity: 0.5} as any} />
                           ) : (
                             <ReferenceArea {...{x1: entry.name, x2: entry.name, fill: "#fee2e2", fillOpacity: 0.5} as any} />
                           )}
                         </React.Fragment>
                       );
                    }
                    return null;
                 })}

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

                 {capKeys.map((k, i) => (
                   <Bar isAnimationActive={false} key={k} dataKey={k} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]} minPointSize={2}>
                     <LabelList dataKey={k} position={isFullscreen ? "right" : "top"} fill="#111827" fontSize={11} fontWeight="bold" angle={isFullscreen ? 0 : -55} offset={10} formatter={(val: number) => val > 0 ? String(Math.round(val)) : ''} />
                   </Bar>
                 ))}
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </ChartContainer>

      <ChartContainer title="Capacity vs Actual Output (Process x Operator)" icon={<Activity className="h-5 w-5 text-indigo-600" />}>
        <div className="overflow-x-auto w-full pb-4 scrollable-chart-area flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div className="scrollable-chart-inner" style={{ width: isFullscreen ? '100%' : `${Math.max(1200, compareData.length * 60)}px`, height: isFullscreen ? 'auto' : '650px', minHeight: isFullscreen ? `${Math.max(compareData.length * 30, 800)}px` : undefined, overflow: 'visible' }}>
             <ResponsiveContainer width="100%" height={isFullscreen ? Math.max(compareData.length * 30, 800) : "100%"} minHeight={isFullscreen ? Math.max(compareData.length * 30, 800) : 650} key={isFullscreen ? 'fs-scroll-engine' : 'normal-view'}>
               <BarChart layout={isFullscreen ? "vertical" : "horizontal"} data={compareData} margin={{ top: 20, right: 30, left: isFullscreen ? 150 : 20, bottom: isFullscreen ? 20 : 250 }} barCategoryGap="1%">
                 <CartesianGrid strokeDasharray="3 3" vertical={!isFullscreen} horizontal={isFullscreen} stroke="#E5E7EB" />
                 {isFullscreen ? (
                   <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 9, fill: '#4B5563' }} />
                 ) : (
                   <XAxis dataKey="name" tick={<CustomizedAxisTick />} interval={0} height={250}/>
                 )}
                 {isFullscreen ? (
                   <XAxis type="number" domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Math.max(m, target1, target2) * 1.2); }]} tick={{ fontSize: 11 }} />
                 ) : (
                   <YAxis type="number" domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Math.max(m, target1, target2) * 1.2); }]} tick={{ fontSize: 11 }} />
                 )}
                 <Tooltip isAnimationActive={false} />
                 <Legend verticalAlign="top" height={isFullscreen ? 50 : 150} />
                 
                 {target1 > 0 && compareData.map((entry, idx) => {
                    if (entry.Capacity <= target1 * 0.9) {
                       return (
                         <React.Fragment key={`bg-comp-${idx}`}>
                           {isFullscreen ? (
                             <ReferenceArea {...{y1: entry.name, y2: entry.name, fill: "#fee2e2", fillOpacity: 0.5} as any} />
                           ) : (
                             <ReferenceArea {...{x1: entry.name, x2: entry.name, fill: "#fee2e2", fillOpacity: 0.5} as any} />
                           )}
                         </React.Fragment>
                       );
                    }
                    return null;
                 })}

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

                 <Bar isAnimationActive={false} dataKey="Capacity" fill="#8b5cf6" minPointSize={2}>
                   <LabelList dataKey="Capacity" position={isFullscreen ? "right" : "top"} fill="#111827" fontSize={11} fontWeight="bold" angle={isFullscreen ? 0 : -55} offset={10} formatter={(v: number) => v > 0 ? String(v) : ''} />
                 </Bar>
                 <Bar isAnimationActive={false} dataKey="Output" fill="#ec4899" minPointSize={2}>
                   <LabelList dataKey="Output" position={isFullscreen ? "right" : "top"} fill="#111827" fontSize={11} fontWeight="bold" angle={isFullscreen ? 0 : -55} offset={10} formatter={(v: number) => v > 0 ? String(v) : ''} />
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </ChartContainer>

      <ChartContainer title="100% Process Target vs Capacity (Line Chart)" icon={<TrendingUp className="h-5 w-5 text-amber-500" />}>
        <div className="overflow-x-auto w-full pb-4 scrollable-chart-area flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div className="scrollable-chart-inner" style={{ width: isFullscreen ? '100%' : `${Math.max(1200, targetData.length * 60)}px`, height: isFullscreen ? 'auto' : '650px', minHeight: isFullscreen ? `${Math.max(targetData.length * 30, 800)}px` : undefined, overflow: 'visible' }}>
             <ResponsiveContainer width="100%" height={isFullscreen ? Math.max(targetData.length * 30, 800) : "100%"} minHeight={isFullscreen ? Math.max(targetData.length * 30, 800) : 650} key={isFullscreen ? 'fs-scroll-engine' : 'normal-view'}>
               <LineChart layout={isFullscreen ? "vertical" : "horizontal"} data={targetData} margin={{ top: 20, right: 30, left: isFullscreen ? 150 : 20, bottom: isFullscreen ? 20 : 250 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={!isFullscreen} horizontal={isFullscreen} stroke="#E5E7EB" />
                 {isFullscreen ? (
                   <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 9, fill: '#4B5563' }} />
                 ) : (
                   <XAxis dataKey="name" tick={<CustomizedAxisTick />} interval={0} height={250}/>
                 )}
                 {isFullscreen ? (
                   <XAxis type="number" domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Math.max(m, target1, target2) * 1.2); }]} tick={{ fontSize: 11 }} />
                 ) : (
                   <YAxis type="number" domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Math.max(m, target1, target2) * 1.2); }]} tick={{ fontSize: 11 }} />
                 )}
                 <Tooltip isAnimationActive={false} />
                 <Legend verticalAlign="top" height={isFullscreen ? 50 : 150} />
                 
                 {target1 > 0 && targetData.map((entry, idx) => {
                    if (entry.Capacity <= target1 * 0.9) {
                       return (
                         <React.Fragment key={`bg-tgt-${idx}`}>
                           {isFullscreen ? (
                             <ReferenceArea {...{y1: entry.name, y2: entry.name, fill: "#fee2e2", fillOpacity: 0.5} as any} />
                           ) : (
                             <ReferenceArea {...{x1: entry.name, x2: entry.name, fill: "#fee2e2", fillOpacity: 0.5} as any} />
                           )}
                         </React.Fragment>
                       );
                    }
                    return null;
                 })}
                 
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

                 <Line isAnimationActive={false} type="monotone" dataKey="Target" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }}>
                   <LabelList dataKey="Target" position={isFullscreen ? "right" : "top"} fill="#f59e0b" fontSize={11} fontWeight="bold" angle={isFullscreen ? 0 : -55} offset={10} />
                 </Line>
                 <Line isAnimationActive={false} type="monotone" dataKey="Capacity" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }}>
                   <LabelList dataKey="Capacity" position={isFullscreen ? "right" : "bottom"} fill="#3b82f6" fontSize={11} fontWeight="bold" angle={isFullscreen ? 0 : -55} offset={10} />
                 </Line>
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </ChartContainer>
    </div>
  );
}
