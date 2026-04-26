// src/components/Dashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { DashboardData, ProcessRow, ScoreboardRow } from '../types';
import { fetchDashboardData } from '../services/dataService';
import FilterBar from './FilterBar';
import Scoreboard from './Scoreboard';
import CapacityProcess from './CapacityProcess';
import ProcessAnalysis from './ProcessAnalysis';
import Analytics from './Analytics';
import Performers from './Performers';
import Database from './Database';
import OperatorUtilization from './OperatorUtilization';
import MachineDistribution from './MachineDistribution';
import { RefreshCcw, Loader2, Factory, LineChart, BarChart2, Trophy, Database as DbIcon, Activity, Layers } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(60);

  const [filters, setFilters] = useState({
    date: '',
    startDate: '',
    endDate: '',
    unit: '',
    line: '',
    buyer: '',
    style: '',
    item: '',
    runday: '',
    processName: '',
    operatorName: ''
  });

  const fetchData = async () => {
    try {
      const result = await fetchDashboardData();
      setData(result);
      setLoading(false);
      setCountdown(60);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const clearFilters = () => {
    setFilters({
      date: '', startDate: '', endDate: '', unit: '', line: '', buyer: '', style: '',
      item: '', runday: '', processName: '', operatorName: ''
    });
  };

  const parseDate = (dStr: string) => {
    const [m, d, y] = dStr.split('/');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).getTime();
  };

  const filteredProcesses = useMemo(() => {
    if (!data) return [];
    return data.processes.filter(p => {
      let dateValid = true;
      if (filters.date && p.date !== filters.date) dateValid = false;
      if (filters.startDate || filters.endDate) {
        const pTime = parseDate(p.date);
        if (filters.startDate && pTime < parseDate(filters.startDate)) dateValid = false;
        if (filters.endDate && pTime > parseDate(filters.endDate)) dateValid = false;
      }

      return (
        dateValid &&
        (!filters.unit || p.unit === filters.unit) &&
        (!filters.line || p.line === filters.line) &&
        (!filters.buyer || p.buyer === filters.buyer) &&
        (!filters.style || p.style === filters.style) &&
        (!filters.item || p.item === filters.item) &&
        (!filters.runday || p.runday === filters.runday) &&
        (!filters.processName || p.processName === filters.processName) &&
        (!filters.operatorName || p.operatorName === filters.operatorName)
      );
    });
  }, [data, filters]);

  const filteredScoreboards = useMemo(() => {
    if (!data) return [];
    return data.scoreboards.filter(s => {
      let dateValid = true;
      if (filters.date && s.date !== filters.date) dateValid = false;
      if (filters.startDate || filters.endDate) {
        const sTime = parseDate(s.date);
        if (filters.startDate && sTime < parseDate(filters.startDate)) dateValid = false;
        if (filters.endDate && sTime > parseDate(filters.endDate)) dateValid = false;
      }

      return (
        dateValid &&
        (!filters.unit || s.unit === filters.unit) &&
        (!filters.line || s.line === filters.line) &&
        (!filters.buyer || s.buyer === filters.buyer) &&
        (!filters.style || s.style === filters.style) &&
        (!filters.item || s.item === filters.item) &&
        (!filters.runday || s.runday === filters.runday)
      );
    });
  }, [data, filters]);

  const tabs = [
    { id: 'Capacity by Process', icon: Factory },
    { id: 'Utilization & Machines', icon: Layers },
    { id: 'Process Analysis', icon: LineChart },
    { id: 'Analytics', icon: BarChart2 },
    { id: 'Performers', icon: Trophy },
    { id: 'Database', icon: DbIcon }
  ];

  const [activeTab, setActiveTab] = useState('Capacity by Process');

  if (loading && !data) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Real Time Capacity Check Dashboard</h1>
          </div>
          <span className="text-xs text-green-600 font-medium tracking-wide mt-1">Live Connection</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Next refresh in <span className="font-mono font-medium text-gray-900">{countdown}s</span>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors text-sm font-medium"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Refresh Now</span>
          </button>
        </div>
      </header>

      <div className="p-6 flex-1 max-w-7xl mx-auto w-full flex flex-col space-y-6">
        <FilterBar 
          data={data!} 
          filters={filters} 
          setFilters={setFilters} 
          clearFilters={clearFilters}
          activeCount={activeFiltersCount}
        />

        <Scoreboard scoreboards={filteredScoreboards} activeCount={activeFiltersCount} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                    activeTab === tab.id 
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.id}
                </button>
              );
            })}
          </div>
          
          <div className="p-4 bg-gray-50">
            {activeTab === 'Capacity by Process' && <CapacityProcess processes={filteredProcesses} />}
            {activeTab === 'Utilization & Machines' && (
              <div className="space-y-6">
                <OperatorUtilization processes={filteredProcesses} />
                <MachineDistribution processes={filteredProcesses} />
              </div>
            )}
            {activeTab === 'Process Analysis' && <ProcessAnalysis processes={filteredProcesses} />}
            {activeTab === 'Analytics' && <Analytics processes={filteredProcesses} />}
            {activeTab === 'Performers' && <Performers processes={filteredProcesses} />}
            {activeTab === 'Database' && <Database processes={filteredProcesses} />}
          </div>
        </div>
      </div>
    </div>
  );
}
