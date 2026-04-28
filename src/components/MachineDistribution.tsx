import React, { useMemo } from 'react';
import { ProcessRow } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Settings } from 'lucide-react';
import ChartContainer from './ChartContainer';

export default function MachineDistribution({ processes }: { processes: ProcessRow[] }) {
  const { data, COLORS } = useMemo(() => {
    const map = new Map<string, number>();
    processes.forEach(p => {
      const mc = p.machine || 'Manual/Other';
      map.set(mc, (map.get(mc) || 0) + 1);
    });
    
    // Convert to array
    const distData = Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Generate colors
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316', '#84CC16', '#64748B'];
    const generatedColors = distData.map((_, i) => colors[i % colors.length]);

    return { data: distData, COLORS: generatedColors };
  }, [processes]);

  if (processes.length === 0) return <div className="p-8 text-center text-gray-500">No data found matching current filters.</div>;

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    const percent = ((value / total) * 100).toFixed(0);
    if (value === 0 || percent === '0') return null; // Avoid cluttered zero labels
    
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
        {percent}%
      </text>
    );
  };

  return (
    <div className="h-full">
      <ChartContainer 
        title="Machine Type Distribution" 
        icon={<Settings className="h-5 w-5 text-blue-600" />}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 pb-4 scrollable-chart-area flex-1">
          <div className="w-full lg:w-1/2 scrollable-chart-inner" style={{ height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={140}
                innerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => {
                  const percent = ((value / total) * 100).toFixed(1);
                  return [`${value} qty (${percent}%)`, name];
                }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="w-full lg:w-1/2">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Machine Details</h4>
          <div className="border rounded-md overflow-hidden max-h-[350px] overflow-y-auto print:max-h-full print:overflow-visible">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine Type</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, i) => (
                  <tr key={row.name} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-blue-50 transition-colors'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                      {row.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{row.value}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{((row.value / total) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 sticky bottom-0">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{total}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </ChartContainer>
    </div>
  );
}
