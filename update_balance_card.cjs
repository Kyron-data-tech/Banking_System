const fs = require('fs');
let dash = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');

const balanceCardHtml = `
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400/20 rounded-full blur-xl transform -translate-x-5 translate-y-5" />
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Available Balance</p>
                <h2 className="text-4xl font-extrabold tracking-tight">,124,500<span className="text-lg text-blue-200">.00</span></h2>
                <p className="text-xs text-blue-200 mt-2 flex items-center gap-1">
                  <Activity size={12} /> Updated Just Now
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                <CreditCard size={24} className="text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
            <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
               <Activity size={16} className="text-blue-600" /> Send Money Instantly
            </h3>
`;

dash = dash.replace(
    /\{activeTab === 'pay' && \(\s*<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">\s*<SmartPayForm onComplete=\{\(\) => setRefresh\(r => r \+ 1\)\} \/>\s*<\/div>\s*\)/g,
    `{activeTab === 'pay' && (
        <div className="animate-fade-in">
${balanceCardHtml}
            <SmartPayForm onComplete={() => setRefresh(r => r + 1)} />
          </div>
        </div>
      )}`
);

fs.writeFileSync('frontend/src/pages/Dashboard.tsx', dash, 'utf8');
console.log("Injected Beautiful Balance Card");
