import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { Activity, Cpu, TrendingUp } from 'lucide-react';

export default function ProcessAnalysis({ processes }: { processes: ProcessRow[] }) {
  const { capacityData, compareData, targetData } = useMemo(() => {
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
        Target: Math.round(pRows.reduce((s, x) => s + x.target100, 0)),
        Capacity: Math.round(pRows.reduce((s, x) => s + x.capacity, 0)),
      };
    });

    return { capacityData, compareData, targetData };
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
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-blue-600" />
          Capacity per Operator per Process
        </h2>
        <div className="overflow-x-auto w-full pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div style={{ width: `${Math.max(800, capacityData.length * 100)}px`, height: '400px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={capacityData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} interval={0} angle={-45} textAnchor="end" height={80}/>
                 <YAxis tick={{ fontSize: 11 }} />
                 <Tooltip />
                 <Legend verticalAlign="top" height={36} />
                 {capKeys.map((k, i) => (
                   <Bar key={k} dataKey={k} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]} maxBarSize={50}>
                     <LabelList dataKey={k} position="top" fill="#374151" fontSize={11} fontWeight={600} formatter={(val: number) => val > 0 ? Math.round(val) : ''} />
                   </Bar>
                 ))}
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-600" />
          Capacity vs Actual Output (Process x Operator)
        </h2>
        <div className="overflow-x-auto w-full pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div style={{ width: `${Math.max(800, compareData.length * 100)}px`, height: '400px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={compareData} margin={{ top: 20, right: 30, left: 20, bottom: 90 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} interval={0} angle={-45} textAnchor="end" height={90}/>
                 <YAxis tick={{ fontSize: 11 }} />
                 <Tooltip />
                 <Legend verticalAlign="top" height={36} />
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
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-amber-500" />
          100% Target vs Capacity (Line Chart)
        </h2>
        <div className="overflow-x-auto w-full pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div style={{ width: `${Math.max(800, targetData.length * 100)}px`, height: '400px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={targetData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} interval={0} angle={-45} textAnchor="end" height={80}/>
                 <YAxis tick={{ fontSize: 11 }} />
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
      </div>
    </div>
  );
}
