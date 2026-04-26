import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { BarChart2 } from 'lucide-react';

// Define fixed colors for operators to keep them consistent
const OPERATOR_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
];

export default function CapacityProcess({ processes }: { processes: ProcessRow[] }) {
  const { chartData, ops, totalCapacity } = useMemo(() => {
    // Process chart needs original sequence exactly. 
    // We can group by Process Name but maintain order of appearance.
    
    // Ordered unique processes
    const processNames: string[] = [];
    const opsSet = new Set<string>();
    
    processes.forEach(p => {
      if (!processNames.includes(p.processName)) {
        processNames.push(p.processName);
      }
      if (p.operatorName) {
        opsSet.add(p.operatorName);
      }
    });

    const ops = Array.from(opsSet);
    let totalCapacity = 0;

    const chartData: any[] = [];

    processNames.forEach(proc => {
      const pRows = processes.filter(p => p.processName === proc);
      
      // We want to sum capacities per operator per process
      ops.forEach(op => {
        const cap = pRows.filter(p => p.operatorName === op).reduce((sum, p) => sum + p.capacity, 0);
        if (cap > 0) {
          chartData.push({
            name: `${proc} (${op})`,
            Capacity: Math.round(cap),
            operatorName: op
          });
          totalCapacity += Math.round(cap);
        }
      });
    });

    return { chartData, ops, totalCapacity };
  }, [processes]);

  if (processes.length === 0) return <div className="p-8 text-center text-gray-500">No data found matching current filters.</div>;

  // Calculate width based on number of processes and max operators
  const expectedWidth = Math.max(800, chartData.length * 80);

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-blue-600" />
            Capacity by Process × Operator
          </h2>
          <p className="text-sm text-gray-500">Total Capacity visible: <span className="font-semibold text-gray-800">{totalCapacity}</span></p>
        </div>
        <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">Scroll horizontally to view all</div>
      </div>
      
      <div className="overflow-x-auto w-full border border-gray-100 rounded-md pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div style={{ width: `${expectedWidth}px`, height: '500px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 30, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#4B5563' }} 
                interval={0} 
                angle={-45} 
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#4B5563' }} 
                label={{ value: 'Capacity', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280' } }}
              />
              <Tooltip 
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              {/* A fake Legend to show operators */}
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle" 
                wrapperStyle={{ fontSize: '13px' }}
                payload={ops.map((op, i) => ({
                  id: op,
                  type: 'circle',
                  value: `Operator ${op}`,
                  color: OPERATOR_COLORS[i % OPERATOR_COLORS.length]
                }))}
              />
              <Bar dataKey="Capacity" maxBarSize={60}>
                {chartData.map((entry, index) => {
                  const opIndex = ops.indexOf(entry.operatorName);
                  return <Cell key={`cell-${index}`} fill={OPERATOR_COLORS[opIndex % OPERATOR_COLORS.length]} />;
                })}
                <LabelList 
                  dataKey="Capacity" 
                  position="top" 
                  fill="#374151" 
                  fontSize={11} 
                  fontWeight={600}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
