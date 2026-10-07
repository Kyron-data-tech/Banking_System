const fs = require('fs');
let dash = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');

dash = dash.replace(
    /Today's Collections<\/p>\s*<h2 className="text-4xl font-extrabold tracking-tight">,34,250<span className="text-lg text-indigo-300">\.00<\/span><\/h2>\s*<\/div>/g,
    `Total Collections</p>
                    {balanceVisible ? (
                       <h2 className="text-4xl font-extrabold tracking-tight">?{totalCollections.toLocaleString('en-IN')}<span className="text-lg text-indigo-300">.00</span></h2>
                    ) : (
                       <div className="mt-2">
                         <button onClick={() => setShowBalanceModal(true)} className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-sm border border-white/20">
                           <ShieldCheck size={16} /> View Collections
                         </button>
                       </div>
                    )}
                  </div>`
);

dash = dash.replace(
    /<p className="font-bold text-lg">142<\/p>/g,
    '<p className="font-bold text-lg">{txCount}</p>'
);

fs.writeFileSync('frontend/src/pages/Dashboard.tsx', dash, 'utf8');
console.log("Fixed HTML for Merchant Dashboard");
