const fs = require('fs');
let dash = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');

dash = dash.replace(
    /const totalIn = history\.filter\(t => t\.type === 'IN' && t\.status === 'COMPLETED'\)\.reduce\(\(sum, t\) => sum \+ t\.totalAmount, 0\);\s*useEffect\(\(\) => \{/g,
    `const totalIn = history.filter(t => t.type === 'IN' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.totalAmount, 0);
      const totalOut = history.filter(t => t.type === 'OUT' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.totalAmount, 0);
      const currentBalance = 100000 + totalIn - totalOut;
      useEffect(() => {`
);

fs.writeFileSync('frontend/src/pages/Dashboard.tsx', dash, 'utf8');
console.log("Restored currentBalance to PhonePeDashboard");
