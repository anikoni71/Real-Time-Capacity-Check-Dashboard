import Papa from "papaparse";
import { DashboardData, ProcessRow, ScoreboardRow } from "../types";

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZSDm3DPmRxekpTtPJvpckT7GnabbFTTzASEAiEKKctZZ1-cbDJSnyK-rkJlhV0G4BXF4-VrdPUh0W/pub?gid=529052641&single=true&output=csv";

export async function fetchDashboardData(): Promise<DashboardData> {
  return new Promise((resolve, reject) => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const processes: ProcessRow[] = [];
        const scoreboardsMap = new Map<string, ScoreboardRow>();

        results.data.forEach((row: any) => {
          // Check if row is mostly empty or lacks a date
          if (!row['Date']) return;
          
          const date = row['Date'];
          
          const getVal = (key: string) => row[key] || '';
          
          const sbUnit = getVal('Unit_1') || getVal('Unit');
          const sbLine = getVal('Line_1') || getVal('Line');
          const sbBuyer = getVal('Buyer_1') || getVal('Buyer');
          const sbStyle = getVal('Style_1') || getVal('Style');
          const sbItem = getVal('item_1') || getVal('item');
          const sbRunday = getVal('Runday_1') || getVal('Runday');
          
          const uqKey = `${date}-${sbUnit}-${sbLine}-${sbBuyer}-${sbStyle}-${sbItem}-${sbRunday}`;
          
          if (sbUnit && !scoreboardsMap.has(uqKey)) {
            const effStr = getVal('Today Plan LC Efficiency') || '0%';
            let effVal = parseInt(effStr.replace('%', ''), 10);
            if (isNaN(effVal)) effVal = 0;
            
            scoreboardsMap.set(uqKey, {
              date,
              unit: sbUnit,
              line: sbLine,
              buyer: sbBuyer,
              style: sbStyle,
              item: sbItem,
              runday: sbRunday,
              obMp: getVal('OB MP_1'),
              lineTotalSmv: getVal('Line Total SMV'),
              lineTarget100: getVal('LinE Target 100%'),
              todayPlanLcTarget: getVal('Today Plan LC Target'),
              todayPlanLcEfficiency: effStr,
              tackTimeSec: getVal('Tack Time (Sec)'),
              todayPreMp: getVal('Today Pre M/P'),
              presentTackTimeSec: getVal('Present Tack Time (Sec)'),
              efficiencyValue: effVal
            });
          }

          // Main data
          const sl = getVal('SL.');
          if (sl) {
            processes.push({
              sl,
              date,
              unit: getVal('Unit'),
              line: getVal('Line'),
              buyer: getVal('Buyer'),
              style: getVal('Style'),
              item: getVal('item'),
              runday: getVal('Runday'),
              processName: getVal('Process Name'),
              operatorName: getVal('Operator Name'),
              machine: getVal('M/C'),
              obSmv: parseFloat(getVal('OB SMV')) || 0,
              target100: parseFloat(getVal('100% TGT')) || 0,
              capacity: parseFloat(getVal('CAPACITY')) || 0,
              diffr: parseFloat(getVal('Diffr (A-B)')) || 0,
              actualOutput: parseFloat(getVal('Actual Output')) || 0,
              raw: row
            });
          }
        });

        resolve({
          processes,
          scoreboards: Array.from(scoreboardsMap.values()),
          lastUpdated: new Date()
        });
      },
      error: (error) => reject(error)
    });
  });
}
