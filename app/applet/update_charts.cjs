const fs = require('fs');

const files = fs.readdirSync('src/components').filter(f => f.endsWith('.tsx'));

for (const file of files) {
  let content = fs.readFileSync('src/components/' + file, 'utf8');
  let changed = false;

  // Add 20% buffer to YAxis domain
  content = content.replace(/<YAxis(.*?)>/g, (match, inner) => {
    if (!inner.includes('domain=')) {
       changed = true;
       return `<YAxis${inner} domain={[0, (max: any) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Number(m) * 1.2); }]} >`;
    }
    return match;
  });

  // Optimize XAxis
  if (content.includes('<XAxis')) {
      let originalContent = content;
      content = content.replace(/height=\{[0-9]+\}/g, 'height={350}');
      content = content.replace(/angle=\{0\}/g, 'angle={-45}');
      if(content !== originalContent) changed = true;
  }
  
  if (changed) {
    fs.writeFileSync('src/components/' + file, content);
  }
}
