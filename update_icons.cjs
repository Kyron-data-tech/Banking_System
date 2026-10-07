const fs = require('fs');
let dash = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');

dash = dash.replace(
    /className="flex flex-col items-center gap-1 cursor-pointer"/g,
    'className="flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-110 active:scale-95"'
);

fs.writeFileSync('frontend/src/pages/Dashboard.tsx', dash, 'utf8');
console.log("Updated Icon hover states");
