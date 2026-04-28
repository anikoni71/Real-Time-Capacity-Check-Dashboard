import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell, ReferenceLine } from 'recharts';
import { BarChart2 } from 'lucide-react';
import ChartContainer from './ChartContainer';

// Define fixed colors for operators to keep them consistent
const OPERATOR_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
];

export default function CapacityProcess({ processes }: { processes: ProcessRow[] }) {
  const { chartData, ops, totalCapacity, target1, target2, calculatedMax } = useMemo(() => {
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

    const target1 = processes.length > 0 ? processes[0].todayPlanLcTarget : 0;
    const target2 = processes.length > 0 ? processes[0].lineTarget100 : 0;
    
    // We compute max dynamically, ignoring NaNs from functions.
    let currentDataMax = 0;
    chartData.forEach(d => {
      if (d.Capacity > currentDataMax) currentDataMax = d.Capacity;
    });

    const calculatedMax = Math.round(Math.max(currentDataMax, target1, target2) * 1.2);

    return { chartData, ops, totalCapacity, target1, target2, calculatedMax };
  }, [processes]);

  if (processes.length === 0) return <div className="p-8 text-center text-gray-500">No data found matching current filters.</div>;

  // Calculate width based on number of processes and max operators
  const expectedWidth = Math.max(800, chartData.length * 80);

  return (
    <div className="lg:col-span-2 flex flex-col h-full">
      <ChartContainer 
        title="Capacity by Process × Operator" 
        icon={<BarChart2 className="h-5 w-5 text-blue-600" />}
      >
        <div className="mb-2 flex justify-between items-end">
          <p className="text-sm text-gray-500">Total Capacity visible: <span className="font-semibold text-gray-800">{totalCapacity}</span></p>
          <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">Scroll horizontally to view all</div>
        </div>
        
        <div className="overflow-x-auto w-full border border-gray-100 rounded-md pb-4 scrollable-chart-area flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="scrollable-chart-inner" style={{ width: `${expectedWidth}px`, height: '500px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#4B5563' }} 
                interval={0} 
                angle={-45} 
                textAnchor="end"
                height={160}
              />
              <YAxis 
                domain={[0, calculatedMax === 0 ? 'auto' : calculatedMax]}
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
              
              {target1 > 0 && (
                <ReferenceLine 
                  y={target1} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3" 
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                  label={{ position: 'top', value: `LC Target: ${target1}`, fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} 
                />
              )}
              {target2 > 0 && (
                <ReferenceLine 
                  y={target2} 
                  stroke="#047857" 
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                  label={{ position: 'top', value: `100% Target: ${target2}`, fill: '#047857', fontSize: 11, fontWeight: 'bold' }} 
                />
              )}

              <Bar dataKey="Capacity" maxBarSize={60}>
                {chartData.map((entry, index) => {
                  const opIndex = ops.indexOf(entry.operatorName);
                  return <Cell key={`cell-${index}`} fill={OPERATOR_COLORS[opIndex % OPERATOR_COLORS.length]} />;
                })}
                <LabelList 
                  dataKey="Capacity" 
                  position="top" 
                  fill="#111827" 
                  fontSize={11} 
                  fontWeight="bold"
                  angle={-90}
                  offset={15}
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
