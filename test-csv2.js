import fetch from 'node-fetch';
import Papa from 'papaparse';

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZSDm3DPmRxekpTtPJvpckT7GnabbFTTzASEAiEKKctZZ1-cbDJSnyK-rkJlhV0G4BXF4-VrdPUh0W/pub?gid=529052641&single=true&output=csv";

fetch(CSV_URL).then(r => r.text()).then(txt => {
    const res = Papa.parse(txt, {header: false});
    console.log(JSON.stringify(res.data[0], null, 2));
});
