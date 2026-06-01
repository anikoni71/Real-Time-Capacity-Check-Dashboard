const fs = require('fs');
const glob = require('glob');
const files = fs.readdirSync('src/components').filter(f => f.endsWith('.tsx'));

for (const file of files) {
  let content = fs.readFileSync('src/components/' + file, 'utf8');
  let changed = false;

  // Add 20% buffer to YAxis domain if not present
  if (content.includes('<YAxis') && !content.includes('domain={[0, (max: number | number[]) =>')) {
    content = content.replace(/<YAxis(?:\s+tick=\{\{.*?\}\})?(?:\s+dataKey=".*?")?(?:\s+type=".*?")?(?:\s+width=\{.*?\})?(?:\s+domain=\{.*?\})?/g, (match) => {
      if (match.includes('domain=')) {
        return match.replace(/domain=\{.*?\}/, `domain={[0, (max: any) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Number(m) * 1.2); }]}`);
      } else {
         return match + ` domain={[0, (max: any) => { const m = Array.isArray(max) ? max[1] : max; return Math.round(Number(m) * 1.2); }]}`;
      }
    });
    changed = true;
  }

  // Optimize XAxis
  if (content.includes('<XAxis')) {
      content = content.replace(/<XAxis\s+dataKey="name"([^>]+)height=\{[0-9]+\}/g, '<XAxis dataKey="name"$1height={350}');
      content = content.replace(/angle=\{-90\}/g, 'angle={-45}');
      changed = true;
  }
  
  if (changed) {
    fs.writeFileSync('src/components/' + file, content);
  }
}
