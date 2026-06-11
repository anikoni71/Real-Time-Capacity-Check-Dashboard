import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { FullscreenResponsiveContainer as ResponsiveContainer } from './FullscreenResponsiveContainer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, ReferenceLine } from 'recharts';
import { Clock } from 'lucide-react';
import ChartContainer from './ChartContainer';
import { useFullscreenContext } from '../contexts/FullscreenContext';

export default function OperatorUtilization({ processes }: { processes: ProcessRow[] }) {
  const isFullscreen = useFullscreenContext();
  const chartData = useMemo(() => {
    // Unique Process + Operator combination
    const map = new Map();
    processes.forEach(p => {
      if (!p.operatorName) return;
      const key = `${p.processName} (${p.operatorName})`;
      if (!map.has(key)) {
        map.set(key, { name: key, MinUti: 0, count: 0, Total: 60 });
      }
      const existing = map.get(key);
      existing.MinUti += p.minUti;
      existing.count += 1;
    });
    
    // Calculate total utilization minute
    return Array.from(map.values()).map((v: any) => ({
      name: v.name,
      Utilized: Math.round(v.MinUti / (v.count || 1)), 
      Total: 60
    }));
  }, [processes]);

  // Create stacked data structure
  // We stack 'Utilized' (Green) and the remaining unused time up to 60 (Yellow)
  const stackedData = chartData.map(d => ({
    name: d.name,
    Utilized: d.Utilized,
    Unutilized: Math.max(0, 60 - d.Utilized),
    Percentage: d.Utilized > 0 ? ((d.Utilized / 60) * 100).toFixed(0) + '%' : ''
  }));

  if (processes.length === 0) return <div className="p-8 text-center text-gray-500">No data found matching current filters.</div>;

  return (
    <div className="h-full">
      <ChartContainer 
        title="Operator Utilization Minute" 
        icon={<Clock className="h-5 w-5 text-emerald-600" />}
      >
        <div className="mb-2">
          <p className="text-sm text-gray-500 mt-1">Yellow bar represents 60 minutes total time. Green represents utilized minutes.</p>
        </div>
        <div className="overflow-x-auto w-full pb-4 scrollable-chart-area flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="scrollable-chart-inner" style={{ width: isFullscreen ? '100%' : `${Math.max(1200, stackedData.length * 60)}px`, height: isFullscreen ? 'auto' : '650px', minHeight: isFullscreen ? `${Math.max(stackedData.length * 30, 800)}px` : undefined }}>
            <ResponsiveContainer width="100%" height={isFullscreen ? Math.max(stackedData.length * 30, 800) : "100%"} minHeight={isFullscreen ? Math.max(stackedData.length * 30, 800) : 650} key={isFullscreen ? 'fs-scroll-engine' : 'normal-view'}>
              <BarChart layout={isFullscreen ? "vertical" : "horizontal"} data={stackedData} margin={{ top: 20, right: 30, left: isFullscreen ? 150 : 20, bottom: isFullscreen ? 20 : 180 }} barCategoryGap="1%">
                <CartesianGrid strokeDasharray="3 3" vertical={!isFullscreen} horizontal={isFullscreen} stroke="#E5E7EB" />
                {isFullscreen ? (
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 9, fill: '#4B5563' }} />
                ) : (
                  <XAxis 
                    dataKey="name" 
                    tick={{ angle: -45, textAnchor: 'end', fontSize: 11, fontWeight: 'bold', fill: '#1e293b', dy: 10, dx: -10 }} 
                    interval={0}
                    height={180}
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
                  label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#4B5563', fontSize: 12 } }} 
                />
              )}
              <Tooltip isAnimationActive={false} 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number, name: string) => {
                  if (name === 'Utilized Minute') return [`${value} min`, name];
                  if (name === 'Unutilized Minute') return [`${value} min (Total bar reaches 60)`, name];
                  return [value, name];
                }}
              />
              <Legend verticalAlign="top" height={isFullscreen ? 50 : 150} wrapperStyle={{ fontSize: '12px' }} />
              
              {isFullscreen ? (
                <ReferenceLine x={60} stroke="#EF4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: '60 Min Capacity', fill: '#EF4444', fontSize: 12, fontWeight: 'bold' }} />
              ) : (
                <ReferenceLine y={60} stroke="#EF4444" strokeDasharray="3 3" label={{ position: 'top', value: '60 Min Capacity', fill: '#EF4444', fontSize: 12, fontWeight: 'bold' }} />
              )}

              <Bar isAnimationActive={false} dataKey="Utilized" stackId="a" fill="#10B981" name="Utilized Minute" minPointSize={2}>
                <LabelList dataKey="Utilized" position="insideTop" fill="#ffffff" fontSize={11} fontWeight="bold" angle={isFullscreen ? 0 : -55} offset={10} formatter={(v: number) => String(v)} />
              </Bar>
              <Bar isAnimationActive={false} dataKey="Unutilized" stackId="a" fill="#FBBF24" name="Unutilized Minute" minPointSize={2}>
                <LabelList dataKey="Percentage" position={isFullscreen ? "right" : "top"} fill="#111827" fontSize={11} fontWeight="bold" angle={isFullscreen ? 0 : -55} offset={10} formatter={(v: string) => String(v)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      </ChartContainer>
    </div>
  );
}
