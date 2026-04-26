import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, ReferenceLine } from 'recharts';
import { Sparkles, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';

export default function Performers({ processes }: { processes: ProcessRow[] }) {
  const { topProc, lowProc, topOp, lowOp, target1, target2 } = useMemo(() => {
    // Aggregate by process
    const procMap = new Map<string, number>();
    const opMap = new Map<string, number>();

    processes.forEach(p => {
      if (p.processName) {
        procMap.set(p.processName, (procMap.get(p.processName) || 0) + p.capacity);
      }
      if (p.operatorName) {
        opMap.set(p.operatorName, (opMap.get(p.operatorName) || 0) + p.capacity);
      }
    });

    const procList = Array.from(procMap.entries()).map(([name, cap]) => ({ name, Capacity: cap }));
    const opList = Array.from(opMap.entries()).map(([name, cap]) => ({ name, Capacity: cap }));

    const sortedProc = [...procList].sort((a, b) => b.Capacity - a.Capacity);
    const sortedOp = [...opList].sort((a, b) => b.Capacity - a.Capacity);

    // Get top 5 and low 5
    const topProc = sortedProc.slice(0, 5);
    const lowProc = sortedProc.slice().reverse().slice(0, 5);
    
    const topOp = sortedOp.slice(0, 5);
    const lowOp = sortedOp.slice().reverse().slice(0, 5);
    
    const target1 = processes.length > 0 ? processes[0].todayPlanLcTarget : 0;
    const target2 = processes.length > 0 ? processes[0].lineTarget100 : 0;

    return { topProc, lowProc, topOp, lowOp, target1, target2 };
  }, [processes]);

  if (processes.length === 0) return <div className="p-8 text-center text-gray-500">No data found matching current filters.</div>;

  const renderHorizontalChart = (data: any[], title: string, color: string, IconComponents: any) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
      <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
        {IconComponents}
        {title}
      </h3>
      <div className="flex-1 w-full" style={{ minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
            <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, (max) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Math.max(m, target1, target2) * 1.2); }]} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#4B5563' }} width={90} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            
            {target1 > 0 && (
              <ReferenceLine 
                x={target1} 
                stroke="#ef4444" 
                strokeDasharray="3 3" 
                strokeWidth={2}
                ifOverflow="extendDomain"
                label={{ position: 'insideTopLeft', value: `LC Target: ${target1}`, fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} 
              />
            )}
            
            {target2 > 0 && (
              <ReferenceLine 
                x={target2} 
                stroke="#047857" 
                strokeWidth={2}
                ifOverflow="extendDomain"
                label={{ position: 'insideTopRight', value: `100% Target: ${target2}`, fill: '#047857', fontSize: 11, fontWeight: 'bold' }} 
              />
            )}

            <Bar dataKey="Capacity" fill={color} radius={[0, 4, 4, 0]} maxBarSize={30}>
              <LabelList dataKey="Capacity" position="right" fill="#374151" fontSize={11} fontWeight={600} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {renderHorizontalChart(topProc, 'Top Performing Processes', '#10b981', <><ArrowUp className="h-4 w-4 text-emerald-500" /><Sparkles className="h-4 w-4 text-emerald-500" /></>)}
      {renderHorizontalChart(lowProc, 'Lowest Performing Processes', '#ef4444', <><ArrowDown className="h-4 w-4 text-rose-500" /><AlertCircle className="h-4 w-4 text-rose-500" /></>)}
      {renderHorizontalChart(topOp, 'Top Performing Operators', '#3b82f6', <><ArrowUp className="h-4 w-4 text-blue-500" /><Sparkles className="h-4 w-4 text-blue-500" /></>)}
      {renderHorizontalChart(lowOp, 'Lowest Performing Operators', '#f59e0b', <><ArrowDown className="h-4 w-4 text-orange-500" /><AlertCircle className="h-4 w-4 text-orange-500" /></>)}
    </div>
  );
}
