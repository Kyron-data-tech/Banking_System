const fs = require('fs');
let dash = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');

const regex = /const MobileDashboardLayout = \(\{\s*title,\s*upiId,\s*children,\s*activeTab,\s*setActiveTab\s*\}\s*:\s*any\)\s*=>\s*\{[\s\S]*?return \([\s\S]*?className="max-w-md mx-auto bg-white\/80 backdrop-blur-xl min-h-\[90vh\] sm:rounded-\[40px\] shadow-2xl border border-white\/40 mt-4 sm:my-8 overflow-hidden flex flex-col animate-slide-up relative z-10"[\s\S]*?<\/div>\r?\n\s*\);\r?\n\s*\};/g;

const newLayout = `const MobileDashboardLayout = ({ title, upiId, children, activeTab, setActiveTab }: any) => {
  const { logout, user: backendUser } = useAuth();
  const { user: clerkUser } = useUser();
  
  const handleLogout = () => {
    if (backendUser) logout();
  };

  return (
    <div className="w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto bg-white/80 backdrop-blur-xl min-h-[100vh] md:min-h-[85vh] md:rounded-[40px] shadow-2xl border border-white/40 mt-0 md:mt-8 overflow-hidden flex flex-col md:flex-row animate-slide-up relative z-10">
      
      {/* LEFT PANEL: Mobile Header / Desktop Sidebar */}
      <div className="md:w-80 bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col relative z-20 shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-8 text-white rounded-b-[40px] md:rounded-b-none md:rounded-br-[40px] shadow-lg relative z-10">
          <div className="flex justify-between md:justify-center items-center mb-4 md:mb-6">
            <h2 className="font-bold text-lg md:text-2xl">{title}</h2>
            <div className="flex md:hidden items-center gap-3">
              {clerkUser && <UserButton />}
              {backendUser && (
                <button onClick={handleLogout} className="text-white hover:text-blue-200">
                  <LogOut size={20} />
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-inner mb-3">
              <span className="text-blue-600 font-extrabold text-2xl md:text-4xl">
                {(backendUser?.fullName || clerkUser?.fullName || 'K').charAt(0)}
              </span>
            </div>
            <p className="font-bold text-white md:text-xl">{backendUser?.fullName || clerkUser?.fullName || 'Kyro User'}</p>
            <div className="mt-2 bg-white/20 rounded-xl p-2 border border-white/30 backdrop-blur-md">
              <p className="text-xs text-blue-100 uppercase font-bold tracking-wider mb-0.5 text-center">Your UPI ID</p>
              <p className="text-sm font-bold truncate px-2">{upiId}</p>
            </div>
          </div>
        </div>
        
        {/* DESKTOP NAVIGATION SIDEBAR */}
        <div className="hidden md:flex flex-col gap-2 p-6 flex-1 mt-4">
          <div className={\`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 \${activeTab === 'pay' ? 'bg-blue-600 shadow-lg scale-105' : 'hover:bg-white/10 text-slate-300 hover:text-white'}\`} onClick={() => setActiveTab('pay')}>
            <Activity size={24} /> <span className="font-bold text-lg">Payments</span>
          </div>
          <div className={\`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 \${activeTab === 'history' ? 'bg-blue-600 shadow-lg scale-105' : 'hover:bg-white/10 text-slate-300 hover:text-white'}\`} onClick={() => setActiveTab('history')}>
            <HistoryIcon size={24} /> <span className="font-bold text-lg">Transaction History</span>
          </div>
          <div className={\`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 \${activeTab === 'contact' ? 'bg-blue-600 shadow-lg scale-105' : 'hover:bg-white/10 text-slate-300 hover:text-white'}\`} onClick={() => setActiveTab('contact')}>
            <Users size={24} /> <span className="font-bold text-lg">Contacts & Split</span>
          </div>
          <div className={\`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 \${activeTab === 'qr' ? 'bg-blue-600 shadow-lg scale-105' : 'hover:bg-white/10 text-slate-300 hover:text-white'}\`} onClick={() => setActiveTab('qr')}>
            <QrCode size={24} /> <span className="font-bold text-lg">My QR Code</span>
          </div>
          <div className={\`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 \${activeTab === 'developer' ? 'bg-blue-600 shadow-lg scale-105' : 'hover:bg-white/10 text-slate-300 hover:text-white'}\`} onClick={() => setActiveTab('developer')}>
            <ShieldCheck size={24} /> <span className="font-bold text-lg">API Settings</span>
          </div>
          
          <div className="mt-auto">
             <div className="flex items-center justify-between mt-8 p-4 bg-slate-900/50 rounded-2xl border border-slate-700">
               <div className="flex items-center gap-3">
                  {clerkUser && <UserButton />}
                  <span className="text-xs text-slate-400 font-bold">Account</span>
               </div>
               {backendUser && (
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition">
                  <LogOut size={20} />
                </button>
               )}
             </div>
          </div>
        </div>
      </div>
      
      {/* MAIN CONTENT AREA */}
      <div className="p-6 pt-6 md:p-10 flex-1 overflow-y-auto bg-slate-50/50 relative">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </div>
      
      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden bg-white border-t border-slate-200 p-4 shrink-0 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] relative z-20">
        <div className="flex justify-between px-2">
          <div className="flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-110 active:scale-95" onClick={() => setActiveTab('developer')}>
            <ShieldCheck size={24} className={activeTab === 'developer' ? 'text-blue-600' : 'text-slate-400'} />
            <span className="text-[10px] font-bold text-slate-600">Dev</span>
          </div>
          <div className="flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-110 active:scale-95" onClick={() => setActiveTab('qr')}>
            <QrCode size={24} className={activeTab === 'qr' ? 'text-blue-600' : 'text-slate-400'} />
            <span className="text-[10px] font-bold text-slate-600">QR Code</span>
          </div>
          <div className="flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-110 active:scale-95" onClick={() => setActiveTab('contact')}>
            <Users size={24} className={activeTab === 'contact' ? 'text-blue-600' : 'text-slate-400'} />
            <span className="text-[10px] font-bold text-slate-600">Contacts</span>
          </div>
          <div className="flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-110 active:scale-95" onClick={() => setActiveTab('pay')}>
            <Activity size={24} className={activeTab === 'pay' ? 'text-blue-600' : 'text-slate-400'} />
            <span className="text-[10px] font-bold text-slate-600">Pay</span>
          </div>
          <div className="flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-110 active:scale-95" onClick={() => setActiveTab('history')}>
            <HistoryIcon size={24} className={activeTab === 'history' ? 'text-blue-600' : 'text-slate-400'} />
            <span className="text-[10px] font-bold text-slate-600">History</span>
          </div>
        </div>
      </div>
    </div>
  );
};`;

const originalLayoutStr = dash.match(regex);
if (originalLayoutStr && originalLayoutStr.length > 0) {
    dash = dash.replace(originalLayoutStr[0], newLayout);
    fs.writeFileSync('frontend/src/pages/Dashboard.tsx', dash, 'utf8');
    console.log("Successfully rewrote MobileDashboardLayout to responsive!");
} else {
    console.log("Failed to match MobileDashboardLayout using Regex.");
}
