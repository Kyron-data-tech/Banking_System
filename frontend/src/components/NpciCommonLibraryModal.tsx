import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  X, 
  Delete, 
  Check, 
  Shuffle, 
  CreditCard, 
  Lock, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  ArrowLeft,
  Smartphone
} from 'lucide-react';
import { upiApi } from '../api';

interface NpciCommonLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPin: (pin: string) => void;
  payeeName?: string;
  payeeVpa: string;
  amount: number;
  userEmail: string;
  bankName?: string;
  accountNumber?: string;
  isLoading?: boolean;
}

// Synthetic haptic click sound using Web Audio API
function playKeypadClick() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {
    // Audio context fallback
  }
}

export const NpciCommonLibraryModal: React.FC<NpciCommonLibraryModalProps> = ({
  isOpen,
  onClose,
  onSubmitPin,
  payeeName,
  payeeVpa,
  amount,
  userEmail,
  bankName = 'HDFC Bank',
  accountNumber = '•••• 4129',
  isLoading = false,
}) => {
  const [pin, setPin] = useState<string>('');
  const [scramble, setScramble] = useState<boolean>(false);
  const [keypadOrder, setKeypadOrder] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  const [view, setView] = useState<'PIN_ENTRY' | 'FORGOT_PIN'>('PIN_ENTRY');

  // Forgot PIN form state
  const [cardLast6, setCardLast6] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardOtp, setCardOtp] = useState<string>('849201');
  const [newMpin, setNewMpin] = useState<string>('');
  const [confirmNewMpin, setConfirmNewMpin] = useState<string>('');
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Scramble numbers 0-9
  const shuffleKeypad = () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setKeypadOrder(arr);
  };

  useEffect(() => {
    if (scramble) {
      shuffleKeypad();
    } else {
      setKeypadOrder([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
    }
  }, [scramble]);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setView('PIN_ENTRY');
      setResetError(null);
      setResetSuccess(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyPress = (num: number) => {
    if (pin.length < 6) {
      playKeypadClick();
      setPin(prev => prev + num.toString());
    }
  };

  const handleDelete = () => {
    playKeypadClick();
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    playKeypadClick();
    setPin('');
  };

  const handleSubmit = () => {
    if (pin.length === 6 && !isLoading) {
      onSubmitPin(pin);
    }
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (cardLast6.length !== 6 || !/^\d{6}$/.test(cardLast6)) {
      setResetError('Please enter valid 6-digit Debit Card digits.');
      return;
    }
    if (!cardExpiry || cardExpiry.length < 4) {
      setResetError('Please enter valid Expiry Date (MM/YY).');
      return;
    }
    if (newMpin.length !== 6 || !/^\d{6}$/.test(newMpin)) {
      setResetError('New UPI PIN must be exactly 6 numeric digits.');
      return;
    }
    if (newMpin !== confirmNewMpin) {
      setResetError('New UPI PIN and Confirmation PIN do not match.');
      return;
    }

    setResetLoading(true);
    try {
      await upiApi.resetPin({
        email: userEmail,
        cardLast6,
        expiry: cardExpiry,
        otp: cardOtp,
        newMpin
      });
      setResetSuccess('UPI PIN successfully updated via NPCI Banking Switch!');
      setTimeout(() => {
        setView('PIN_ENTRY');
        setPin(newMpin);
      }, 1500);
    } catch (err: any) {
      setResetError(err.response?.data?.error || err.message || 'Failed to reset UPI PIN.');
    } finally {
      setResetLoading(false);
    }
  };

  const isSplitNeeded = amount > 2000;
  const splitPackets = isSplitNeeded ? Math.ceil(amount / 1999) : 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col">
        
        {/* NPCI Common Library Official Tricolor Ribbon */}
        <div className="h-1.5 w-full flex">
          <div className="h-full w-1/3 bg-[#FF9933]"></div>
          <div className="h-full w-1/3 bg-white"></div>
          <div className="h-full w-1/3 bg-[#138808]"></div>
        </div>

        {/* NPCI CL Official Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <ShieldCheck size={14} className="text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black tracking-widest text-emerald-400">NPCI</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Common Library</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-none">Unified Payments Interface (UPI 2.0)</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Bank & Account Bar */}
        <div className="px-5 py-2.5 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Building2 size={14} className="text-blue-400" />
            <span className="font-bold">{bankName}</span>
            <span className="text-slate-500 font-mono text-[11px]">{accountNumber}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
            <Lock size={9} />
            <span>256-bit SSL</span>
          </div>
        </div>

        {view === 'PIN_ENTRY' ? (
          <>
            {/* Payee & Amount Card */}
            <div className="p-5 text-center bg-gradient-to-b from-slate-900 to-slate-900/40">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700/80 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">
                  {payeeName || payeeVpa}
                </span>
                <CheckCircle2 size={12} className="text-blue-400 shrink-0" />
              </div>

              <div className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-1">
                <span className="text-2xl text-slate-400 font-normal">₹</span>
                {amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>

              {isSplitNeeded && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                  <span>🛡️</span>
                  <span>NPCI Switch: Auto-Split ({splitPackets} Packets • 0% MDR)</span>
                </div>
              )}
            </div>

            {/* MPIN Bullet Input Display */}
            <div className="px-6 py-4 bg-slate-950/60 border-y border-slate-800/80 text-center">
              <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-3 flex items-center justify-center gap-1.5">
                <KeyRound size={12} className="text-emerald-400" />
                <span>ENTER 6-DIGIT UPI PIN</span>
              </p>

              <div className="flex items-center justify-center gap-3.5 my-2">
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const isFilled = pin.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full transition-all duration-200 ${
                        isFilled
                          ? 'bg-emerald-400 scale-110 shadow-[0_0_12px_rgba(52,211,153,0.8)] border border-emerald-300'
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-3 text-[11px]">
                <button
                  type="button"
                  onClick={() => setScramble(!scramble)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    scramble
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Randomize keypad layout to prevent shoulder surfing"
                >
                  <Shuffle size={12} />
                  <span>{scramble ? 'Scrambled' : 'Standard'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setView('FORGOT_PIN')}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition"
                >
                  Forgot UPI PIN?
                </button>
              </div>
            </div>

            {/* Tactile Scrambled On-Screen Keypad */}
            <div className="p-4 bg-slate-950/90 select-none">
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[280px] mx-auto">
                {/* 1st 9 numbers */}
                {keypadOrder.slice(0, 9).map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeyPress(digit)}
                    disabled={isLoading}
                    className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 active:scale-95 text-white font-bold text-xl shadow-md border border-slate-700/60 flex items-center justify-center transition"
                  >
                    {digit}
                  </button>
                ))}

                {/* Bottom Row: Clear / 0 / Backspace */}
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isLoading || pin.length === 0}
                  className="h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-slate-200 font-bold text-xs uppercase tracking-wider shadow-inner border border-slate-800 flex items-center justify-center transition"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() => handleKeyPress(keypadOrder[9] !== undefined ? keypadOrder[9] : 0)}
                  disabled={isLoading}
                  className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 active:scale-95 text-white font-bold text-xl shadow-md border border-slate-700/60 flex items-center justify-center transition"
                >
                  {keypadOrder[9] !== undefined ? keypadOrder[9] : 0}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading || pin.length === 0}
                  className="h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-white shadow-inner border border-slate-800 flex items-center justify-center transition"
                >
                  <Delete size={20} />
                </button>
              </div>

              {/* Submit Button */}
              <div className="mt-4 max-w-[280px] mx-auto">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || pin.length !== 6}
                  className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                    isLoading || pin.length !== 6
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25 active:scale-[0.98]'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying via NPCI...</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} strokeWidth={3} />
                      <span>SUBMIT SECURE MPIN</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* FORGOT UPI PIN FLOW (Debit Card Verification) */
          <div className="p-5 bg-slate-900 text-left flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setView('PIN_ENTRY')}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h4 className="font-black text-sm text-white">Reset UPI PIN</h4>
                <p className="text-[10px] text-slate-400">NPCI Debit Card Authentication</p>
              </div>
            </div>

            {resetError && (
              <div className="p-3 mb-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 mb-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPinSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Debit Card (Last 6 Digits)
                </label>
                <div className="flex items-center bg-slate-800 rounded-xl px-3 py-2 border border-slate-700">
                  <CreditCard size={16} className="text-slate-400 mr-2" />
                  <span className="text-slate-500 font-mono text-xs mr-1">•••• •••• ••••</span>
                  <input
                    type="text"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    placeholder="123456"
                    value={cardLast6}
                    onChange={(e) => setCardLast6(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-transparent font-mono text-sm text-white font-bold tracking-widest outline-none placeholder-slate-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    Valid Thru (MM/YY)
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-slate-800 rounded-xl px-3 py-2 border border-slate-700 font-mono text-xs text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    Bank SMS OTP
                  </label>
                  <div className="flex items-center bg-slate-800 rounded-xl px-2 py-2 border border-slate-700">
                    <Smartphone size={14} className="text-slate-400 mr-1 shrink-0" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="849201"
                      value={cardOtp}
                      onChange={(e) => setCardOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-transparent font-mono text-xs text-white outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    Set New 6-Digit UPI PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Enter new 6-digit PIN"
                    value={newMpin}
                    onChange={(e) => setNewMpin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-800 rounded-xl px-3 py-2 border border-slate-700 font-mono text-xs text-white tracking-widest outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    Confirm New UPI PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Re-enter new PIN"
                    value={confirmNewMpin}
                    onChange={(e) => setConfirmNewMpin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-800 rounded-xl px-3 py-2 border border-slate-700 font-mono text-xs text-white tracking-widest outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full mt-3 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
              >
                {resetLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying with NPCI...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={14} />
                    <span>SET NEW UPI PIN</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Footer Security Watermark */}
        <div className="py-2.5 px-4 bg-slate-950 text-center border-t border-slate-800/80">
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1 font-mono">
            <span>Powered by NPCI Common Library • 256-Bit Hardware Encrypted</span>
          </p>
        </div>

      </div>
    </div>
  );
};
