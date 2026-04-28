import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Activity, Target } from 'lucide-react';
import ChartContainer from './ChartContainer';

export default function LineTargets({ processes }: { processes: ProcessRow[] }) {
  const lineData = useMemo(() => {
    let l100 = 0;
    let tPlan = 0;
    for (const p of processes) {
      if (l100 === 0 && p.lineTarget100) l100 = p.lineTarget100;
      if (tPlan === 0 && p.todayPlanLcTarget) tPlan = p.todayPlanLcTarget;
    }

    // Link with filter and maintain serial as same as Google Sheet
    return processes.map((p, index) => {
      // Adding index to ensure unique keys just in case, though name might suffice for visual
      return {
        key: `${p.sl}-${index}`,
        name: p.operatorName ? `${p.processName} (${p.operatorName})` : p.processName,
        'Line 100% Target': l100,
        'Today Plan LC Target': tPlan,
        'Capacity': p.capacity || 0
      };
    });
  }, [processes]);

  if (processes.length === 0) return <div className="p-8 text-center text-gray-500">No data found matching current filters.</div>;

  return (
    <div className="space-y-6">
      <ChartContainer title="Line 100% Target vs Capacity" icon={<Target className="h-5 w-5 text-indigo-600" />}>
        <div className="overflow-x-auto w-full pb-4 scrollable-chart-area flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div className="scrollable-chart-inner" style={{ width: `${Math.max(800, lineData.length * 100)}px`, height: '400px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={lineData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} interval={0} angle={-90} textAnchor="end" height={160}/>
                 <YAxis domain={[0, (max: number | number[]) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(m * 1.2); }]} tick={{ fontSize: 11 }} />
                 <Tooltip />
                 <Legend verticalAlign="top" height={36} />
                 <Line type="monotone" dataKey="Capacity" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }}>
                   <LabelList dataKey="Capacity" position="bottom" fill="#3b82f6" fontSize={11} fontWeight="bold" angle={-90} offset={15} />
                 </Line>
                 <Line type="monotone" dataKey="Line 100% Target" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={false}>
                   <LabelList dataKey="Line 100% Target" position="top" fill="#ef4444" fontSize={11} fontWeight="bold" angle={-90} offset={15} />
                 </Line>
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </ChartContainer>

      <ChartContainer title="Today Plan LC Target vs Capacity" icon={<Activity className="h-5 w-5 text-emerald-600" />}>
        <div className="overflow-x-auto w-full pb-4 scrollable-chart-area flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div className="scrollable-chart-inner" style={{ width: `${Math.max(800, lineData.length * 100)}px`, height: '400px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={lineData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} interval={0} angle={-90} textAnchor="end" height={160}/>
                 <YAxis domain={[0, (max: number | number[]) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(m * 1.2); }]} tick={{ fontSize: 11 }} />
                 <Tooltip />
                 <Legend verticalAlign="top" height={36} />
                 <Line type="monotone" dataKey="Capacity" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }}>
                   <LabelList dataKey="Capacity" position="bottom" fill="#3b82f6" fontSize={11} fontWeight="bold" angle={-90} offset={15} />
                 </Line>
                 <Line type="monotone" dataKey="Today Plan LC Target" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={false}>
                   <LabelList dataKey="Today Plan LC Target" position="top" fill="#ef4444" fontSize={11} fontWeight="bold" angle={-90} offset={15} />
                 </Line>
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </ChartContainer>
    </div>
  );
}
