const fs = require('fs');
let dash = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');

const merchantCardHtml = `
          <div className="bg-gradient-to-br from-indigo-700 to-purple-800 rounded-3xl p-6 text-white shadow-2xl mb-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-indigo-200 text-sm font-medium mb-1">Today's Collections</p>
                  <h2 className="text-4xl font-extrabold tracking-tight">,34,250<span className="text-lg text-indigo-300">.00</span></h2>
                </div>
                <div className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <TrendingUp size={12} /> +14.5%
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                  <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider mb-1">Transactions</p>
                  <p className="font-bold text-lg">142</p>
                </div>
                <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                  <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider mb-1">Settlements</p>
                  <p className="font-bold text-lg text-emerald-400">Clear</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
            <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
               <Layers size={16} className="text-indigo-600" /> Vendor Payouts (Smart Split)
            </h3>
`;

dash = dash.replace(
    /\{activeTab === 'pay' && \(\s*<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">\s*<h3 className="font-bold text-slate-800 mb-4 text-sm">Vendor Payouts \(Smart Split\)<\/h3>\s*<SmartPayForm onComplete=\{\(\) => setRefresh\(r => r \+ 1\)\} \/>\s*<\/div>\s*\)/g,
    `{activeTab === 'pay' && (
        <div className="animate-fade-in">
${merchantCardHtml}
            <SmartPayForm onComplete={() => setRefresh(r => r + 1)} />
          </div>
        </div>
      )}`
);

fs.writeFileSync('frontend/src/pages/Dashboard.tsx', dash, 'utf8');
console.log("Injected Merchant Stats Card");
