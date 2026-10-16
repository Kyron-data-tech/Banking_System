import React, { useState } from 'react';
import { ShieldCheck, Plus, CheckCircle2, Lock, RefreshCw } from 'lucide-react';
import type { LinkedBankAccount } from './LinkBankAccountModal';

interface BankAccountsViewProps {
  linkedBanks: LinkedBankAccount[];
  onOpenLinkBankModal: () => void;
  onSetPrimaryBank: (bankId: string) => void;
  availableBalance: number;
}

export const BankAccountsView: React.FC<BankAccountsViewProps> = ({
  linkedBanks,
  onOpenLinkBankModal,
  onSetPrimaryBank,
  availableBalance
}) => {
  const [selectedBankForMpin, setSelectedBankForMpin] = useState<LinkedBankAccount | null>(null);
  const [mpin, setMpin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedBalances, setVerifiedBalances] = useState<Record<string, number>>({});
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerifyMpin = () => {
    if (mpin.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit MPIN');
      return;
    }
    setErrorMsg('');
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      if (selectedBankForMpin) {
        // Compute realistic balance for the selected account (ensure CBS primary balance never drops to 0)
        const defaultPrimaryBalance = selectedBankForMpin.bankName.includes('HDFC') ? 84500 : 62500;
        const balance = (availableBalance && availableBalance > 0) ? availableBalance : defaultPrimaryBalance;
        const finalBalance = selectedBankForMpin.isPrimary ? balance : Math.floor(Math.random() * 45000) + 32500;
        setVerifiedBalances(prev => ({ ...prev, [selectedBankForMpin.id]: finalBalance }));
        setSelectedBankForMpin(null);
        setMpin('');
      }
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-blue-500/20">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              NPCI Mandate & CBS Network
            </span>
            <h3 className="text-2xl font-black mt-2">Bank Accounts & Balance</h3>
            <p className="text-xs text-blue-200 mt-1">
              Check live balance using your UPI MPIN or link a new commercial bank account
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenLinkBankModal}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition"
          >
            <Plus size={16} /> Link New Bank
          </button>
        </div>
      </div>

      {/* Linked Banks List */}
      <div className="space-y-3.5">
        <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
          Linked Accounts ({linkedBanks.length})
        </h4>

        {linkedBanks.map((bank) => {
          const hasBalance = verifiedBalances[bank.id] !== undefined;

          return (
            <div
              key={bank.id}
              className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-700 border border-blue-100 dark:border-slate-600 flex items-center justify-center text-xl shadow-inner">
                    🏛️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-black text-slate-800 dark:text-white text-sm">
                        {bank.bankName}
                      </h5>
                      {bank.isPrimary ? (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-md">
                          PRIMARY ACCOUNT
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSetPrimaryBank(bank.id)}
                          className="text-[10px] text-blue-600 hover:text-blue-700 font-bold underline"
                        >
                          Make Primary
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      A/C: {bank.accountNumber} • IFSC: {bank.ifsc}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Holder: <span className="font-medium text-slate-600 dark:text-slate-300">{bank.accountHolder}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {hasBalance ? (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Available Balance
                      </span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        ₹{verifiedBalances[bank.id].toLocaleString('en-IN')}.00
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBankForMpin(bank);
                          setMpin('');
                        }}
                        className="text-[10px] text-blue-600 block mt-1 hover:underline ml-auto"
                      >
                        Re-check
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBankForMpin(bank);
                        setMpin('');
                      }}
                      className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-sm"
                    >
                      <Lock size={13} /> Check Balance
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 size={13} /> NPCI Mandate Active
                </span>
                <span>Type: {bank.accountType || 'SAVINGS'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MPIN Verification Modal */}
      {selectedBankForMpin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center border border-white/20">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={28} />
            </div>
            <h4 className="font-extrabold text-slate-800 dark:text-white text-lg">
              Enter UPI MPIN
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Enter your 6-digit MPIN to fetch real-time balance for {selectedBankForMpin.bankName} ({selectedBankForMpin.accountNumber}).
            </p>

            {errorMsg && (
              <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl mb-4 font-semibold">
                {errorMsg}
              </p>
            )}

            <input
              type="password"
              maxLength={6}
              value={mpin}
              onChange={e => setMpin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              autoFocus
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-center tracking-[0.8em] text-2xl font-black outline-none mb-6 focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedBankForMpin(null);
                  setMpin('');
                }}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-white font-bold rounded-2xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyMpin}
                disabled={isVerifying || mpin.length !== 6}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Verifying...
                  </>
                ) : (
                  'Submit MPIN'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
