import Papa from "papaparse";
import fetch from "node-fetch";

const csv = `a,b,a\n1,2,3`;
const res = Papa.parse(csv, {header:true});
console.log(res);
