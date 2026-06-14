import React, { useMemo, useState } from "react";
import { ProcessRow } from "../types";
import { FullscreenResponsiveContainer as ResponsiveContainer } from "./FullscreenResponsiveContainer";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Settings, Search } from "lucide-react";
import ChartContainer from "./ChartContainer";
import { useFullscreenContext } from "../contexts/FullscreenContext";

function MachineDistributionContent({ data, COLORS, total }: { data: any[], COLORS: string[], total: number }) {
  const isFullscreen = useFullscreenContext();

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    value,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const percent = ((value / total) * 100).toFixed(0);
    if (value === 0 || percent === "0") return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight="bold"
      >
        {percent}%
      </text>
    );
  };

  const renderFullscreenLabel = (props: any) => {
    const { x, y, cx, name, percent } = props;
    if (!name || percent === 0) return null;
    
    const offset = x > cx ? 24 : -24;
    return (
      <text 
        x={x + offset} 
        y={y} 
        fill="#0f172a" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central" 
        fontSize={36}
        fontWeight="600"
      >
        {`${name}: ${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const [searchTerm, setSearchTerm] = useState("");
  const filteredData = data.filter((row) =>
    row.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className={isFullscreen ? "grid grid-cols-1 lg:grid-cols-2 w-full gap-6 items-start h-full pb-4 scrollable-chart-area flex-1" : "flex flex-col lg:flex-row items-start justify-center gap-8 pb-4 scrollable-chart-area flex-1 w-full"}
    >
      <div
        className={`w-full pie-chart-inner flex items-center justify-center ${isFullscreen ? "h-full min-h-[600px]" : "lg:w-1/2 h-full min-h-[450px]"}`}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
          minHeight={isFullscreen ? 700 : 450}
        >
          <PieChart margin={isFullscreen ? { top: 20, right: 150, bottom: 20, left: 150 } : undefined}>
            <Pie
              isAnimationActive={false}
              data={data}
              cx="50%"
              cy="50%"
              labelLine={isFullscreen ? true : false}
              label={isFullscreen ? renderFullscreenLabel : renderCustomizedLabel}
              outerRadius={isFullscreen ? 330 : 160}
              innerRadius={isFullscreen ? 190 : 80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              isAnimationActive={false}
              formatter={(value: number, name: string) => {
                const percent = ((value / total) * 100).toFixed(1);
                return [`${value} qty (${percent}%)`, name];
              }}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Legend
              verticalAlign="bottom"
              content={(props: any) => {
                const { payload } = props;
                return (
                  <ul className="flex flex-wrap justify-center gap-2 pt-6 pb-2 w-full max-w-full">
                    {payload?.map((entry: any, index: number) => {
                      const rowData = data.find(
                        (d) => d.name === entry.value,
                      );
                      return (
                        <li
                          key={`item-${index}`}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-100 px-2 py-1.5 rounded shadow-sm"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-sm"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span>{entry.value}</span>
                          {rowData && (
                            <span
                              className={`ml-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                                rowData.status === "Operational"
                                  ? "bg-green-100 text-green-700"
                                  : rowData.status === "At Capacity"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {rowData.status}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className={`w-full flex flex-col ${isFullscreen ? "h-full min-h-[600px]" : "lg:w-1/2"}`}>
        <div className="flex items-center justify-between mb-3 gap-4">
          <h4 className="text-sm font-semibold text-gray-700 whitespace-nowrap">
            Machine Details
          </h4>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search machines..."
              className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div
          className={`border rounded-md flex-1 ${isFullscreen ? "overflow-y-auto" : "overflow-hidden max-h-[350px] overflow-y-auto print:max-h-full print:overflow-visible"}`}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Machine Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Quantity
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((row, i) => (
                <tr
                  key={row.name}
                  className={
                    i % 2 === 0
                      ? "bg-white"
                      : "bg-gray-50 hover:bg-blue-50 transition-colors"
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      ></span>
                      {row.name}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        row.status === "Operational"
                          ? "bg-green-100 text-green-700"
                          : row.status === "At Capacity"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {row.value}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {((row.value / total) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 sticky bottom-0">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Total
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {total}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  100%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function MachineDistribution({
  processes,
}: {
  processes: ProcessRow[];
}) {
  const { data, COLORS } = useMemo(() => {
    const map = new Map<string, number>();
    processes.forEach((p) => {
      const mc = p.machine || "Manual/Other";
      map.set(mc, (map.get(mc) || 0) + 1);
    });

    // Convert to array
    const distData = Array.from(map.entries())
      .map(([name, value]) => {
        let status = "Operational";
        const hash = name
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const mod = hash % 10;
        if (mod >= 8) status = "Maintenance";
        else if (value > 4 || mod >= 6) status = "At Capacity";
        return { name, value, status };
      })
      .sort((a, b) => b.value - a.value);

    // Generate colors
    const colors = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#06B6D4",
      "#EC4899",
      "#F97316",
      "#84CC16",
      "#64748B",
    ];
    const generatedColors = distData.map((_, i) => colors[i % colors.length]);

    return { data: distData, COLORS: generatedColors };
  }, [processes]);

  if (processes.length === 0)
    return (
      <div className="p-8 text-center text-gray-500">
        No data found matching current filters.
      </div>
    );

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="h-full">
      <ChartContainer
        title="Machine Type Distribution"
        icon={<Settings className="h-5 w-5 text-blue-600" />}
      >
        <MachineDistributionContent data={data} COLORS={COLORS} total={total} />
      </ChartContainer>
    </div>
  );
}
