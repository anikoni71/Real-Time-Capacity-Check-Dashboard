import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, ReferenceLine } from 'recharts';
import { Sparkles, AlertCircle, ArrowUp, ArrowDown, Percent, Users, Activity, Target } from 'lucide-react';
import ChartContainer from './ChartContainer';

export default function Performers({ processes }: { processes: ProcessRow[] }) {
  const { 
    topProc, lowProc, topOp, lowOp, topEff, lowEff, target1, target2,
    totalActiveOperators, overallAverageEfficiency, linesBelowTarget
  } = useMemo(() => {
    // Aggregate by process for Capacity
    const procMap = new Map<string, { sum: number, count: number }>();
    const opMap = new Map<string, { sum: number, count: number }>();
    
    // Aggregate for Efficiency (combining process and operator)
    const effMap = new Map<string, { sum: number, count: number }>();

    processes.forEach(p => {
      if (p.processName) {
        if (!procMap.has(p.processName)) procMap.set(p.processName, { sum: 0, count: 0 });
        const existing = procMap.get(p.processName)!;
        existing.sum += p.capacity;
        existing.count += 1;
      }
      if (p.operatorName) {
        if (!opMap.has(p.operatorName)) opMap.set(p.operatorName, { sum: 0, count: 0 });
        const existing = opMap.get(p.operatorName)!;
        existing.sum += p.capacity;
        existing.count += 1;
      }
      if (p.processName && p.operatorName) {
        const comboKey = `${p.processName} - ${p.operatorName}`;
        if (!effMap.has(comboKey)) effMap.set(comboKey, { sum: 0, count: 0 });
        const existing = effMap.get(comboKey)!;
        existing.sum += (p.operatorEfficiency || 0);
        existing.count += 1;
      }
    });

    const procList = Array.from(procMap.entries()).map(([name, data]) => ({ name, Capacity: Math.round(data.sum / data.count) }));
    const opList = Array.from(opMap.entries()).map(([name, data]) => ({ name, Capacity: Math.round(data.sum / data.count) }));
    const effList = Array.from(effMap.entries()).map(([name, data]) => ({ name, Efficiency: Math.round(data.sum / data.count) }));

    const sortedProc = [...procList].sort((a, b) => b.Capacity - a.Capacity);
    const sortedOp = [...opList].sort((a, b) => b.Capacity - a.Capacity);
    const sortedEff = [...effList].sort((a, b) => b.Efficiency - a.Efficiency);

    // Get top 5 and low 5
    const topProc = sortedProc.slice(0, 5);
    const lowProc = sortedProc.slice().reverse().slice(0, 5);
    
    const topOp = sortedOp.slice(0, 5);
    const lowOp = sortedOp.slice().reverse().slice(0, 5);
    
    const topEff = sortedEff.slice(0, 5);
    const lowEff = sortedEff.slice().reverse().slice(0, 5);
    
    const t1 = processes.length > 0 ? processes[0].todayPlanLcTarget : 0;
    const t2 = processes.length > 0 ? processes[0].lineTarget100 : 0;

    const activeOps = new Set(processes.map(p => p.operatorName).filter(Boolean)).size;
    const validEffs = processes.filter(p => p.operatorEfficiency != null && p.operatorEfficiency > 0);
    const avgEff = validEffs.length > 0 ? validEffs.reduce((sum, p) => sum + p.operatorEfficiency, 0) / validEffs.length : 0;
    
    // Number of lines that have at least one process below LC target
    const linesFailing = new Set(processes.filter(p => p.capacity < (p.todayPlanLcTarget || t1)).map(p => p.line).filter(Boolean)).size;

    return { 
      topProc, lowProc, topOp, lowOp, topEff, lowEff, 
      target1: t1, target2: t2,
      totalActiveOperators: activeOps,
      overallAverageEfficiency: avgEff,
      linesBelowTarget: linesFailing
    };
  }, [processes]);

  if (processes.length === 0) return <div className="p-8 text-center text-gray-500">No data found matching current filters.</div>;

  const renderHorizontalChart = (data: any[], title: string, color: string, IconComponent: any, dataKey: string = "Capacity", hasTargets: boolean = true) => (
    <ChartContainer title={title} icon={IconComponent} data={data}>
      <div className="flex-1 w-full" style={{ minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 150, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
            <XAxis 
              type="number" 
              tick={{ fontSize: 11 }} 
              domain={[0, (max: number) => { 
                if (!hasTargets) return Math.min(100, Math.round(max * 1.2));
                return Math.round(Math.max(max, target1, target2) * 1.2); 
              }]} 
            />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#4B5563' }} width={140} />
            <Tooltip isAnimationActive={false} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            
            {hasTargets && target1 > 0 && (
              <ReferenceLine 
                x={target1} 
                stroke="#ef4444" 
                strokeDasharray="3 3" 
                strokeWidth={2}
                ifOverflow="extendDomain"
                label={{ position: 'insideTopLeft', value: `LC Target: ${target1}`, fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} 
              />
            )}
            
            {hasTargets && target2 > 0 && (
              <ReferenceLine 
                x={target2} 
                stroke="#047857" 
                strokeWidth={2}
                ifOverflow="extendDomain"
                label={{ position: 'insideTopRight', value: `100% Target: ${target2}`, fill: '#047857', fontSize: 11, fontWeight: 'bold' }} 
              />
            )}
            
            {!hasTargets && (
              <ReferenceLine 
                x={100} 
                stroke="#047857" 
                strokeWidth={2}
                strokeDasharray="3 3"
                ifOverflow="extendDomain"
                label={{ position: 'insideTopRight', value: '100%', fill: '#047857', fontSize: 11, fontWeight: 'bold' }} 
              />
            )}

            <Bar isAnimationActive={false} dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} maxBarSize={30}>
              <LabelList 
                dataKey={dataKey} 
                position="right" 
                fill="#374151" 
                fontSize={11} 
                fontWeight={600} 
                formatter={(v: number) => hasTargets ? String(v) : `${v}%`} 
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="pt-2 pb-1">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 px-2">
          <Activity className="h-5 w-5 text-blue-500" />
          KPI Overview
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Active Operators</h3>
            <p className="text-2xl font-bold text-gray-900">{totalActiveOperators}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Overall Avg Efficiency</h3>
            <p className="text-2xl font-bold text-gray-900">{overallAverageEfficiency.toFixed(1)}%</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center">
            <Activity className="h-6 w-6 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Lines Below Target</h3>
            <p className="text-2xl font-bold text-gray-900">{linesBelowTarget}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center">
            <Target className="h-6 w-6 text-rose-500" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="h-[400px]">
          {renderHorizontalChart(topProc, 'Top Performing Processes', '#10b981', <><ArrowUp className="h-4 w-4 text-emerald-500" /><Sparkles className="h-4 w-4 text-emerald-500" /></>)}
        </div>
        <div className="h-[400px]">
          {renderHorizontalChart(lowProc, 'Lowest Performing Processes', '#ef4444', <><ArrowDown className="h-4 w-4 text-rose-500" /><AlertCircle className="h-4 w-4 text-rose-500" /></>)}
        </div>
        <div className="h-[400px]">
          {renderHorizontalChart(topOp, 'Top Performing Operators', '#3b82f6', <><ArrowUp className="h-4 w-4 text-blue-500" /><Sparkles className="h-4 w-4 text-blue-500" /></>)}
        </div>
        <div className="h-[400px]">
          {renderHorizontalChart(lowOp, 'Lowest Performing Operators', '#f59e0b', <><ArrowDown className="h-4 w-4 text-orange-500" /><AlertCircle className="h-4 w-4 text-orange-500" /></>)}
        </div>
      </div>
      
      <div className="pt-8 border-t border-gray-200 w-full">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 px-2">
          <Percent className="h-5 w-5 text-indigo-500" />
          Efficiency Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="h-[400px]">
             {renderHorizontalChart(topEff, 'Top Efficiency (%)', '#8b5cf6', <><ArrowUp className="h-4 w-4 text-violet-500" /><Sparkles className="h-4 w-4 text-violet-500" /></>, "Efficiency", false)}
          </div>
          <div className="h-[400px]">
             {renderHorizontalChart(lowEff, 'Lowest Efficiency (%)', '#ec4899', <><ArrowDown className="h-4 w-4 text-pink-500" /><AlertCircle className="h-4 w-4 text-pink-500" /></>, "Efficiency", false)}
          </div>
        </div>
      </div>
    </div>
  );
}
