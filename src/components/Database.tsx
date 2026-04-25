import React, { useState } from 'react';
import { ProcessRow } from '../types';
import { Search, Database as DatabaseIcon } from 'lucide-react';

export default function Database({ processes }: { processes: ProcessRow[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = processes.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.processName || '').toLowerCase().includes(term) ||
      (p.operatorName || '').toLowerCase().includes(term) ||
      (p.style || '').toLowerCase().includes(term) ||
      (p.item || '').toLowerCase().includes(term) ||
      (p.line || '').toLowerCase().includes(term) ||
      (p.unit || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col max-h-[800px]">
      <div className="px-4 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5 text-blue-600" />
            Raw Data Database
          </h2>
          <p className="text-sm text-gray-500 mt-1">Showing {filtered.length} matching records</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search database..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>
      
      <div className="overflow-auto flex-1 h-full min-h-[500px]">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-gray-700 bg-gray-100 uppercase border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Line</th>
              <th className="px-4 py-3">Buyer</th>
              <th className="px-4 py-3">Style</th>
              <th className="px-4 py-3">Process</th>
              <th className="px-4 py-3">Operator</th>
              <th className="px-4 py-3">M/C</th>
              <th className="px-4 py-3">OB SMV</th>
              <th className="px-4 py-3">100% Target</th>
              <th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3">Actual Output</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {filtered.slice(0, 500).map((p, i) => ( // limit purely for rendering perf, assuming mostly we want to see top matches
              <tr key={i} className="hover:bg-blue-50 transition-colors">
                <td className="px-4 py-2">{p.date}</td>
                <td className="px-4 py-2 font-medium">{p.unit}</td>
                <td className="px-4 py-2 font-medium">{p.line}</td>
                <td className="px-4 py-2">{p.buyer}</td>
                <td className="px-4 py-2 text-gray-600">{p.style}</td>
                <td className="px-4 py-2 text-gray-900">{p.processName}</td>
                <td className="px-4 py-2 font-medium text-blue-700">{p.operatorName}</td>
                <td className="px-4 py-2 text-gray-500">{p.machine}</td>
                <td className="px-4 py-2 font-mono">{p.obSmv}</td>
                <td className="px-4 py-2 font-mono">{p.target100}</td>
                <td className="px-4 py-2 font-mono font-medium text-green-700">{p.capacity}</td>
                <td className="px-4 py-2 font-mono">{p.actualOutput}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 500 && (
          <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 border-t">
            Showing first 500 records. Please use search or filters to narrow down results.
          </div>
        )}
      </div>
    </div>
  );
}
