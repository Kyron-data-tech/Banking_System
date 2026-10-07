const fs = require('fs');
let dash = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');

dash = dash.replace(
    /<div className="flex h-screen bg-slate-50 overflow-hidden font-sans">/,
    '<div className="flex h-screen bg-white/50 backdrop-blur-3xl overflow-hidden font-sans relative z-10">'
);

fs.writeFileSync('frontend/src/pages/Dashboard.tsx', dash, 'utf8');
console.log("Updated Desktop Dashboard theme");
