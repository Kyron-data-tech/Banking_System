const fs = require('fs');
let dash = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');

dash = dash.replace(
    /className="max-w-md mx-auto bg-slate-50 min-h-\[90vh\] rounded-3xl shadow-lg border border-slate-200 mt-4 \r?\n?overflow-hidden flex flex-col"/g,
    'className="max-w-md mx-auto bg-white/80 backdrop-blur-xl min-h-[90vh] sm:rounded-[40px] shadow-2xl border border-white/40 mt-4 sm:my-8 overflow-hidden flex flex-col animate-slide-up relative z-10"'
);

dash = dash.replace(
    /className="bg-purple-700 p-6 text-white text-center rounded-b-3xl shadow-md z-10 relative"/g,
    'className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center rounded-b-[40px] shadow-lg z-10 relative"'
);

dash = dash.replace(
    /className="bg-purple-800\/50 rounded-xl p-3 border border-purple-600"/g,
    'className="bg-white/20 rounded-xl p-3 border border-white/30 backdrop-blur-md"'
);

dash = dash.replace(
    /text-purple-600/g,
    'text-blue-600'
);

dash = dash.replace(
    /bg-purple-600/g,
    'bg-blue-600'
);

dash = dash.replace(
    /hover:bg-purple-700/g,
    'hover:bg-blue-700'
);

dash = dash.replace(
    /bg-purple-100/g,
    'bg-blue-100'
);

dash = dash.replace(
    /text-purple-200/g,
    'text-blue-100'
);

fs.writeFileSync('frontend/src/pages/Dashboard.tsx', dash, 'utf8');
console.log("Updated Dashboard theme to glassmorphism blue/indigo");
