import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { PieChart, ArrowUpRight } from 'lucide-react';

export default function Analytics({ processes }: { processes: ProcessRow[] }) {
  const { processStats, topProcesses } = useMemo(() => {
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

    return { processStats, topProcesses };
  }, [processes]);

  if (processes.length === 0) return <div className="p-8 text-center text-gray-500">No data found matching current filters.</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-indigo-600" />
          Capacity vs Actual Output by Process
        </h2>
        <div className="overflow-x-auto w-full pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div style={{ width: `${Math.max(800, processStats.length * 100)}px`, height: '400px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={processStats} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} interval={0} angle={-45} textAnchor="end" height={80}/>
                 <YAxis tick={{ fontSize: 11 }} />
                 <Tooltip />
                 <Legend verticalAlign="top" height={36} />
                 <Bar dataKey="Capacity" fill="#10b981" name="Capacity" maxBarSize={40}>
                   <LabelList dataKey="Capacity" position="top" fill="#374151" fontSize={11} fontWeight={600} formatter={(v: number) => v > 0 ? v : ''} />
                 </Bar>
                 <Bar dataKey="ActualOutput" fill="#ef4444" name="Output" maxBarSize={40}>
                   <LabelList dataKey="ActualOutput" position="top" fill="#374151" fontSize={11} fontWeight={600} formatter={(v: number) => v > 0 ? v : ''} />
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5 text-emerald-600" />
          100% Target vs Capacity (Top Processes)
        </h2>
        <div className="overflow-x-auto w-full pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div style={{ width: `${Math.max(800, topProcesses.length * 100)}px`, height: '400px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={topProcesses} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} interval={0} angle={-45} textAnchor="end" height={80}/>
                 <YAxis tick={{ fontSize: 11 }} />
                 <Tooltip />
                 <Legend verticalAlign="top" height={36} />
                 <Line type="monotone" dataKey="Target100" name="100% Target" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }}>
                   <LabelList dataKey="Target100" position="top" fill="#6366f1" fontSize={11} fontWeight={600} />
                 </Line>
                 <Line type="monotone" dataKey="Capacity" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }}>
                   <LabelList dataKey="Capacity" position="bottom" fill="#10b981" fontSize={11} fontWeight={600} />
                 </Line>
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}
