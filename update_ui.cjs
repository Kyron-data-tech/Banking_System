const fs = require('fs');
let dash = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');

// 1. We need to add state to PhonePeDashboard.
// Search for PhonePeDashboard declaration
const phonePeRegex = /(const PhonePeDashboard = \(\{ verifiedUpiId \}: \{ verifiedUpiId: string \| null \}\) => \{)/;
dash = dash.replace(phonePeRegex, `$1
    const [balanceVisible, setBalanceVisible] = useState(false);
    const [checkingBalance, setCheckingBalance] = useState(false);
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [balanceMpin, setBalanceMpin] = useState('');
    const [balanceError, setBalanceError] = useState('');

    const handleCheckBalance = () => {
        if (!balanceMpin || balanceMpin.length !== 6) {
            setBalanceError('Please enter a valid 6-digit MPIN');
            return;
        }
        setCheckingBalance(true);
        setBalanceError('');
        setTimeout(() => {
            setCheckingBalance(false);
            setShowBalanceModal(false);
            setBalanceVisible(true);
            setBalanceMpin('');
        }, 1500); // simulate network verification
    };
`);

// 2. We need to update the Balance Card HTML.
const oldBalanceHTMLRegex = /<div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newBalanceHTML = `<div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400/20 rounded-full blur-xl transform -translate-x-5 translate-y-5" />
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Available Balance</p>
                {balanceVisible ? (
                  <>
                    <h2 className="text-4xl font-extrabold tracking-tight">?124,500<span className="text-lg text-blue-200">.00</span></h2>
                    <p className="text-xs text-blue-200 mt-2 flex items-center gap-1">
                      <Activity size={12} /> Updated Just Now
                    </p>
                  </>
                ) : (
                  <div className="mt-2">
                    <button onClick={() => setShowBalanceModal(true)} className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-sm border border-white/20">
                      <ShieldCheck size={16} /> Check Balance
                    </button>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                <CreditCard size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <Modal isOpen={showBalanceModal} onClose={() => setShowBalanceModal(false)} title="Check Bank Balance">
            <div className="text-center">
               <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <ShieldCheck size={32} />
               </div>
               <h3 className="font-bold text-slate-800 text-lg mb-2">Enter UPI PIN</h3>
               <p className="text-slate-500 text-sm mb-6">Enter your 6-digit MPIN to securely view your account balance.</p>
               
               {balanceError && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded-lg">{balanceError}</p>}
               
               <input 
                 type="password" 
                 maxLength={6} 
                 pattern="[0-9]{6}" 
                 value={balanceMpin} 
                 onChange={e => setBalanceMpin(e.target.value)} 
                 placeholder="------" 
                 className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-center tracking-[1em] text-2xl font-bold outline-none mb-6 focus:ring-2 focus:ring-blue-500" 
               />
               
               <button 
                 onClick={handleCheckBalance} 
                 disabled={checkingBalance || balanceMpin.length !== 6} 
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-md disabled:opacity-70"
               >
                 {checkingBalance ? (
                    <><Activity className="animate-spin" size={20} /> Verifying PIN...</>
                 ) : (
                    'Verify & Check Balance'
                 )}
               </button>
            </div>
          </Modal>`;

dash = dash.replace(oldBalanceHTMLRegex, newBalanceHTML);

// 3. Fix the sidebar overflow issue in MobileDashboardLayout
// The sidebar has: className="hidden md:flex flex-col gap-2 p-6 flex-1 mt-4"
// We need to add overflow-y-auto so that the bottom items are not cut off.
dash = dash.replace(
    'className="hidden md:flex flex-col gap-2 p-6 flex-1 mt-4"',
    'className="hidden md:flex flex-col gap-2 p-6 flex-1 mt-4 overflow-y-auto pb-8 scrollbar-hide"'
);
dash = dash.replace(
    'mt-auto',
    'mt-auto pt-6'
);

fs.writeFileSync('frontend/src/pages/Dashboard.tsx', dash, 'utf8');
console.log("Updated Balance Card and Sidebar Overflow");
