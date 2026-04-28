import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, ReferenceLine } from 'recharts';
import { PieChart, ArrowUpRight } from 'lucide-react';
import ChartContainer from './ChartContainer';

export default function Analytics({ processes }: { processes: ProcessRow[] }) {
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
      return {
        name: g,
        Capacity: rows.reduce((s, r) => s + r.capacity, 0),
        ActualOutput: rows.reduce((s, r) => s + r.actualOutput, 0),
        Target100: rows.reduce((s, r) => s + r.target100, 0),
      };
    });

    // Top processes for line chart (say top 15 by Target or Capacity)
    const topProcesses = [...processStats].sort((a, b) => b.Target100 - a.Target100).slice(0, 15);

    const target1 = processes.length > 0 ? processes[0].todayPlanLcTarget : 0;
    const target2 = processes.length > 0 ? processes[0].lineTarget100 : 0;

    return { processStats, topProcesses, target1, target2 };
  }, [processes]);

  if (processes.length === 0) return <div className="p-8 text-center text-gray-500">No data found matching current filters.</div>;

  return (
    <div className="space-y-6">
      <ChartContainer title="Capacity vs Actual Output by Process" icon={<PieChart className="h-5 w-5 text-indigo-600" />}>
        <div className="overflow-x-auto w-full pb-4 scrollable-chart-area flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div className="scrollable-chart-inner" style={{ width: `${Math.max(800, processStats.length * 100)}px`, height: '400px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={processStats} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} interval={0} angle={-90} textAnchor="end" height={160}/>
                 <YAxis domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Math.max(m, target1, target2) * 1.2); }]} tick={{ fontSize: 11 }} />
                 <Tooltip />
                 <Legend verticalAlign="top" height={36} />
                 
                 {target1 > 0 && (
                   <ReferenceLine y={target1} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={2} ifOverflow="extendDomain" label={{ position: 'top', value: `LC Target: ${target1}`, fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} />
                 )}
                 {target2 > 0 && (
                   <ReferenceLine y={target2} stroke="#047857" strokeWidth={2} ifOverflow="extendDomain" label={{ position: 'top', value: `100% Target: ${target2}`, fill: '#047857', fontSize: 11, fontWeight: 'bold' }} />
                 )}

                 <Bar dataKey="Capacity" fill="#10b981" name="Capacity" maxBarSize={40}>
                   <LabelList dataKey="Capacity" position="top" fill="#111827" fontSize={11} fontWeight="bold" angle={-90} offset={15} formatter={(v: number) => v > 0 ? v : ''} />
                 </Bar>
                 <Bar dataKey="ActualOutput" fill="#ef4444" name="Output" maxBarSize={40}>
                   <LabelList dataKey="ActualOutput" position="top" fill="#111827" fontSize={11} fontWeight="bold" angle={-90} offset={15} formatter={(v: number) => v > 0 ? v : ''} />
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </ChartContainer>

      <ChartContainer title="100% Target vs Capacity (Top Processes)" icon={<ArrowUpRight className="h-5 w-5 text-emerald-600" />}>
        <div className="overflow-x-auto w-full pb-4 scrollable-chart-area flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div className="scrollable-chart-inner" style={{ width: `${Math.max(800, topProcesses.length * 100)}px`, height: '400px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={topProcesses} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} interval={0} angle={-90} textAnchor="end" height={160}/>
                 <YAxis tick={{ fontSize: 11 }} />
                 <Tooltip />
                 <Legend verticalAlign="top" height={36} />
                 <Line type="monotone" dataKey="Target100" name="100% Target" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }}>
                   <LabelList dataKey="Target100" position="top" fill="#6366f1" fontSize={11} fontWeight="bold" angle={-90} offset={15} />
                 </Line>
                 <Line type="monotone" dataKey="Capacity" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }}>
                   <LabelList dataKey="Capacity" position="bottom" fill="#10b981" fontSize={11} fontWeight="bold" angle={-90} offset={15} />
                 </Line>
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </ChartContainer>
    </div>
  );
}
