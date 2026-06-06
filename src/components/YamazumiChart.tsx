import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { FullscreenResponsiveContainer as ResponsiveContainer } from './FullscreenResponsiveContainer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from 'recharts';
import { Layers } from 'lucide-react';
import ChartContainer from './ChartContainer';
import { useFullscreenContext } from '../contexts/FullscreenContext';

export default function YamazumiChart({ processes }: { processes: ProcessRow[] }) {
  const isFullscreen = useFullscreenContext();
  const chartData = useMemo(() => {
    // A Yamazumi chart maps out cycle times or process steps.
    // Grouping by Process (Operator) combination to sum up VA, NVAN, NVA.
    const map = new Map<string, any>();
    
    // Ordered unique processes
    const orderedKeys: string[] = [];

    processes.forEach(p => {
      const key = p.operatorName ? `${p.processName} (${p.operatorName})` : p.processName;
      if (!map.has(key)) {
        map.set(key, { name: key, va: 0, nvan: 0, nva: 0, count: 0 });
        orderedKeys.push(key);
      }
      const existing = map.get(key);
      existing.va += p.va || 0;
      existing.nvan += p.nvan || 0;
      existing.nva += p.nva || 0;
      existing.count += 1;
    });

    return orderedKeys.map(k => {
      const v = map.get(k);
      const count = v.count || 1;
      const va = v.va / count;
      const nvan = v.nvan / count;
      const nva = v.nva / count;
      return {
        name: v.name,
        va,
        nvan,
        nva,
        total: va + nvan + nva
      };
    });
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
          <div className="scrollable-chart-inner" style={{ width: isFullscreen ? '100%' : `${Math.max(1200, chartData.length * 60)}px`, height: isFullscreen ? 'auto' : '600px', minHeight: isFullscreen ? `${Math.max(chartData.length * 30, 800)}px` : undefined }}>
            <ResponsiveContainer width="100%" height={isFullscreen ? Math.max(chartData.length * 30, 800) : "100%"} minHeight={isFullscreen ? Math.max(chartData.length * 30, 800) : 600} key={isFullscreen ? 'fs-scroll-engine' : 'normal-view'}>
              <BarChart layout={isFullscreen ? "vertical" : "horizontal"} data={chartData} margin={{ top: 30, right: 30, left: isFullscreen ? 150 : 20, bottom: isFullscreen ? 20 : 220 }} barCategoryGap="1%">
                <CartesianGrid strokeDasharray="3 3" vertical={!isFullscreen} horizontal={isFullscreen} stroke="#E5E7EB" />
                {isFullscreen ? (
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 9, fill: '#4B5563' }} />
                ) : (
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    tick={{ fontSize: 12, fill: '#4B5563' }} 
                    interval={0}
                    height={150}
                  />
                )}
              {isFullscreen ? (
                <XAxis 
                  type="number"
                  tick={{ fontSize: 11 }}
                />
              ) : (
                <YAxis 
                  type="number"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Time (Sec/Min)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#4B5563', fontSize: 12 } }} 
                />
              )}
              <Tooltip isAnimationActive={false} 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={isFullscreen ? 50 : 150} wrapperStyle={{ fontSize: '12px' }} />

              <Bar isAnimationActive={false} dataKey="va" stackId="a" fill="#10B981" name="Value-Added (VA)" minPointSize={2} />
              <Bar isAnimationActive={false} dataKey="nvan" stackId="a" fill="#F59E0B" name="Non-Value-Added Necessary (NVAN)" minPointSize={2} />
              <Bar isAnimationActive={false} dataKey="nva" stackId="a" fill="#EF4444" name="Waste (NVA)" minPointSize={2}>
                 <LabelList 
                   dataKey="total" 
                   position={isFullscreen ? "right" : "top"} 
                   fill="#111827" 
                   fontSize={11} 
                   fontWeight="bold" 
                   formatter={(v: number) => v > 0 ? String(Math.round(v)) : ''}
                   offset={10} 
                   angle={isFullscreen ? 0 : -55}
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
