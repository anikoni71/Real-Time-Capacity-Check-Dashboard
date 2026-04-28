import React from 'react';
import { ScoreboardRow } from '../types';
import { ClipboardList } from 'lucide-react';

export default function Scoreboard({ scoreboards, activeCount }: { scoreboards: ScoreboardRow[], activeCount: number }) {
  const validScoreboards = scoreboards.filter(sb => sb.obMp?.trim() || sb.lineTotalSmv?.trim() || sb.lineTarget100?.trim() || sb.todayPlanLcTarget?.trim());

  if (validScoreboards.length === 0) {
    return (
      <div className="scoreboard-container bg-white rounded-lg p-12 text-center border">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Data Found</h3>
        <p className="text-gray-500 text-sm">We couldn't find any scoreboard records matching your {activeCount} active filters. Please adjust them above.</p>
      </div>
    );
  }

  const getEfficiencyColor = (eff: number) => {
    if (eff >= 90) return 'text-green-700 bg-green-50 font-semibold';
    if (eff >= 75) return 'text-yellow-700 bg-yellow-50 font-semibold';
    return 'text-red-700 bg-red-50 font-semibold';
  };

  return (
    <div className="scoreboard-container bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-blue-600" />
          Style Detail's Scoreboard
        </h2>
        {activeCount > 0 && <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">{activeCount} Filter{activeCount !== 1 ? 's' : ''} Active</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-gray-700 bg-gray-100 uppercase border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Line</th>
              <th className="px-4 py-3">Buyer</th>
              <th className="px-4 py-3">Style</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3 border-r">Runday</th>
              <th className="px-4 py-3">OB MP</th>
              <th className="px-4 py-3">Line Total SMV</th>
              <th className="px-4 py-3">LinE Target 100%</th>
              <th className="px-4 py-3 bg-blue-50/50">Today Plan LC Target</th>
              <th className="px-4 py-3 bg-blue-50/50">Today Plan LC Efficiency</th>
              <th className="px-4 py-3">Tack Time (Sec)</th>
              <th className="px-4 py-3">Today Pre M/P</th>
              <th className="px-4 py-3">Present Tack Time (Sec)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {validScoreboards.map((sb, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2 font-medium">{sb.unit}</td>
                <td className="px-4 py-2 font-medium">{sb.line}</td>
                <td className="px-4 py-2">{sb.buyer}</td>
                <td className="px-4 py-2 text-gray-600">{sb.style}</td>
                <td className="px-4 py-2 text-gray-600">{sb.item}</td>
                <td className="px-4 py-2 text-gray-500 border-r">{sb.runday}</td>
                <td className="px-4 py-2 font-mono">{sb.obMp}</td>
                <td className="px-4 py-2 font-mono">{sb.lineTotalSmv}</td>
                <td className="px-4 py-2 font-mono">{sb.lineTarget100}</td>
                <td className="px-4 py-2 font-mono font-medium bg-blue-50/20">{sb.todayPlanLcTarget}</td>
                <td className={`px-4 py-2 font-mono ${getEfficiencyColor(sb.efficiencyValue)}`}>
                  {sb.todayPlanLcEfficiency}
                </td>
                <td className="px-4 py-2 font-mono text-gray-500">{sb.tackTimeSec}</td>
                <td className="px-4 py-2 font-mono text-gray-500">{sb.todayPreMp}</td>
                <td className="px-4 py-2 font-mono text-gray-500">{sb.presentTackTimeSec}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
