import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  AlertCircle, 
  X, 
  Zap, 
  Lock, 
  ArrowDownToLine 
} from 'lucide-react';
import { upiApi } from '../api';

interface MerchantSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  merchantEmail: string;
  onSettlementSuccess: (settlementTx: any) => void;
}

export const MerchantSettlementModal: React.FC<MerchantSettlementModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  merchantEmail,
  onSettlementSuccess,
}) => {
  const [amount, setAmount] = useState<string>(availableBalance > 0 ? String(availableBalance) : '');
  const [mpin, setMpin] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const bankAccount = '50100482910';
  const bankName = 'HDFC Bank';
  const ifsc = 'HDFC0001234';

  useEffect(() => {
    if (isOpen) {
      setAmount(availableBalance > 0 ? String(availableBalance) : '');
      setMpin('');
      setError('');
    }
  }, [isOpen, availableBalance]);

  if (!isOpen) return null;

  const handleMaxAmount = () => {
    setAmount(String(availableBalance));
  };

  const handleQuickAdd = (val: number) => {
    const current = Number(amount) || 0;
    const next = Math.min(availableBalance, current + val);
    setAmount(String(next));
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a valid settlement amount.');
      return;
    }

    if (numericAmount > availableBalance) {
      setError(`Cannot settle more than available balance of ₹${availableBalance.toLocaleString('en-IN')}.`);
      return;
    }

    if (!mpin || mpin.length !== 6) {
      setError('Please enter your 6-digit MPIN for bank authorization.');
      return;
    }

    setLoading(true);
    try {
      const res = await upiApi.settle(
        merchantEmail,
        numericAmount,
        mpin,
        `${bankName} - A/c ${bankAccount}`,
        ifsc
      );

      // Play audio notification
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
          osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
          osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.4, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.5);
        }
      } catch (audioErr) {}

      onSettlementSuccess(res.data.settlement);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Settlement failed. Please verify credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition"
          >
            <X size={18} />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
            <Zap size={14} className="text-emerald-400" />
            Instant T+0 IMPS Clearing
          </div>

          <h3 className="text-2xl font-black tracking-tight">Settle to Bank Account</h3>
          <p className="text-xs text-slate-300 mt-1">
            Instantly transfer collected customer payments to your verified bank account.
          </p>

          <div className="mt-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex justify-between items-center">
            <div>
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Unsettled Balance</p>
              <h2 className="text-3xl font-extrabold text-white">
                ₹{availableBalance.toLocaleString('en-IN')}<span className="text-lg text-slate-300">.00</span>
              </h2>
            </div>
            <button
              type="button"
              onClick={handleMaxAmount}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition shadow-md"
            >
              Settle All (100%)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSettle} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Registered Bank Account Info Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={15} className="text-blue-600" /> Destination Bank Account
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full">
                Primary A/c
              </span>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
              <span>{bankName}</span>
              <span className="font-mono text-xs text-slate-500">IFSC: {ifsc}</span>
            </div>
            <p className="font-mono text-xs font-bold text-slate-600 mt-0.5">
              A/c: ••••••••••••{bankAccount.slice(-4)}
            </p>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Settlement Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center font-bold text-xl text-slate-400">
                ₹
              </span>
              <input
                type="number"
                min="1"
                max={availableBalance}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to transfer"
                className="w-full pl-9 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-extrabold text-2xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition"
                required
              />
            </div>

            {/* Quick Pills */}
            <div className="flex gap-2 mt-2.5">
              {[500, 1000, 2000, 5000].map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => handleQuickAdd(pill)}
                  disabled={pill > availableBalance}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-40 transition"
                >
                  +₹{pill}
                </button>
              ))}
            </div>
          </div>

          {/* 6-Digit MPIN Pad */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={14} className="text-slate-500" /> Enter 6-Digit MPIN
              </label>
              <span className="text-[11px] text-slate-400">Default: 112233</span>
            </div>
            <input
              type="password"
              maxLength={6}
              pattern="[0-9]{6}"
              value={mpin}
              onChange={(e) => setMpin(e.target.value)}
              placeholder="••••••"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center tracking-[1em] text-2xl font-bold outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          {/* Settle Action Button */}
          <button
            type="submit"
            disabled={loading || !amount || Number(amount) <= 0 || mpin.length !== 6}
            className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-blue-600/25 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-98"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing IMPS Settlement...</span>
              </>
            ) : (
              <>
                <ArrowDownToLine size={20} />
                <span>Transfer ₹{Number(amount || 0).toLocaleString('en-IN')} to Bank</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MerchantSettlementModal;
