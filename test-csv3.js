import fetch from 'node-fetch';
import Papa from 'papaparse';

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZSDm3DPmRxekpTtPJvpckT7GnabbFTTzASEAiEKKctZZ1-cbDJSnyK-rkJlhV0G4BXF4-VrdPUh0W/pub?gid=529052641&single=true&output=csv";

fetch(CSV_URL).then(r => r.text()).then(txt => {
    const res = Papa.parse(txt, {header: true, transformHeader: h => h.trim()});
    console.log("Keys available:", Object.keys(res.data[0]).filter(k => k.includes('Min')));
    const row = res.data[0];
    console.log("Process Name:", row['Process Name']);
    console.log("Operator Name:", row['Operator Name']);
    console.log("Min+ Allowance:", row['Min+\n Allowance']);
    console.log("Min Uti.:", row['Min Uti.']);
});
