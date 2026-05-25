import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Layers } from 'lucide-react';
import ChartContainer from './ChartContainer';

export default function YamazumiChart({ processes }: { processes: ProcessRow[] }) {
  const chartData = useMemo(() => {
    // A Yamazumi chart maps out cycle times or process steps.
    // Grouping by Process (Operator) combination to sum up VA, NVAN, NVA.
    const map = new Map<string, any>();
    
    // Ordered unique processes
    const orderedKeys: string[] = [];

    processes.forEach(p => {
      const key = p.operatorName ? `${p.processName} (${p.operatorName})` : p.processName;
      if (!map.has(key)) {
        map.set(key, { name: key, va: 0, nvan: 0, nva: 0, total: 0 });
        orderedKeys.push(key);
      }
      const existing = map.get(key);
      existing.va += p.va || 0;
      existing.nvan += p.nvan || 0;
      existing.nva += p.nva || 0;
      existing.total += (p.va || 0) + (p.nvan || 0) + (p.nva || 0);
    });

    return orderedKeys.map(k => map.get(k));
  }, [processes]);

  if (processes.length === 0) return <div className="p-8 text-center text-gray-500">No data found matching current filters.</div>;

  return (
    <div className="h-full">
      <ChartContainer 
        title="Yamazumi Chart" 
        icon={<Layers className="h-5 w-5 text-indigo-600" />}
      >
        <div className="mb-2">
          <p className="text-sm text-gray-500 mt-1">Shows Value-Added (VA), Non-Value-Added but Necessary (NVAN), and Waste (NVA) breakdown.</p>
        </div>
        <div className="overflow-x-auto w-full pb-4 scrollable-chart-area flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="scrollable-chart-inner" style={{ width: `${Math.max(1200, chartData.length * 60)}px`, height: '600px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 30, right: 30, left: 20, bottom: 220 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  angle={-90} 
                  textAnchor="end" 
                  tick={{ fontSize: 11, fill: '#4B5563' }} 
                  interval={0}
                  height={280}
                />
              <YAxis 
                tick={{ fontSize: 11 }}
                label={{ value: 'Time (Sec/Min)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#4B5563', fontSize: 12 } }} 
              />
              <Tooltip isAnimationActive={false} 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />

              <Bar isAnimationActive={false} dataKey="va" stackId="a" fill="#10B981" name="Value-Added (VA)" maxBarSize={50} />
              <Bar isAnimationActive={false} dataKey="nvan" stackId="a" fill="#F59E0B" name="Non-Value-Added Necessary (NVAN)" maxBarSize={50} />
              <Bar isAnimationActive={false} dataKey="nva" stackId="a" fill="#EF4444" name="Waste (NVA)" maxBarSize={50}>
                 <LabelList 
                   dataKey="total" 
                   position="top" 
                   fill="#111827" 
                   fontSize={11} 
                   fontWeight="bold" 
                   formatter={(v: number) => v > 0 ? String(Math.round(v)) : ''}
                   offset={15} 
                   angle={-90}
                 />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      </ChartContainer>
    </div>
  );
}
