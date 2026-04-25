import https from 'https';
https.get("https://docs.google.com/spreadsheets/d/e/2PACX-1vQZSDm3DPmRxekpTtPJvpckT7GnabbFTTzASEAiEKKctZZ1-cbDJSnyK-rkJlhV0G4BXF4-VrdPUh0W/pub?gid=529052641&single=true&output=csv", res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data.split('\\n').slice(0, 5).join('\\n')));
});
