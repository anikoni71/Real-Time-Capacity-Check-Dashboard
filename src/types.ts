export interface ProcessRow {
  sl: string;
  date: string;
  unit: string;
  line: string;
  buyer: string;
  style: string;
  item: string;
  runday: string;
  processName: string;
  operatorName: string;
  machine: string;
  obSmv: number;
  avgMin: number;
  tt100: number;
  target100: number;
  capacity: number;
  diffr: number;
  minVari: number;
  minUti: number;
  actualOutput: number;
  todayPlanLcTarget: number;
  lineTarget100: number;
  raw: any;
}

export interface ScoreboardRow {
  unit: string;
  line: string;
  buyer: string;
  style: string;
  item: string;
  runday: string;
  obMp: string;
  lineTotalSmv: string;
  lineTarget100: string;
  todayPlanLcTarget: string;
  todayPlanLcEfficiency: string;
  tackTimeSec: string;
  todayPreMp: string;
  presentTackTimeSec: string;
  efficiencyValue: number; // parsed from "90%" for color coding
  date: string; // To match filters
}

export interface DashboardData {
  processes: ProcessRow[];
  scoreboards: ScoreboardRow[];
  lastUpdated: Date;
}
