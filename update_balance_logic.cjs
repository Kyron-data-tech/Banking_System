const fs = require('fs');
let dash = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');

// 1. PhonePeDashboard Fixes
dash = dash.replace(
    /const PhonePeDashboard = \(\{ verifiedUpiId \}: \{ verifiedUpiId: string \| null \}\) => \{/,
    `const PhonePeDashboard = ({ verifiedUpiId }: { verifiedUpiId: string | null }) => {`
);

// We need to insert the balance calculation and the activeTab reset
dash = dash.replace(
    /useEffect\(\(\) => \{\s*const email = backendUser\?.email/g,
    `useEffect(() => {
        setBalanceVisible(false);
    }, [activeTab]);

    const totalIn = history.filter(t => t.type === 'IN' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.totalAmount, 0);
    const totalOut = history.filter(t => t.type === 'OUT' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.totalAmount, 0);
    const currentBalance = 100000 + totalIn - totalOut;

    useEffect(() => {
      const email = backendUser?.email`
);

// Replace hardcoded ?124,500.00
dash = dash.replace(
    /<h2 className="text-4xl font-extrabold tracking-tight">?124,500<span className="text-lg text-blue-200">\.00<\/span><\/h2>/g,
    `<h2 className="text-4xl font-extrabold tracking-tight">?{currentBalance.toLocaleString('en-IN')}<span className="text-lg text-blue-200">.00</span></h2>`
);

// 2. MerchantDashboard Fixes
// Add state and calculated values
dash = dash.replace(
    /const MerchantDashboard = \(\{ verifiedUpiId \}: \{ verifiedUpiId: string \| null \}\) => \{[\s\S]*?const \[activeTab, setActiveTab\] = useState\('history'\);/g,
    `const MerchantDashboard = ({ verifiedUpiId }: { verifiedUpiId: string | null }) => {
    const { user } = useUser();
    const { user: backendUser } = useAuth();
    const [activeTab, setActiveTab] = useState('history');
    
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
        }, 1500);
    };

    useEffect(() => {
        setBalanceVisible(false);
    }, [activeTab]);
`
);

dash = dash.replace(
    /const \[refresh, setRefresh\] = useState\(0\);\s*const \[incomingToast, setIncomingToast\] = useState/g,
    `const [refresh, setRefresh] = useState(0);

    const totalCollections = history.filter(t => t.type === 'IN' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.totalAmount, 0);
    const txCount = history.filter(t => t.type === 'IN' && t.status === 'COMPLETED').length;

    const [incomingToast, setIncomingToast] = useState`
);

// Replace hardcoded merchant HTML block
const oldMerchantHtml = `<div>
                    <p className="text-indigo-200 text-sm font-medium mb-1">Today's Collections</p>
                    <h2 className="text-4xl font-extrabold tracking-tight">?34,250<span className="text-lg text-indigo-300">.00</span></h2>
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
            </div>`;

const newMerchantHtml = `<div>
                    <p className="text-indigo-200 text-sm font-medium mb-1">Total Collections</p>
                    {balanceVisible ? (
                       <h2 className="text-4xl font-extrabold tracking-tight">?{totalCollections.toLocaleString('en-IN')}<span className="text-lg text-indigo-300">.00</span></h2>
                    ) : (
                       <div className="mt-2">
                         <button onClick={() => setShowBalanceModal(true)} className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-sm border border-white/20">
                           <ShieldCheck size={16} /> View Collections
                         </button>
                       </div>
                    )}
                  </div>
                  <div className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <TrendingUp size={12} /> +14.5%
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                    <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider mb-1">Transactions</p>
                    <p className="font-bold text-lg">{txCount}</p>
                  </div>
                  <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                    <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider mb-1">Settlements</p>
                    <p className="font-bold text-lg text-emerald-400">Clear</p>
                  </div>
                </div>
              </div>
            </div>
            
          <Modal isOpen={showBalanceModal} onClose={() => setShowBalanceModal(false)} title="Verify Merchant PIN">
            <div className="text-center">
               <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <ShieldCheck size={32} />
               </div>
               <h3 className="font-bold text-slate-800 text-lg mb-2">Enter UPI PIN</h3>
               <p className="text-slate-500 text-sm mb-6">Enter your 6-digit MPIN to securely view your total collections.</p>
               
               {balanceError && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded-lg">{balanceError}</p>}
               
               <input 
                 type="password" 
                 maxLength={6} 
                 pattern="[0-9]{6}" 
                 value={balanceMpin} 
                 onChange={e => setBalanceMpin(e.target.value)} 
                 placeholder="------" 
                 className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-center tracking-[1em] text-2xl font-bold outline-none mb-6 focus:ring-2 focus:ring-indigo-500" 
               />
               
               <button 
                 onClick={handleCheckBalance} 
                 disabled={checkingBalance || balanceMpin.length !== 6} 
                 className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-md disabled:opacity-70"
               >
                 {checkingBalance ? (
                    <><Activity className="animate-spin" size={20} /> Verifying PIN...</>
                 ) : (
                    'Verify & View Collections'
                 )}
               </button>
            </div>
          </Modal>
`;

dash = dash.replace(oldMerchantHtml, newMerchantHtml);

fs.writeFileSync('frontend/src/pages/Dashboard.tsx', dash, 'utf8');
console.log("Updated Logic for dynamic balance and MPIN hiding");
