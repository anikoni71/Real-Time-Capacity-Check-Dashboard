import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { FullscreenResponsiveContainer as ResponsiveContainer } from './FullscreenResponsiveContainer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, Cell, ReferenceLine, ReferenceArea } from 'recharts';
import { BarChart2 } from 'lucide-react';
import ChartContainer from './ChartContainer';
import { useFullscreenContext } from '../contexts/FullscreenContext';
import { CustomizedAxisTick } from './CustomizedAxisTick';

// Define fixed colors for operators to keep them consistent
const OPERATOR_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
];

export default function CapacityProcess({ processes }: { processes: ProcessRow[] }) {
  const isFullscreen = useFullscreenContext();
  const { chartData, ops, avgCapacity, target1, target2, calculatedMax } = useMemo(() => {
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
        const opRows = pRows.filter(p => p.operatorName === op);
        let cap = opRows.reduce((sum, p) => sum + p.capacity, 0);
        if (opRows.length > 0) cap = cap / opRows.length;
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

    const avgCapacity = chartData.length > 0 ? Math.round(chartData.reduce((sum, item) => sum + item.Capacity, 0) / chartData.length) : 0;

    const target1 = processes.length > 0 ? processes[0].todayPlanLcTarget : 0;
    const target2 = processes.length > 0 ? processes[0].lineTarget100 : 0;
    
    // We compute max dynamically, ignoring NaNs from functions.
    let currentDataMax = 0;
    chartData.forEach(d => {
      if (d.Capacity > currentDataMax) currentDataMax = d.Capacity;
    });

    const calculatedMax = Math.round(Math.max(currentDataMax, target1, target2) * 1.2);

    return { chartData, ops, avgCapacity, target1, target2, calculatedMax };
  }, [processes]);

  if (processes.length === 0) return <div className="p-8 text-center text-gray-500">No data found matching current filters.</div>;

  // Calculate width based on number of processes and max operators
  const expectedWidth = Math.max(1200, chartData.length * 60);

  return (
    <div className="lg:col-span-2 flex flex-col h-full">
      <ChartContainer 
        title="Capacity by Process × Operator" 
        icon={<BarChart2 className="h-5 w-5 text-blue-600" />}
      >
        <div className="mb-2 flex justify-between items-end">
          <p className="text-sm text-gray-500">Average Capacity: <span className="font-semibold text-gray-800">{avgCapacity}</span></p>
          <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">Scroll horizontally to view all</div>
        </div>
        
        <div className="overflow-x-auto w-full border border-gray-100 rounded-md pb-4 scrollable-chart-area flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div className="scrollable-chart-inner" style={{ width: isFullscreen ? '100%' : `${expectedWidth}px`, height: isFullscreen ? 'auto' : '650px', minHeight: isFullscreen ? `${Math.max(chartData.length * 30, 800)}px` : undefined, overflow: 'visible' }}>
             <ResponsiveContainer width="100%" height={isFullscreen ? Math.max(chartData.length * 30, 800) : "100%"} minHeight={isFullscreen ? Math.max(chartData.length * 30, 800) : 650} key={isFullscreen ? 'fs-scroll-engine' : 'normal-view'}>
              <BarChart layout={isFullscreen ? "vertical" : "horizontal"} data={chartData} margin={{ top: 20, right: 30, left: isFullscreen ? 150 : 20, bottom: isFullscreen ? 20 : 250 }} barCategoryGap="1%">
              <CartesianGrid strokeDasharray="3 3" vertical={!isFullscreen} horizontal={isFullscreen} stroke="#E5E7EB" />
              {isFullscreen ? (
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 9, fill: '#4B5563' }} />
              ) : (
                <XAxis 
                  dataKey="name" 
                  type="category"
                  tick={<CustomizedAxisTick />} 
                  interval={0} 
                  height={250}
                />
              )}
              {isFullscreen ? (
                <XAxis type="number" domain={[0, calculatedMax === 0 ? 'auto' : calculatedMax]} tick={{ fontSize: 12, fill: '#4B5563' }} />
              ) : (
                <YAxis 
                  type="number"
                  domain={[0, calculatedMax === 0 ? 'auto' : calculatedMax]}
                  tick={{ fontSize: 12, fill: '#4B5563' }} 
                  label={{ value: 'Capacity', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280' } }}
                />
              )}
              <Tooltip isAnimationActive={false} 
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              {/* A fake Legend to show operators */}
              <Legend 
                verticalAlign="top" 
                height={isFullscreen ? 50 : 150} 
                iconType="circle" 
                wrapperStyle={{ fontSize: '13px' }}
                payload={ops.map((op, i) => ({
                  id: op,
                  type: 'circle',
                  value: `Operator ${op}`,
                  color: OPERATOR_COLORS[i % OPERATOR_COLORS.length]
                }))}
              />
              
              {target1 > 0 && chartData.map((entry, idx) => {
                if (entry.Capacity <= target1 * 0.9) {
                  return (
                    <React.Fragment key={`bg-cap2-${idx}`}>
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
                <ReferenceLine 
                  x={target1} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3" 
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                  label={{ position: 'insideTopLeft', value: `LC Target: ${target1}`, fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} 
                />
              ) : target1 > 0 ? (
                <ReferenceLine 
                  y={target1} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3" 
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                  label={{ position: 'top', value: `LC Target: ${target1}`, fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} 
                />
              ) : null}
              
              {target2 > 0 && isFullscreen ? (
                <ReferenceLine 
                  x={target2} 
                  stroke="#047857" 
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                  label={{ position: 'insideTopRight', value: `100% Target: ${target2}`, fill: '#047857', fontSize: 11, fontWeight: 'bold' }} 
                />
              ) : target2 > 0 ? (
                <ReferenceLine 
                  y={target2} 
                  stroke="#047857" 
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                  label={{ position: 'top', value: `100% Target: ${target2}`, fill: '#047857', fontSize: 11, fontWeight: 'bold' }} 
                />
              ) : null}

              <Bar isAnimationActive={false} dataKey="Capacity" minPointSize={2}>
                {chartData.map((entry, index) => {
                  const opIndex = ops.indexOf(entry.operatorName);
                  return <Cell key={`cell-${index}`} fill={OPERATOR_COLORS[opIndex % OPERATOR_COLORS.length]} />;
                })}
                <LabelList 
                  dataKey="Capacity" 
                  position={isFullscreen ? "right" : "top"} 
                  fill="#111827" 
                  fontSize={11} 
                  fontWeight="bold"
                  angle={isFullscreen ? 0 : -55}
                  offset={10}
                  formatter={(v: number) => String(v)}
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
