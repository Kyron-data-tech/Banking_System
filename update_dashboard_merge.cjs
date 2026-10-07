const fs = require('fs');
let dash = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');

dash = dash.replace(
    /const allTxs = \[\.\.\.outs, \.\.\.ins\];/g,
    'const allTxs = [...ins, ...outs]; // Prefer OUT if same id'
);

fs.writeFileSync('frontend/src/pages/Dashboard.tsx', dash, 'utf8');
console.log("Updated Dashboard array merge");
