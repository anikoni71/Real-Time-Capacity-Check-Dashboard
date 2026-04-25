import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Sparkles, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';

export default function Performers({ processes }: { processes: ProcessRow[] }) {
  const { topProc, lowProc, topOp, lowOp } = useMemo(() => {
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

    return { topProc, lowProc, topOp, lowOp };
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
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#4B5563' }} width={90} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
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
