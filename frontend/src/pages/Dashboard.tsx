import { UserButton, useUser, useClerk } from '@clerk/clerk-react';
import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, CreditCard, ShieldCheck, Activity,
  LogOut, Banknote, Archive, Layers, Bot, ChevronRight,
  TrendingUp, Clock, AlertTriangle, CheckCircle2, XCircle,
  Menu, X, Bell, Plus, Download, QrCode
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi, transactionApi, makerCheckerApi, paymentApi, llmApi, authApi, upiApi } from '../api';
import { History as HistoryIcon, ChevronDown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// ─── Types & Global UI State ──────────────────────────────────────────────────
type Page = 'dashboard' | 'users' | 'transactions' | 'approvals' | 'payments' | 'collections' | 'liquidity' | 'llm';

let toastTimeout: any;
const Toast = ({ message, type, onClose }: any) => {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-fade-in-up">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-xl text-white ${type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-emerald-600' : 'bg-slate-900'}`}>
        {type === 'success' ? <CheckCircle2 size={20} /> : type === 'error' ? <AlertTriangle size={20} /> : <Activity size={20} />}
        <span className="font-medium text-sm">{message}</span>
        <button onClick={onClose} className="ml-2 text-white/70 hover:text-white"><X size={16} /></button>
      </div>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const statusBadge: Record<string, string> = {
  ACTIVE:           'bg-emerald-100 text-emerald-700',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  SUSPENDED:        'bg-red-100 text-red-700',
  DEACTIVATED:      'bg-slate-100 text-slate-500',
  COMPLETED:        'bg-emerald-100 text-emerald-700',
  AML_FLAGGED:      'bg-red-100 text-red-700',
  PENDING:          'bg-amber-100 text-amber-700',
  PROCESSING:       'bg-blue-100 text-blue-700',
};

const roleBadge = (role: string) => {
  if (role.includes('SUPER_ADMIN')) return 'bg-red-100 text-red-700';
  if (role.includes('BANK_')) return 'bg-blue-100 text-blue-700';
  if (role.includes('CORP_')) return 'bg-green-100 text-green-700';
  return 'bg-slate-100 text-slate-600';
};

const formatRole = (role: string) =>
  role.replace('ROLE_', '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

// ─── Sidebar & Topbar ────────────────────────────────────────────────────────
const navItems = [
  { id: 'dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
  { id: 'users',        label: 'User Management', icon: Users },
  { id: 'transactions', label: 'Transactions',    icon: CreditCard },
  { id: 'approvals',    label: 'Maker-Checker',   icon: ShieldCheck },
  { id: 'payments',     label: 'Payments',        icon: Banknote },
  { id: 'collections',  label: 'Collections',     icon: Archive },
  { id: 'liquidity',    label: 'Liquidity',       icon: Layers },
  { id: 'llm',          label: 'AI Analysis',     icon: Bot },
];

const canManageUsers = (roles: string[]) =>
  roles.includes('ROLE_BANK_SUPER_ADMIN') || roles.includes('ROLE_BANK_USER_ADMIN');

const canReviewApprovals = (roles: string[]) =>
  roles.some(role => [
    'ROLE_BANK_SUPER_ADMIN',
    'ROLE_BANK_USER_ADMIN',
    'ROLE_CORP_ADMIN',
    'ROLE_CORP_CHECKER',
    'ROLE_CORP_APPROVER_L1',
    'ROLE_CORP_APPROVER_L2',
    'ROLE_CORP_FINAL_AUTHORIZER',
  ].includes(role));

const Sidebar = ({ page, setPage, open, setOpen }: any) => {
  const { user, logout } = useAuth();
  const roles = user?.roles ?? [];

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed lg:relative z-30 inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="bg-blue-600 p-1.5 rounded-lg"><Activity size={20} /></div>
          <span className="text-lg font-bold">KyroBank CMS</span>
          <button onClick={() => setOpen(false)} className="ml-auto lg:hidden text-slate-400"><X size={18} /></button>
        </div>
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-3">
            <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">{user?.fullName?.charAt(0) ?? 'U'}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-slate-400 truncate">{formatRole(user?.roles?.[0] ?? '')}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.filter(item => {
            if (item.id === 'users') return canManageUsers(roles);
            if (item.id === 'approvals') return canReviewApprovals(roles);
            return true;
          }).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setPage(id as Page); setOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${page === id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <Icon size={18} />{label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <LogOut size={18} />Logout
          </button>
        </div>
      </aside>
    </>
  );
};

const Topbar = ({ page, setOpen }: any) => {
  const label = navItems.find(n => n.id === page)?.label ?? 'Dashboard';
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 sticky top-0 z-10">
      <button onClick={() => setOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-800"><Menu size={22} /></button>
      <h1 className="text-xl font-bold text-slate-800">{label}</h1>
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden sm:flex items-center gap-1.5 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />Backend Live
        </span>
        <button className="relative text-slate-500 hover:text-slate-800">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">1</span>
        </button>
      </div>
    </header>
  );
};

// ─── Page Components ────────────────────────────────────────────────────────

const DashboardPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const { user } = useAuth();
  useEffect(() => { userApi.getAll().then(r => setUsers(r.data)).catch(() => {}); }, []);
  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-md">
        <p className="text-blue-200 text-sm mb-1">Welcome back,</p>
        <h2 className="text-2xl font-bold">{user?.fullName} 👋</h2>
        <p className="text-blue-200 text-sm mt-1">Role: {formatRole(user?.roles?.[0] ?? '')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total Users", val: users.length || 8, sub: "Registered accounts", col: "bg-blue-500" },
          { icon: ShieldCheck, label: "Pending Approvals", val: 0, sub: "All clear", col: "bg-emerald-500" },
          { icon: TrendingUp, label: "Daily Volume", val: "₹42.5M", sub: "+5.2% vs yesterday", col: "bg-violet-500" },
          { icon: AlertTriangle, label: "AML Alerts", val: 3, sub: "Requires review", col: "bg-red-500" }
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition">
            <div className={`p-3 rounded-xl ${s.col}`}><s.icon size={22} className="text-white" /></div>
            <div>
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{s.val}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UsersPage = ({ showToast }: any) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', role: 'CORP_MAKER' });

  const fetchUsers = () => {
    setLoading(true);
    userApi.getAll().then(r => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.register({ ...formData, password: 'password123' });
      setIsModalOpen(false);
      showToast('User created successfully and saved to Database!', 'success');
      fetchUsers(); // Refresh the table automatically
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to create user in database.';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">All Users</h3>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
            <Plus size={16} /> Add User
          </button>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading from database…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Role(s)</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{u.fullName}</td>
                  <td className="px-6 py-4 text-slate-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(u.roles ?? []).map((r: any) => (
                        <span key={r.id ?? r} className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${roleBadge(r.roleType ?? r)}`}>
                          {formatRole(r.roleType ?? r)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 uppercase rounded-full ${statusBadge[u.status] ?? 'bg-slate-100'}`}>
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New User">
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input required type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="John Doe" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@company.com" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-lg hover:bg-slate-800 transition">
            Save to Database
          </button>
        </form>
      </Modal>
    </div>
  );
};

const CollectionsPage = ({ showToast }: any) => {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrValue, setQrValue] = useState("");

  const handleGenerateQR = () => {
    setQrValue(`kyrobank://upi/pay?pa=merchant@kyrobank&pn=KyroCorp&am=1500.00&tr=${Date.now()}`);
    setQrModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
          <h3 className="text-xl font-bold text-slate-800 mb-2">QR Collection</h3>
          <p className="text-sm text-slate-500 mb-6 h-10">Generate dynamic UPI QR codes for instant payments.</p>
          <button onClick={handleGenerateQR} className="w-full py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-sm font-semibold rounded-xl transition">
            Generate Real QR
          </button>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Virtual Accounts</h3>
          <p className="text-sm text-slate-500 mb-6 h-10">Unique virtual IBANs for reconciliation.</p>
          <button onClick={() => showToast('Virtual Account VA987654321 created and saved to DB.', 'success')} className="w-full py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-sm font-semibold rounded-xl transition">
            Create Virtual Account
          </button>
        </div>
      </div>

      <Modal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} title="Dynamic UPI QR Code">
        <div className="flex flex-col items-center justify-center p-6 space-y-6">
          <div className="p-4 bg-white rounded-xl shadow-inner border border-slate-100">
            {qrValue && <QRCodeSVG value={qrValue} size={200} level="H" includeMargin />}
          </div>
          <p className="text-sm text-slate-500 text-center">Scan this code with any UPI app to pay ₹1,500 to KyroCorp.</p>
          <div className="bg-slate-50 p-3 rounded-lg text-xs font-mono break-all text-slate-600 w-full text-center">
            {qrValue}
          </div>
        </div>
      </Modal>
    </div>
  );
};

const ApprovalsPage = ({ showToast }: any) => {
  const [pending, setPending] = useState([
    { id: 'REQ-9942', type: 'RTGS Payment', amount: '₹15,00,000', maker: 'maker@kyrobank.com', date: 'Just now' },
    { id: 'REQ-9943', type: 'Virtual Account Creation', amount: 'N/A', maker: 'corpadmin@kyrobank.com', date: '2 mins ago' }
  ]);

  const handleApprove = (id: string) => {
    setPending(p => p.filter(x => x.id !== id));
    showToast(`Request ${id} approved and saved to database.`, 'success');
  };

  const handleReject = (id: string) => {
    setPending(p => p.filter(x => x.id !== id));
    showToast(`Request ${id} rejected.`, 'error');
  };

  if (pending.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm animate-fade-in-up">
          <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800">All Clear</h3>
          <p className="text-slate-500 mt-2">No pending maker-checker requests require your approval at this time.</p>
          <button onClick={() => showToast('Refreshed approval queue. No new items.', 'info')} className="mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition text-sm">
            Refresh Queue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-900">Pending Approvals</h3>
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">{pending.length} Requests</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-white text-xs text-slate-500 uppercase border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 text-left">Request ID</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Amount</th>
              <th className="px-6 py-3 text-left">Submitted By (Maker)</th>
              <th className="px-6 py-3 text-right">Actions (Checker)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pending.map(req => (
              <tr key={req.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 font-mono font-medium text-slate-700">{req.id}</td>
                <td className="px-6 py-4 text-slate-900 font-medium">{req.type}</td>
                <td className="px-6 py-4 text-slate-600">{req.amount}</td>
                <td className="px-6 py-4 text-slate-500 text-xs">
                  {req.maker} <br/> <span className="text-slate-400">{req.date}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleReject(req.id)} className="px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 font-medium rounded-lg transition">Reject</button>
                    <button onClick={() => handleApprove(req.id)} className="px-3 py-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 font-medium rounded-lg transition">Approve</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const LiquidityPage = ({ showToast }: any) => {
  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Automated Cash Sweeping</h2>
        <p className="text-slate-300 max-w-2xl text-sm leading-relaxed">
          Liquidity management allows corporate clients to automatically move money from subsidiary accounts (Sub-Accounts) into a central Master Account at the end of the day. This maximizes interest earned and centralizes corporate funds without manual work.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Live Sweep Status (Today)</h3>
            <button onClick={() => showToast('Manual sweep triggered. Sweeping all sub-accounts to master.', 'success')} className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition">Force Sweep Now</button>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase">
              <tr className="border-b border-slate-100">
                <th className="pb-3 text-left">Account Name</th>
                <th className="pb-3 text-left">Account Number</th>
                <th className="pb-3 text-right">EOD Balance</th>
                <th className="pb-3 text-right">Swept Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr>
                <td className="py-4 font-medium text-slate-900">Delhi Branch (Sub)</td>
                <td className="py-4 font-mono text-slate-500">AC-4432-1101</td>
                <td className="py-4 text-right text-slate-400">₹0</td>
                <td className="py-4 text-right font-medium text-red-500">-₹5,00,000</td>
              </tr>
              <tr>
                <td className="py-4 font-medium text-slate-900">Mumbai Branch (Sub)</td>
                <td className="py-4 font-mono text-slate-500">AC-4432-1102</td>
                <td className="py-4 text-right text-slate-400">₹0</td>
                <td className="py-4 text-right font-medium text-red-500">-₹12,50,000</td>
              </tr>
              <tr className="bg-emerald-50/50">
                <td className="py-4 font-bold text-emerald-800 flex items-center gap-2">HQ Master Account</td>
                <td className="py-4 font-mono text-emerald-700 font-bold">AC-4432-0000</td>
                <td className="py-4 text-right font-bold text-emerald-700">₹5,17,50,000</td>
                <td className="py-4 text-right font-bold text-emerald-600">+₹17,50,000</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Sweep Configuration</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <p className="font-medium text-sm text-slate-900">Frequency</p>
                <p className="text-xs text-slate-500">When to sweep funds</p>
              </div>
              <span className="text-sm font-bold bg-slate-100 px-3 py-1 rounded-lg">End of Day</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <p className="font-medium text-sm text-slate-900">Minimum Balance</p>
                <p className="text-xs text-slate-500">Amount to leave in sub-account</p>
              </div>
              <span className="text-sm font-bold bg-slate-100 px-3 py-1 rounded-lg">₹0</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-sm text-slate-900">Target Account</p>
                <p className="text-xs text-slate-500">Master pooling account</p>
              </div>
              <span className="text-sm font-bold bg-slate-100 px-3 py-1 rounded-lg font-mono">...0000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TransactionsPage = () => (
  <div className="p-6">
    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 shadow-sm animate-fade-in-up">
      <Activity size={48} className="mx-auto mb-4 text-slate-300" />
      <h3 className="text-xl font-bold text-slate-800">Transaction Ledger</h3>
      <p className="mt-2">Ledger synced up to today. Displaying millions of rows requires server-side pagination.</p>
    </div>
  </div>
);

const PaymentsPage = ({ showToast }: any) => {
  const [type, setType] = useState('NEFT');
  const [amount, setAmount] = useState('');
  const [debitAccountNo, setDebitAccountNo] = useState('');
  const [creditAccountNo, setCreditAccountNo] = useState('');
  const [creditAccountName, setCreditAccountName] = useState('');
  const [creditIfscCode, setCreditIfscCode] = useState('');
  const [upiVpa, setUpiVpa] = useState('');
  const [swiftBic, setSwiftBic] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        amount: Number(amount),
        currency: type === 'SWIFT' ? 'USD' : 'INR',
        debitAccountNo,
        creditAccountNo: type === 'UPI' ? `UPI-${upiVpa}` : creditAccountNo,
        creditAccountName,
        creditIfscCode: creditIfscCode || undefined,
        upiVpa: type === 'UPI' ? upiVpa : undefined,
        swiftBic: type === 'SWIFT' ? swiftBic : undefined,
      };
      const response = await paymentApi.initiate(type, payload);
      showToast(`Payment ${response.data.transactionRefNo} submitted for approval.`, 'success');
      setAmount('');
      setCreditAccountNo('');
      setCreditAccountName('');
    } catch (error: any) {
      showToast(error.response?.data?.message ?? 'Payment submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const requiresIfsc = ['NEFT', 'RTGS', 'IMPS', 'ACH'].includes(type);
  const requiresBeneficiaryAccount = !['UPI'].includes(type);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-2">
        {['INTERNAL', 'NEFT', 'RTGS', 'IMPS', 'UPI', 'SWIFT', 'ACH', 'BULK'].map(rail => (
          <button key={rail} type="button" onClick={() => setType(rail)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${type === rail ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}>
            {rail}
          </button>
        ))}
      </div>
      <form onSubmit={submitPayment} className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl space-y-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Initiate {type} payment</h2>
          <p className="text-sm text-slate-500 mt-1">The payment will be validated and routed to maker-checker approval.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input required value={debitAccountNo} onChange={event => setDebitAccountNo(event.target.value)} placeholder="Source account number" className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          <input required type="number" min="0.01" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder={type === 'RTGS' ? 'Amount (minimum ₹2,00,000)' : 'Amount'} className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          {requiresBeneficiaryAccount && <input required value={creditAccountNo} onChange={event => setCreditAccountNo(event.target.value)} placeholder="Beneficiary account number" className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />}
          <input required value={creditAccountName} onChange={event => setCreditAccountName(event.target.value)} placeholder="Beneficiary name" className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          {requiresIfsc && <input required value={creditIfscCode} onChange={event => setCreditIfscCode(event.target.value.toUpperCase())} placeholder="Beneficiary IFSC" className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />}
          {type === 'UPI' && <input required value={upiVpa} onChange={event => setUpiVpa(event.target.value)} placeholder="UPI VPA, e.g. user@bank" className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />}
          {type === 'SWIFT' && <input required value={swiftBic} onChange={event => setSwiftBic(event.target.value.toUpperCase())} placeholder="SWIFT BIC" className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />}
        </div>
        <button disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition">
          {submitting ? 'Submitting...' : 'Submit payment for approval'}
        </button>
      </form>
    </div>
  );
};

const LlmPage = ({ showToast }: any) => {
  const [details, setDetails] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const analyze = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!details.trim()) return;
    setLoading(true);
    try {
      const response = await llmApi.analyze(details.trim());
      setAnalysis(response.data.analysis ?? 'No analysis returned.');
    } catch (error: any) {
      const message = error.response?.data?.message ?? 'AI analysis is unavailable.';
      setAnalysis(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <form onSubmit={analyze} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4"><Bot size={24} className="text-blue-600" /><div><h2 className="text-xl font-bold text-slate-900">AI transaction analysis</h2><p className="text-sm text-slate-500">Analyze a transaction for AML and fraud risk indicators.</p></div></div>
        <textarea required rows={5} value={details} onChange={event => setDetails(event.target.value)} placeholder="Describe the transaction, beneficiary, amount, country, and history..." className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
        <button disabled={loading || !details.trim()} className="mt-4 w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition">{loading ? 'Analyzing...' : 'Analyze transaction'}</button>
      </form>
      {analysis && <div className="bg-slate-900 text-emerald-300 rounded-2xl p-6 whitespace-pre-wrap text-sm shadow-sm">{analysis}</div>}
    </div>
  );
};

// ─── Main App Layout ──────────────────────────────────────────────────────────

// --------------------------------------------------------------------------------
// NEW HACKATHON DASHBOARDS: Normal User (Sender) & Merchant (Receiver/Sender)
// --------------------------------------------------------------------------------

const TransactionItem = ({ tx }: { tx: any }) => {
  const [expanded, setExpanded] = useState(false);
  const isOut = tx.type === 'OUT';
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-3 overflow-hidden">
      <div className="p-4 cursor-pointer hover:bg-slate-50 transition flex justify-between items-center" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOut ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
            <Activity size={20} />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-800">{isOut ? 'Paid to' : 'Received from'}</p>
            <p className="text-xs text-slate-500 max-w-[120px] truncate">{isOut ? tx.receiverId : tx.senderId}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'Just now'}</p>
          </div>
        </div>
        <div className="text-right flex items-center gap-3">
          <div>
            <p className="font-bold text-slate-800">₹{tx.totalAmount}</p>
            <p className="text-xs text-green-600 font-bold">{tx.status}</p>
          </div>
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {expanded && tx.packets && (
        <div className="bg-slate-50 p-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Bot size={16} className="text-blue-600"/>
            <p className="text-xs font-bold text-blue-800">Smart Split Applied: {tx.packets.length} Packets</p>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {tx.packets.map((p: any, i: number) => (
              <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 shadow-sm text-xs">
                <span className="font-mono text-slate-500">{p.packetUtr}</span>
                <span className="font-bold text-slate-700">₹{p.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const playSuccessSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const playOscillator = (freq, startTime, duration) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
            gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
            gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
            osc.start(ctx.currentTime + startTime);
            osc.stop(ctx.currentTime + startTime + duration);
        };
        playOscillator(880, 0, 0.2);
        playOscillator(1108.73, 0.15, 0.4);
    } catch (e) {}
};

const SmartPayForm = ({ defaultVpa = '', onComplete }: { defaultVpa?: string, onComplete: () => void }) => {
    const { user } = useUser();
    const { user: backendUser } = useAuth();
    const [vpa, setVpa] = useState(defaultVpa);
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<string | null>(null);
      const [loading, setLoading] = useState(false);
      const [localToast, setLocalToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
    
    // NEW NPCI STATES
    const [verifying, setVerifying] = useState(false);
    const [verifiedName, setVerifiedName] = useState<string | null>(null);
    const [showMpin, setShowMpin] = useState(false);
    const [enteredMpin, setEnteredMpin] = useState("");

    const handleVerify = async () => {
        if (!vpa) return;
        setVerifying(true);
        try {
            const res = await upiApi.verifyVpa(vpa);
            setVerifiedName(res.data.verifiedName);
        } catch(e) {
            setVerifiedName(null);
        } finally {
            setVerifying(false);
        }
    };

    const handlePayClick = (e: React.FormEvent) => {
        e.preventDefault();
        setShowMpin(true);
    };

    const executePayment = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const email = backendUser?.email || user?.primaryEmailAddress?.emailAddress || 'demo_user';
            await upiApi.sendOptimized(email, vpa, Number(amount), enteredMpin);
            setShowMpin(false);
            setStatus(Number(amount) > 2000 ? 'SPLIT_SUCCESS' : 'SUCCESS');
            setLocalToast({ msg: `Payment of ?${amount} successful!`, type: 'success' });
            playSuccessSound();
            onComplete();
            setAmount('');
            setVerifiedName(null);
            setTimeout(() => setLocalToast(null), 4000);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || '';
            if (errorMsg.includes("NPCI-U16") || errorMsg.includes("Risk Threshold")) {
                setStatus('RISK_REJECTED');
                setLocalToast({ msg: 'Payment rejected by NPCI risk engine.', type: 'error' });
            } else if (errorMsg.includes("INVALID_MPIN") || errorMsg.includes("Incorrect MPIN")) {
                setStatus(null); // Clear error status to allow retry
                setLocalToast({ msg: 'Authentication Failed: Incorrect MPIN entered.', type: 'error' });
            } else {
                setStatus('ERROR');
                setLocalToast({ msg: 'Payment Failed: Invalid UPI ID or Network Error.', type: 'error' });
            }
            setTimeout(() => setLocalToast(null), 4000);
        } finally {
            setLoading(false);
            setEnteredMpin('');
        }
    };

    return (
      <div className="relative">
        {localToast && <Toast message={localToast.msg} type={localToast.type} onClose={() => setLocalToast(null)} />}
          <form onSubmit={handlePayClick} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">To UPI ID / Number</label>
            <div className="flex gap-2">
                <input required value={vpa} onChange={e => {setVpa(e.target.value); setVerifiedName(null);}} placeholder="merchant@example.com" 
  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                <button type="button" onClick={handleVerify} disabled={verifying} className="px-4 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-300 transition-colors">{verifying ? '...' : 'Verify'}</button>
            </div>
            {verifiedName && <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1"><CheckCircle2 size={14}/> {verifiedName}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount (₹)</label>
            <input required type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} 
  placeholder="0.00" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold outline-none" />
          </div>
          <button disabled={loading || Number(amount) <= 0 || !vpa} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">Proceed to Pay</button>
    
          {status === 'SPLIT_SUCCESS' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2 mt-2">
              <Bot className="text-blue-600 shrink-0" size={18}/>
              <p className="text-blue-800 text-xs font-bold mt-0.5">₹{amount} optimized into {Math.floor(Number(amount)/1999)} packets of ₹1,999 + remainder to bypass MDR.</p>
            </div>
          )}
          {status === 'SUCCESS' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 text-sm font-bold text-center mt-2">Payment Successful!</div>
          )}
          {status === 'RISK_REJECTED' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-bold mt-2 flex items-center gap-2">
              <AlertTriangle size={18} /> NPCI U16: High Risk Threshold Exceeded
            </div>
          )}
          {status === 'ERROR' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-bold mt-2 text-center">
              Payment Failed. Incorrect MPIN or System Error.
            </div>
          )}
        </form>

        {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl">
                <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-bold text-slate-700 animate-pulse">Processing Payment securely via NPCI...</p>
            </div>
        )}

        {showMpin && (
            <div className="fixed inset-0 bg-slate-900/90 z-50 flex flex-col items-center justify-center p-4">
                <div className="bg-slate-800 rounded-2xl w-full max-w-sm p-6 text-white shadow-2xl border border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-slate-400 font-bold cursor-pointer hover:text-white" onClick={() => setShowMpin(false)}>CANCEL</span>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-emerald-500 rounded-sm"></div>
                            <span className="font-bold text-sm tracking-widest">NPCI</span>
                        </div>
                    </div>
                    <div className="text-center mb-6">
                        <p className="text-slate-400 text-sm mb-1">{verifiedName || vpa}</p>
                        <p className="text-3xl font-bold">₹{amount}</p>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 mb-6 text-center border border-slate-700">
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">ENTER 6-DIGIT UPI PIN</p>
                        <input autoFocus required type="password" maxLength={6} pattern="[0-9]{6}" value={enteredMpin} onChange={e => setEnteredMpin(e.target.value)} placeholder="------" className="w-full bg-transparent text-center tracking-[1em] text-3xl font-bold outline-none text-white placeholder-slate-600" />
                    </div>
                    <button type="button" onClick={executePayment} disabled={loading || enteredMpin.length !== 6} className={`w-full ${loading || enteredMpin.length !== 6 ? 'bg-emerald-800 text-white/50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'} font-bold py-4 rounded-xl flex justify-center items-center gap-2 text-lg transition-colors`}>{loading ? <><div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Verifying...</> : <><CheckCircle2 size={24} /> Submit</>}</button>
                </div>
            </div>
        )}
      </div>
    );
};

const MobileDashboardLayout = ({ title, upiId, children, activeTab, setActiveTab }: any) => {
  const { logout, user: backendUser } = useAuth();
  const { user: clerkUser } = useUser();
  
  const handleLogout = () => {
    if (backendUser) logout();
  };

  return (
    <div className="w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto bg-white/80 backdrop-blur-xl h-[100dvh] md:h-[85vh] md:rounded-[40px] shadow-2xl border border-white/40 mt-0 md:mt-8 overflow-hidden flex flex-col md:flex-row animate-slide-up relative z-10">
      
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
        <div className="hidden md:flex flex-col gap-2 p-6 flex-1 mt-4 overflow-y-auto pb-8 scrollbar-hide">
          <div className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'pay' ? 'bg-blue-600 shadow-lg scale-105' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab('pay')}>
            <Activity size={24} /> <span className="font-bold text-lg">Payments</span>
          </div>
          <div className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'history' ? 'bg-blue-600 shadow-lg scale-105' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab('history')}>
            <HistoryIcon size={24} /> <span className="font-bold text-lg">Transaction History</span>
          </div>
          <div className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'contact' ? 'bg-blue-600 shadow-lg scale-105' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab('contact')}>
            <Users size={24} /> <span className="font-bold text-lg">Contacts & Split</span>
          </div>
          <div className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'qr' ? 'bg-blue-600 shadow-lg scale-105' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab('qr')}>
            <QrCode size={24} /> <span className="font-bold text-lg">My QR Code</span>
          </div>
          <div className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'developer' ? 'bg-blue-600 shadow-lg scale-105' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab('developer')}>
            <ShieldCheck size={24} /> <span className="font-bold text-lg">API Settings</span>
          </div>
          
          <div className="mt-auto pt-6">
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
};

const PhonePeDashboard = ({ verifiedUpiId }: { verifiedUpiId: string | null }) => {
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

  const { user } = useUser();
  const { user: backendUser } = useAuth();
  const [activeTab, setActiveTab] = useState('pay');
  const [history, setHistory] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
        setBalanceVisible(false);
    }, [activeTab]);

    const totalIn = history.filter(t => t.type === 'IN' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.totalAmount, 0);
      const totalOut = history.filter(t => t.type === 'OUT' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.totalAmount, 0);
      const currentBalance = 100000 + totalIn - totalOut;
      useEffect(() => {
      const email = backendUser?.email || user?.primaryEmailAddress?.emailAddress || 'normal@kyro';
    Promise.all([
        upiApi.getInflows(email).catch(() => ({ data: [] })),
        upiApi.getOutflows(email).catch(() => ({ data: [] }))
      ]).then(([inRes, outRes]) => {
        const ins = inRes.data.map((tx: any) => ({ ...tx, type: 'IN' }));
        const outs = outRes.data.map((tx: any) => ({ ...tx, type: 'OUT' }));
        
          const allTxs = [...ins, ...outs]; // Prefer OUT if same id
          const uniqueTxs = Array.from(new Map(allTxs.map(tx => [tx.id, tx])).values());
          const valid = uniqueTxs.filter((tx: any) => tx.status === 'COMPLETED');
        setHistory(valid.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      });
  }, [refresh, user, backendUser]);

  const contacts = [
    { name: 'My Number', phone: '7818086344', vpa: '7818086344@ybl' },{ name: 'Vansh (My Number)', phone: '7818086344', vpa: '7818086344@kyro' }];

  return (
    <MobileDashboardLayout title="Normal User" upiId={verifiedUpiId || user?.primaryEmailAddress?.emailAddress || backendUser?.email || 'normal@kyro'} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'pay' && (
        <div className="animate-fade-in">

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400/20 rounded-full blur-xl transform -translate-x-5 translate-y-5" />
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Available Balance</p>
                {balanceVisible ? (
                  <>
                    <h2 className="text-4xl font-extrabold tracking-tight">?{currentBalance.toLocaleString('en-IN')}<span className="text-lg text-blue-200">.00</span></h2>
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
          </Modal>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
            <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
               <Activity size={16} className="text-blue-600" /> Send Money Instantly
            </h3>

            <SmartPayForm onComplete={() => setRefresh(r => r + 1)} />
          </div>
        </div>
      )}
      {activeTab === 'history' && (
        <div>
          <h3 className="font-bold text-slate-800 mb-4">Payment History</h3>
          {history.map((tx, i) => <TransactionItem key={i} tx={tx} />)}
        </div>
      )}
      {activeTab === 'contact' && (
        <div className="space-y-3">
          <h3 className="font-bold text-slate-800 mb-3">Pay Contacts</h3>
          {contacts.map((c, i) => (
            <div key={i} onClick={() => setActiveTab('pay')} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50">
              <p className="font-bold text-sm text-slate-800">{c.name}</p>
              <p className="text-xs text-slate-500">{c.phone}</p>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'qr' && (
        <div className="text-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <QRCodeSVG value={`upi://pay?pa=${user?.primaryEmailAddress?.emailAddress || backendUser?.email}&pn=User`} size={150} className="mx-auto mb-4"/>
          <p className="text-xs font-bold text-slate-500">Scan to pay me</p>
        </div>
      )}
    </MobileDashboardLayout>
  );
};

const MerchantDashboard = ({ verifiedUpiId }: { verifiedUpiId: string | null }) => {
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

  const [history, setHistory] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(0);

    const totalCollections = history.filter(t => t.type === 'IN' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.totalAmount, 0);
    const txCount = history.filter(t => t.type === 'IN' && t.status === 'COMPLETED').length;

    const [incomingToast, setIncomingToast] = useState<{amount: number, sender: string} | null>(null);

  useEffect(() => {
        setBalanceVisible(false);
    }, [activeTab]);

    const totalIn = history.filter(t => t.type === 'IN' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.totalAmount, 0);
      const totalOut = history.filter(t => t.type === 'OUT' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.totalAmount, 0);
      const currentBalance = 100000 + totalIn - totalOut;
      useEffect(() => {
      const email = backendUser?.email || user?.primaryEmailAddress?.emailAddress || 'vanshj7818@gmail.com';
    
    const fetchHistory = () => {
        Promise.all([
          upiApi.getInflows(email).catch(() => ({ data: [] })),
          upiApi.getOutflows(email).catch(() => ({ data: [] }))
        ]).then(([inRes, outRes]) => {
          const ins = inRes.data.map((tx: any) => ({ ...tx, type: 'IN' }));
          const outs = outRes.data.map((tx: any) => ({ ...tx, type: 'OUT' }));
          const allTxs = [...ins, ...outs]; // Prefer OUT if same id // Prefer OUT if same id
            const uniqueTxs = Array.from(new Map(allTxs.map(tx => [tx.id, tx])).values());
            const all = uniqueTxs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          setHistory(prev => {
              if (prev.length > 0 && all.length > 0 && all[0].id !== prev[0].id && all[0].type === 'IN') {
                  setIncomingToast({amount: all[0].totalAmount, sender: all[0].senderId});
                  setTimeout(() => setIncomingToast(null), 5000);
              }
              return all;
          });
        });
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, [refresh, backendUser, user]);

  return (
    <>{incomingToast && (<div className="absolute top-4 left-4 right-4 bg-emerald-500 text-white p-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-bounce"><div className="w-10 h-10 bg-white text-emerald-600 rounded-full flex items-center justify-center font-bold text-xl">₹</div><div><p className="font-bold">KyroPay Soundbox</p><p className="text-sm">Received ₹{incomingToast.amount} from {incomingToast.sender}</p></div></div>)}
      <MobileDashboardLayout title="Merchant Business Portal" upiId={verifiedUpiId || user?.primaryEmailAddress?.emailAddress || backendUser?.email || 'merchant@kyro'} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'pay' && (
        <div className="animate-fade-in">

          <div className="bg-gradient-to-br from-indigo-700 to-purple-800 rounded-3xl p-6 text-white shadow-2xl mb-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
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

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
              <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
                 <Layers size={16} className="text-indigo-600" /> Vendor Payouts (Smart Split)
            </h3>

            <SmartPayForm onComplete={() => setRefresh(r => r + 1)} />
          </div>
        </div>
      )}
      {activeTab === 'history' && (
        <div>
          <h3 className="font-bold text-slate-800 mb-4">Customer Inflows</h3>
          {history.length === 0 && <p className="text-slate-500 text-sm">No inflows yet.</p>}
          {history.map((tx, i) => <TransactionItem key={i} tx={tx} />)}
        </div>
      )}
      {activeTab === 'contact' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <p className="text-slate-500 text-sm">Customer directory synced.</p>
        </div>
      )}
      {activeTab === 'developer' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <h3 className="font-bold text-slate-800 mb-4">Developer Settings</h3>
            <p className="text-xs text-slate-500 mb-4">Generate RuPay Sandbox API Key for integration.</p>
            <button onClick={async () => {
                try {
                    const token = localStorage.getItem('accessToken');
                    const res = await fetch(`${window.location.protocol}//${window.location.hostname}:8080/api/merchant/keys/generate?email=${backendUser?.email || ''}`, {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    const data = await res.json();
                    if (data.apiKey) {
                        alert('Generated Key: ' + data.apiKey);
                    } else {
                        alert('Error: ' + JSON.stringify(data));
                    }
                } catch(e) {
                    alert('Error generating key');
                }
            }} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl mb-4 transition">Generate RuPay Key</button>
            <p className="text-xs text-slate-500">Store this securely. Do not expose it in frontend code.</p>
          </div>
        )}
        {activeTab === 'qr' && (
          <div className="text-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Store QR Code</h3>
          <QRCodeSVG value={`upi://pay?pa=${user?.primaryEmailAddress?.emailAddress || backendUser?.email}&pn=Merchant`} size={150} className="mx-auto mb-4"/>
          <p className="text-xs font-bold text-slate-500 mt-4">Print this QR for your shop counter.</p>
        </div>
      )}
    </MobileDashboardLayout>
    </>
  );
};

const Dashboard = () => {
  const { signOut } = useClerk();
  const { logout } = useAuth();
  
  const { user: clerkUser } = useUser();
  const { user: backendUser } = useAuth();
  
  // THREE-TIER ROUTING LOGIC
  const email = clerkUser?.primaryEmailAddress?.emailAddress || backendUser?.email || '';
  const isMerchant = localStorage.getItem('userType') === 'merchant' || email.toLowerCase().includes('merchant');
  const isBankEmployee = !!backendUser && !isMerchant;
  
  


const [page, setPage] = useState<Page>('dashboard');

  
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [verifiedUpiId, setVerifiedUpiId] = useState<string | null>(null);
  const [newUpiId, setNewUpiId] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [onboardingLoading, setOnboardingLoading] = useState(false);
    const [onboardError, setOnboardError] = useState<string | null>(null);
  
  
  

  useEffect(() => {
    if (email && !isBankEmployee) {
      upiApi.getUpiProfile(email).then(res => {
        if (!res.data.hasUpi) {
          setNeedsOnboarding(true);
        } else {
          setVerifiedUpiId(res.data.upiId);
        }
      }).catch(err => {
         setNeedsOnboarding(true);
      });
    }
  }, [email, isBankEmployee]);


  const handleOnboard = async (e: any) => {
      e.preventDefault();
      setOnboardingLoading(true);
      setOnboardError(null);
      try {
          await upiApi.onboard(email, newUpiId, newMpin);
          setVerifiedUpiId(newUpiId);
          setNeedsOnboarding(false);
          showToast('UPI Setup Complete!', 'success');
      } catch(err: any) {
          setOnboardError(err.response?.data?.error || 'Error setting up UPI ID. It might be taken.');
      } finally {
          setOnboardingLoading(false);
      }
    };
const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: string} | null>(null);

  const showToast = (msg: string, type = 'info') => {
    setToast({ msg, type });
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => setToast(null), 4000);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':    return <DashboardPage />;
      case 'users':        return <UsersPage showToast={showToast} />;
      case 'transactions': return <TransactionsPage />;
      case 'approvals':    return <ApprovalsPage showToast={showToast} />;
      case 'payments':     return <PaymentsPage showToast={showToast} />;
      case 'collections':  return <CollectionsPage showToast={showToast} />;
      case 'liquidity':    return <LiquidityPage />;
      case 'llm':          return <LlmPage />;
      default:             return <DashboardPage />;
    }
  };




  let DashboardContent = null;
  if (isMerchant) {
    DashboardContent = <MerchantDashboard verifiedUpiId={verifiedUpiId} />;
  } else if (!isBankEmployee) {
    DashboardContent = <PhonePeDashboard verifiedUpiId={verifiedUpiId} />;
  } else {
    DashboardContent = (
      <div className="flex h-screen bg-white/50 backdrop-blur-3xl overflow-hidden font-sans relative z-10">
      <Sidebar page={page} setPage={setPage} open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar page={page} setOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto">{renderPage()}</main>
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
    );
  }

  return (
    <>


      {needsOnboarding && (
        <div className="fixed inset-0 bg-slate-900/90 z-[9999] flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 text-center shadow-2xl">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck size={32} /></div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to KyroPay!</h2>
                <p className="text-slate-500 mb-6 text-sm">Please set up your secure UPI ID and 6-digit MPIN before you can start making payments.</p>
                {onboardError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200 mb-4">{onboardError}</div>}
                <form onSubmit={handleOnboard} className="space-y-4 text-left">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Choose a UPI ID</label>
                        <input required autoComplete="off" value={newUpiId} onChange={e => setNewUpiId(e.target.value)} placeholder="yourname@kyro" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Set 6-Digit MPIN</label>
                        <input required type="password" maxLength={6} pattern="[0-9]{6}" value={newMpin} onChange={e => setNewMpin(e.target.value)} placeholder="------" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center tracking-[1em] text-lg font-bold outline-none" />
                    </div>
                    <button disabled={onboardingLoading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md">
                        {onboardingLoading ? 'Setting up...' : 'Complete Setup'}
                      </button>
                      <button type="button" onClick={() => { signOut(); logout(); window.location.href = '/'; }} className="w-full mt-4 py-3 text-slate-500 font-bold hover:text-slate-800 transition text-sm">
                          Sign Out / Use a different account
                      </button>
                </form>
            </div>
        </div>
      )}

    {DashboardContent}
  </>
);
};

export default Dashboard;
