import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function DateRangePicker({ 
  availableDates, 
  startDate, 
  endDate, 
  onChange 
}: { 
  availableDates: string[];
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const dateParts = availableDates.map(d => {
    const [m, day, y] = d.split('/');
    if (!m || !day || !y) return null;
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(day));
  }).filter(Boolean) as Date[];

  const [currMonth, setCurrMonth] = useState(
    dateParts.length > 0 ? new Date(dateParts[0].getFullYear(), dateParts[0].getMonth(), 1) : new Date()
  );

  const [selectingStart, setSelectingStart] = useState<Date | null>(startDate ? new Date(startDate) : null);
  const [selectingEnd, setSelectingEnd] = useState<Date | null>(endDate ? new Date(endDate) : null);

  useEffect(() => {
    setSelectingStart(startDate ? new Date(startDate) : null);
    setSelectingEnd(endDate ? new Date(endDate) : null);
  }, [startDate, endDate]);

  const daysInMonth = new Date(currMonth.getFullYear(), currMonth.getMonth() + 1, 0).getDate();
  const startDay = new Date(currMonth.getFullYear(), currMonth.getMonth(), 1).getDay();

  const handleSelect = (d: number) => {
    const selectedDate = new Date(currMonth.getFullYear(), currMonth.getMonth(), d);
    const dateStr = `${currMonth.getMonth() + 1}/${d}/${currMonth.getFullYear()}`;
    
    // Logic for range selection
    if (!selectingStart || (selectingStart && selectingEnd)) {
      setSelectingStart(selectedDate);
      setSelectingEnd(null);
      onChange(dateStr, '');
    } else {
      if (selectedDate < selectingStart) {
        setSelectingStart(selectedDate);
        onChange(dateStr, '');
      } else {
        setSelectingEnd(selectedDate);
        onChange(`${selectingStart.getMonth() + 1}/${selectingStart.getDate()}/${selectingStart.getFullYear()}`, dateStr);
        setOpen(false);
      }
    }
  };

  const isAvailable = (d: number) => {
    return dateParts.some(dp => dp.getFullYear() === currMonth.getFullYear() && dp.getMonth() === currMonth.getMonth() && dp.getDate() === d);
  };
  
  const isSelected = (d: number) => {
    const current = new Date(currMonth.getFullYear(), currMonth.getMonth(), d);
    if (selectingStart && !selectingEnd) {
      return current.getTime() === selectingStart.getTime();
    }
    if (selectingStart && selectingEnd) {
      return current >= selectingStart && current <= selectingEnd;
    }
    return false;
  };
  
  const isStart = (d: number) => {
    const current = new Date(currMonth.getFullYear(), currMonth.getMonth(), d);
    return selectingStart && current.getTime() === selectingStart.getTime();
  };

  const isEnd = (d: number) => {
    const current = new Date(currMonth.getFullYear(), currMonth.getMonth(), d);
    return selectingEnd && current.getTime() === selectingEnd.getTime();
  };

  const clearRange = () => {
    setSelectingStart(null);
    setSelectingEnd(null);
    onChange('', '');
    setOpen(false);
  };

  const displayFormat = () => {
    if (startDate && endDate) return `${startDate} - ${endDate}`;
    if (startDate) return `${startDate} - Select End`;
    return "Custom Time Period";
  };

  return (
    <div className="relative" ref={ref}>
      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
        <CalendarIcon className="h-3 w-3" />
        Date Range
      </label>
      <div 
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between min-w-[200px] px-3 py-1.5 border border-gray-300 rounded-md text-sm cursor-pointer hover:border-blue-500 bg-white"
      >
        <span className={startDate || endDate ? "text-gray-900 font-medium" : "text-gray-500"}>
          {displayFormat()}
        </span>
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
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(day => <div key={day} className="text-gray-400">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 text-sm">
            {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`}/>)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const avail = isAvailable(d);
              const sel = isSelected(d);
              const st = isStart(d);
              const en = isEnd(d);
              return (
                <button
                  key={d}
                  disabled={!avail}
                  onClick={() => handleSelect(d)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    !avail && "text-gray-300 cursor-not-allowed",
                    avail && !sel && "hover:bg-blue-100 bg-green-50 text-green-700 font-medium border border-green-200",
                    sel && !st && !en && "bg-blue-100 text-blue-800 font-medium",
                    (st || en) && "bg-blue-600 text-white font-bold"
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <button 
            className="w-full mt-3 text-xs text-blue-600 hover:underline" 
            onClick={clearRange}
          >
            Clear Range
          </button>
        </div>
      )}
    </div>
  );
}
