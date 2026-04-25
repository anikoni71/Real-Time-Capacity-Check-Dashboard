import React, { useState, useRef, useEffect } from 'react';
import { DashboardData } from '../types';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, 
  Building, GitMerge, ShoppingCart, Shirt, Tag, Clock, Settings, User 
} from 'lucide-react';
import { cn } from '../lib/utils';

function DatePicker({ availableDates, dateParts, selected, onSelect, label, icon: Icon }: any) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const [currMonth, setCurrMonth] = useState(
    dateParts.length > 0 ? new Date(dateParts[0].getFullYear(), dateParts[0].getMonth(), 1) : new Date()
  );

  const daysInMonth = new Date(currMonth.getFullYear(), currMonth.getMonth() + 1, 0).getDate();
  const startDay = new Date(currMonth.getFullYear(), currMonth.getMonth(), 1).getDay();

  const handleSelect = (d: number) => {
    const exactMatch = availableDates.find((raw: string) => {
      const [m, day, y] = raw.split('/');
      return parseInt(y) === currMonth.getFullYear() && 
             parseInt(m) - 1 === currMonth.getMonth() && 
             parseInt(day) === d;
    });
    
    if (exactMatch) {
      onSelect(exactMatch);
      setOpen(false);
    }
  };

  const isAvailable = (d: number) => {
    return dateParts.some((dp: Date) => dp.getFullYear() === currMonth.getFullYear() && dp.getMonth() === currMonth.getMonth() && dp.getDate() === d);
  };
  
  const isSelected = (d: number) => {
    if (!selected) return false;
    const [sm, sd, sy] = selected.split('/');
    return parseInt(sy) === currMonth.getFullYear() && parseInt(sm) - 1 === currMonth.getMonth() && parseInt(sd) === d;
  };

  return (
    <div className="relative" ref={ref}>
      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </label>
      <div 
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between min-w-[140px] px-3 py-1.5 border border-gray-300 rounded-md text-sm cursor-pointer hover:border-blue-500 bg-white"
      >
        <span className={selected ? "text-gray-900 font-medium" : "text-gray-500"}>{selected || "Any Date"}</span>
        <CalendarIcon className="h-4 w-4 text-gray-400" />
      </div>
      
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border shadow-xl rounded-lg p-3 z-50 w-64">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => setCurrMonth(new Date(currMonth.getFullYear(), currMonth.getMonth() - 1, 1))} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronLeft className="h-4 w-4"/></button>
            <div className="font-semibold text-sm">
              {currMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
            <button onClick={() => setCurrMonth(new Date(currMonth.getFullYear(), currMonth.getMonth() + 1, 1))} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronRight className="h-4 w-4"/></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="text-gray-400">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 text-sm">
            {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`}/>)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const avail = isAvailable(d);
              const sel = isSelected(d);
              return (
                <button
                  key={d}
                  disabled={!avail}
                  onClick={() => handleSelect(d)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    !avail && "text-gray-300 cursor-not-allowed",
                    avail && !sel && "hover:bg-blue-100 bg-green-50 text-green-700 font-medium border border-green-200",
                    sel && "bg-blue-600 text-white font-bold"
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <button 
            className="w-full mt-3 text-xs text-blue-600 hover:underline" 
            onClick={() => { onSelect(''); setOpen(false); }}
          >
            Clear Date
          </button>
        </div>
      )}
    </div>
  );
}

export default function FilterBar({ data, filters, setFilters, clearFilters, activeCount }: { 
  data: DashboardData, 
  filters: any, 
  setFilters: any, 
  clearFilters: () => void,
  activeCount: number
}) {
  const getUnique = (key: keyof DashboardData['processes'][0]) => {
    return Array.from(new Set(data.processes.map(p => p[key]))).filter(Boolean).sort();
  };

  const availableDates = getUnique('date') as string[];
  const dateParts = availableDates.map(d => {
    const [m, day, y] = d.split('/');
    if (!m || !day || !y) return null;
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(day));
  }).filter(Boolean) as Date[];

  const dropdowns = [
    { key: 'unit', label: 'Unit', icon: Building },
    { key: 'line', label: 'Line', icon: GitMerge },
    { key: 'buyer', label: 'Buyer', icon: ShoppingCart },
    { key: 'style', label: 'Style', icon: Shirt },
    { key: 'item', label: 'Item', icon: Tag },
    { key: 'runday', label: 'Runday', icon: Clock },
    { key: 'processName', label: 'Process', icon: Settings },
    { key: 'operatorName', label: 'Operator', icon: User }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-wrap gap-4 items-end">
        <DatePicker 
          availableDates={availableDates} dateParts={dateParts} 
          selected={filters.date} onSelect={(val: string) => setFilters({...filters, date: val})} 
          label="Exact Date" icon={CalendarIcon}
        />
        <DatePicker 
          availableDates={availableDates} dateParts={dateParts} 
          selected={filters.startDate} onSelect={(val: string) => setFilters({...filters, startDate: val})} 
          label="Start Date" icon={CalendarIcon}
        />
        <DatePicker 
          availableDates={availableDates} dateParts={dateParts} 
          selected={filters.endDate} onSelect={(val: string) => setFilters({...filters, endDate: val})} 
          label="End Date" icon={CalendarIcon}
        />

        {dropdowns.map(df => {
          const Icon = df.icon;
          return (
            <div key={df.key} className="min-w-[120px] flex-1 sm:flex-none">
              <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {df.label}
              </label>
              <select 
                value={filters[df.key]} 
                onChange={e => setFilters({...filters, [df.key]: e.target.value})}
                className="w-full text-sm py-1.5 px-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All</option>
                {getUnique(df.key as any).map(opt => (
                  <option key={opt as string} value={opt as string}>{opt}</option>
                ))}
              </select>
            </div>
          );
        })}

        <div className="ml-auto flex items-end">
          <button 
            onClick={clearFilters}
            disabled={activeCount === 0}
            className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-md transition-colors text-sm font-medium border border-transparent hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
            <span>Clear all ({activeCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
