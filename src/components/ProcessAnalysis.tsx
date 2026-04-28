import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell, ReferenceLine } from 'recharts';
import { Activity, Cpu, TrendingUp } from 'lucide-react';
import ChartContainer from './ChartContainer';

export default function ProcessAnalysis({ processes }: { processes: ProcessRow[] }) {
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
      return row;
    });
    
    // Compare each operator's capacity vs actual output (Can group by process + operator)
    const compareData = processOps.map(g => {
      const pRows = processes.filter(p => {
        const pg = p.operatorName ? `${p.processName} (${p.operatorName})` : p.processName;
        return pg === g;
      });
      return {
         name: g,
         Capacity: Math.round(pRows.reduce((acc, curr) => acc + curr.capacity, 0)),
         Output: Math.round(pRows.reduce((acc, curr) => acc + curr.actualOutput, 0))
      };
    });

    // 100% Target vs Capacity per process
    const targetData = processOps.map(g => {
      const pRows = processes.filter(p => {
        const pg = p.operatorName ? `${p.processName} (${p.operatorName})` : p.processName;
        return pg === g;
      });
      return {
        name: g,
        Target: Math.round(pRows[0]?.target100 || 0),
        Capacity: Math.round(pRows.reduce((s, x) => s + x.capacity, 0)),
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
           <div className="scrollable-chart-inner" style={{ width: `${Math.max(800, capacityData.length * 100)}px`, height: '400px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={capacityData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} interval={0} angle={-45} textAnchor="end" height={160}/>
                 <YAxis domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Math.max(m, target1, target2) * 1.2); }]} tick={{ fontSize: 11 }} />
                 <Tooltip />
                 <Legend verticalAlign="top" height={36} />
                 
                 {target1 > 0 && (
                   <ReferenceLine y={target1} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={2} ifOverflow="extendDomain" label={{ position: 'top', value: `LC Target: ${target1}`, fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} />
                 )}
                 {target2 > 0 && (
                   <ReferenceLine y={target2} stroke="#047857" strokeWidth={2} ifOverflow="extendDomain" label={{ position: 'top', value: `100% Target: ${target2}`, fill: '#047857', fontSize: 11, fontWeight: 'bold' }} />
                 )}

                 {capKeys.map((k, i) => (
                   <Bar key={k} dataKey={k} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]} maxBarSize={50}>
                     <LabelList dataKey={k} position="top" fill="#374151" fontSize={11} fontWeight={600} formatter={(val: number) => val > 0 ? Math.round(val) : ''} />
                   </Bar>
                 ))}
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </ChartContainer>

      <ChartContainer title="Capacity vs Actual Output (Process x Operator)" icon={<Activity className="h-5 w-5 text-indigo-600" />}>
        <div className="overflow-x-auto w-full pb-4 scrollable-chart-area flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div className="scrollable-chart-inner" style={{ width: `${Math.max(800, compareData.length * 100)}px`, height: '400px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={compareData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} interval={0} angle={-45} textAnchor="end" height={160}/>
                 <YAxis domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Math.max(m, target1, target2) * 1.2); }]} tick={{ fontSize: 11 }} />
                 <Tooltip />
                 <Legend verticalAlign="top" height={36} />
                 
                 {target1 > 0 && (
                   <ReferenceLine y={target1} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={2} ifOverflow="extendDomain" label={{ position: 'top', value: `LC Target: ${target1}`, fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} />
                 )}
                 {target2 > 0 && (
                   <ReferenceLine y={target2} stroke="#047857" strokeWidth={2} ifOverflow="extendDomain" label={{ position: 'top', value: `100% Target: ${target2}`, fill: '#047857', fontSize: 11, fontWeight: 'bold' }} />
                 )}

                 <Bar dataKey="Capacity" fill="#8b5cf6" maxBarSize={40}>
                   <LabelList dataKey="Capacity" position="top" fill="#374151" fontSize={11} fontWeight={600} formatter={(v: number) => v > 0 ? v : ''} />
                 </Bar>
                 <Bar dataKey="Output" fill="#ec4899" maxBarSize={40}>
                   <LabelList dataKey="Output" position="top" fill="#374151" fontSize={11} fontWeight={600} formatter={(v: number) => v > 0 ? v : ''} />
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </ChartContainer>

      <ChartContainer title="100% Process Target vs Capacity (Line Chart)" icon={<TrendingUp className="h-5 w-5 text-amber-500" />}>
        <div className="overflow-x-auto w-full pb-4 scrollable-chart-area flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div className="scrollable-chart-inner" style={{ width: `${Math.max(800, targetData.length * 100)}px`, height: '400px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={targetData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} interval={0} angle={-45} textAnchor="end" height={160}/>
                 <YAxis domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Math.max(m, target1, target2) * 1.2); }]} tick={{ fontSize: 11 }} />
                 <Tooltip />
                 <Legend verticalAlign="top" height={36} />
                 <Line type="monotone" dataKey="Target" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }}>
                   <LabelList dataKey="Target" position="top" fill="#f59e0b" fontSize={11} fontWeight={600} />
                 </Line>
                 <Line type="monotone" dataKey="Capacity" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }}>
                   <LabelList dataKey="Capacity" position="bottom" fill="#3b82f6" fontSize={11} fontWeight={600} />
                 </Line>
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </ChartContainer>
    </div>
  );
}
