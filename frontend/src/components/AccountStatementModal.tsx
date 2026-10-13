import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShieldCheck, 
  Search
} from 'lucide-react';
import { KyroLogo } from './KyroLogo';

export interface StatementTransaction {
  id?: string | number;
  parentReferenceNo?: string;
  senderId?: string;
  receiverId?: string;
  totalAmount: number;
  type?: 'IN' | 'OUT';
  status: string;
  createdAt?: string | Date;
  packets?: Array<{ packetUtr: string; amount: number }>;
}

interface AccountStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: StatementTransaction[];
  accountName: string;
  accountUpiId?: string;
  isMerchant?: boolean;
}

export const AccountStatementModal: React.FC<AccountStatementModalProps> = ({
  isOpen,
  onClose,
  transactions,
  accountName,
  accountUpiId = 'user@okkyro',
  isMerchant = false,
}) => {
  const [dateRange, setDateRange] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter transactions - Must run unconditionally before any early return to obey React Rules of Hooks
  const filtered = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];
    const now = new Date();
    return transactions.filter((tx) => {
      if (!tx) return false;
      // Type filter
      if (typeFilter !== 'ALL') {
        const txType = tx.type || (tx.senderId?.includes(accountUpiId) ? 'OUT' : 'IN');
        if (txType !== typeFilter) return false;
      }

      // Date filter
      if (dateRange !== 'ALL' && tx.createdAt) {
        const txDate = new Date(tx.createdAt);
        if (isNaN(txDate.getTime())) return false;
        if (dateRange === 'TODAY') {
          if (txDate.toDateString() !== now.toDateString()) return false;
        } else if (dateRange === 'WEEK') {
          const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7 || diffDays < 0) return false;
        } else if (dateRange === 'MONTH') {
          if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSender = tx.senderId?.toLowerCase().includes(query);
        const matchesReceiver = tx.receiverId?.toLowerCase().includes(query);
        const matchesUtr = tx.packets?.some(p => p.packetUtr?.includes(query)) || tx.parentReferenceNo?.toLowerCase().includes(query);
        if (!matchesSender && !matchesReceiver && !matchesUtr) return false;
      }

      return true;
    });
  }, [transactions, dateRange, typeFilter, searchQuery, accountUpiId]);

  const totalCredits = filtered
    .filter((t) => t.type === 'IN')
    .reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);

  const totalDebits = filtered
    .filter((t) => t.type === 'OUT')
    .reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);

  // Early return only after all hooks have been called
  if (!isOpen) return null;

  // Generate & Download CSV
  const handleExportCsv = () => {
    const headers = [
      'Sl No',
      'Date & Time',
      'Transaction Ref (UTR)',
      'Type',
      'Counterparty',
      'Amount (INR)',
      'Status',
    ];

    const rows = filtered.map((tx, idx) => {
      const utr = tx.packets?.[0]?.packetUtr || tx.parentReferenceNo || `UTR-${tx.id}`;
      const date = tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN') : 'Recent';
      const counterparty = tx.type === 'OUT' ? tx.receiverId : tx.senderId;
      return [
        idx + 1,
        `"${date}"`,
        `"${utr}"`,
        tx.type === 'OUT' ? 'DEBIT' : 'CREDIT',
        `"${counterparty || 'UPI User'}"`,
        tx.totalAmount,
        tx.status,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KyroPay_Statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-slide-up print:max-h-none print:shadow-none print:border-none print:w-full">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 text-white flex justify-between items-start print:bg-slate-900 print:text-black">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <KyroLogo size="sm" variant={isMerchant ? 'merchant' : 'personal'} />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800">
                Official Account Statement
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">{accountName}</h2>
            <p className="text-xs text-slate-300 font-mono mt-0.5">UPI ID: {accountUpiId}</p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <FileSpreadsheet size={15} />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <Printer size={15} />
              Print / PDF
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Toolbar (Hidden on Print) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-wrap gap-3 items-center justify-between print:hidden">
          {/* Date range tabs */}
          <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
            {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  dateRange === r ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'ALL' ? 'All Time' : r === 'TODAY' ? 'Today' : r === 'WEEK' ? 'Last 7 Days' : 'This Month'}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
            {(['ALL', 'IN', 'OUT'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  typeFilter === t ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'ALL' ? 'All Records' : t === 'IN' ? 'Credits (+)' : 'Debits (-)'}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by VPA or UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Statement Summary KPI Cards */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-100/50 border-b border-slate-200 text-center">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Received (Credits)</p>
            <p className="text-lg font-black text-emerald-600 mt-0.5">
              +₹{totalCredits.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Paid (Debits)</p>
            <p className="text-lg font-black text-orange-600 mt-0.5">
              -₹{totalDebits.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Movement</p>
            <p className={`text-lg font-black mt-0.5 ${totalCredits - totalDebits >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ₹{(totalCredits - totalDebits).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="font-semibold text-sm">No transactions match your selected filter.</p>
              <p className="text-xs mt-1">Try resetting the date or record filters.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Transaction UTR</th>
                  <th className="py-2.5 px-3">Counterparty</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx, idx) => {
                  const isOut = tx.type === 'OUT';
                  const utr = tx.packets?.[0]?.packetUtr || tx.parentReferenceNo || `UTR-${tx.id}`;
                  const dateStr = tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }) : 'Recent';

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-medium">{dateStr}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{utr}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          {isOut ? (
                            <ArrowUpRight size={14} className="text-orange-500 shrink-0" />
                          ) : (
                            <ArrowDownLeft size={14} className="text-emerald-500 shrink-0" />
                          )}
                          <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                            {isOut ? tx.receiverId : tx.senderId}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className={`font-extrabold text-sm ${isOut ? 'text-slate-800' : 'text-emerald-600'}`}>
                          {isOut ? '-' : '+'}₹{Number(tx.totalAmount).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Official Bank Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Certified Core Banking System • Kyro Data Tech</span>
          </div>
          <span>Report Generated: {new Date().toLocaleDateString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};

export default AccountStatementModal;
