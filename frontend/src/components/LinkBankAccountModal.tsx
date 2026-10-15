import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  Loader2, 
  Lock
} from 'lucide-react';

export interface LinkedBankAccount {
  id: string;
  bankName: string;
  accountNumber: string; // masked
  rawAccountNumber: string;
  ifsc: string;
  accountHolder: string;
  accountType: 'SAVINGS' | 'CURRENT';
  isPrimary: boolean;
  linkedAt: string;
}

interface LinkBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onAccountLinked: (account: LinkedBankAccount) => void;
}

const POPULAR_BANKS = [
  { name: 'HDFC Bank', ifscPrefix: 'HDFC0001234', color: 'from-blue-600 to-indigo-700' },
  { name: 'State Bank of India', ifscPrefix: 'SBIN0000456', color: 'from-blue-700 to-cyan-800' },
  { name: 'ICICI Bank', ifscPrefix: 'ICIC0000789', color: 'from-amber-600 to-red-700' },
  { name: 'Axis Bank', ifscPrefix: 'UTIB0000321', color: 'from-purple-700 to-rose-700' },
  { name: 'Kotak Mahindra Bank', ifscPrefix: 'KKBK0000654', color: 'from-red-600 to-rose-800' },
  { name: 'Punjab National Bank', ifscPrefix: 'PUNB0000987', color: 'from-amber-700 to-orange-800' },
];

export const LinkBankAccountModal: React.FC<LinkBankAccountModalProps> = ({
  isOpen,
  onClose,
  userName,
  onAccountLinked,
}) => {
  const [selectedBank, setSelectedBank] = useState(POPULAR_BANKS[0].name);
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState(POPULAR_BANKS[0].ifscPrefix);
  const [accountType, setAccountType] = useState<'SAVINGS' | 'CURRENT'>('SAVINGS');
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<string>('');
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleBankSelect = (bankName: string, ifscPrefix: string) => {
    setSelectedBank(bankName);
    setIfsc(ifscPrefix);
    setError('');
  };

  const handleVerifyPennyDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!accountNumber || accountNumber.length < 9) {
      setError('Please enter a valid bank account number (at least 9 digits).');
      return;
    }

    if (accountNumber !== confirmAccountNumber) {
      setError('Account numbers do not match.');
      return;
    }

    if (!ifsc || ifsc.length !== 11) {
      setError('Please enter a valid 11-character IFSC code.');
      return;
    }

    setIsVerifying(true);
    setVerificationStep('Connecting to NPCI Central Clearing Switch...');

    // Simulation: Step 1
    setTimeout(() => {
      setVerificationStep('Dispatching ₹1 IMPS Penny Drop verification to ' + selectedBank + '...');
      
      // Simulation: Step 2
      setTimeout(() => {
        setVerificationStep('Validating Account Holder Name matching: ' + (userName || 'Authorized Account Holder') + '...');
        
        // Simulation: Step 3 (Success)
        setTimeout(() => {
          setIsVerifying(false);
          setVerifiedSuccess(true);

          const masked = '•••• ' + accountNumber.slice(-4);
          const newAccount: LinkedBankAccount = {
            id: 'bank_' + Math.random().toString(36).substring(2, 10),
            bankName: selectedBank,
            accountNumber: masked,
            rawAccountNumber: accountNumber,
            ifsc: ifsc.toUpperCase(),
            accountHolder: userName || 'Authorized Account Holder',
            accountType,
            isPrimary: true,
            linkedAt: new Date().toISOString(),
          };

          // Play subtle success chime
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.setValueAtTime(523.25, ctx.currentTime);
              osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
              gain.gain.setValueAtTime(0.2, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
              osc.start();
              osc.stop(ctx.currentTime + 0.35);
            }
          } catch (e) {
            // ignore audio error
          }

          setTimeout(() => {
            onAccountLinked(newAccount);
            setVerifiedSuccess(false);
            onClose();
          }, 1800);
        }, 1200);
      }, 1200);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Building2 size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                Link Commercial Bank Account
              </h3>
              <p className="text-[11px] text-blue-200">NPCI IMPS Penny Drop (₹1 Instant Verification)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {verifiedSuccess ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50 animate-bounce">
                <CheckCircle2 size={36} />
              </div>
              <h4 className="font-extrabold text-lg text-slate-900">Bank Account Linked!</h4>
              <p className="text-xs text-slate-500">
                {selectedBank} (•••• {accountNumber.slice(-4)}) has been verified and set as your primary UPI funding source.
              </p>
            </div>
          ) : isVerifying ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-blue-50 animate-pulse">
                <Loader2 size={36} className="animate-spin" />
              </div>
              <h4 className="font-black text-slate-800 text-base">Verifying with NPCI & Bank</h4>
              <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 p-3 rounded-2xl font-mono max-w-xs mx-auto animate-fade-in">
                {verificationStep}
              </p>
            </div>
          ) : (
            <form onSubmit={handleVerifyPennyDrop} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-bold">
                  {error}
                </div>
              )}

              {/* Popular Banks Selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                  Select Commercial Bank
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {POPULAR_BANKS.map((b) => (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => handleBankSelect(b.name, b.ifscPrefix)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        selectedBank === b.name
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-black shadow-sm ring-1 ring-blue-600'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-bold'
                      }`}
                    >
                      <Building2 size={16} className={selectedBank === b.name ? 'text-blue-600' : 'text-slate-400'} />
                      <span className="text-[10px] leading-tight truncate w-full">{b.name.replace(' Bank', '')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Number */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 50100412345678"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Confirm Account Number */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Re-Enter Account Number
                </label>
                <input
                  type="password"
                  required
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Re-enter to confirm"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* IFSC & Account Type */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="SAVINGS">Savings A/C</option>
                    <option value="CURRENT">Current A/C</option>
                  </select>
                </div>
              </div>

              {/* Verified Name Notice */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <span className="font-semibold">KYC Holder Name:</span>
                <span className="font-black text-slate-900">{userName || 'Authorized Account Holder'}</span>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs rounded-2xl shadow-xl transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer mt-2"
              >
                <ShieldCheck size={16} /> Verify via ₹1 IMPS Penny Drop & Link Bank
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 text-center pt-1">
                <Lock size={12} className="text-emerald-500" />
                <span>NPCI Authorized IMPS Verification • RBI Compliant</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
