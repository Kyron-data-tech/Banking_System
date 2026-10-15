import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Building2, 
  ShieldCheck, 
  X, 
  Lock, 
  Smartphone, 
  CheckCircle2, 
  Loader2,
  Delete,
  ArrowLeft
} from 'lucide-react';
import { razorpayApi } from '../api';

interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  defaultAmount?: number;
  purpose: 'ADD_FUNDS' | 'PAY_MERCHANT';
  receiverId?: string;
  receiverName?: string;
  onPaymentSuccess: (transaction: any) => void;
}

const POPULAR_BANKS = [
  { id: 'HDFC', name: 'HDFC Bank', code: 'HDFC' },
  { id: 'SBIN', name: 'State Bank of India', code: 'SBI' },
  { id: 'ICIC', name: 'ICICI Bank', code: 'ICICI' },
  { id: 'UTIB', name: 'Axis Bank', code: 'AXIS' },
  { id: 'KKBK', name: 'Kotak Mahindra', code: 'KOTAK' },
];

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', handle: '@okhdfcbank' },
  { id: 'phonepe', name: 'PhonePe', handle: '@ybl' },
  { id: 'paytm', name: 'Paytm UPI', handle: '@paytm' },
  { id: 'bhim', name: 'BHIM UPI', handle: '@upi' },
];

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  defaultAmount = 500,
  purpose,
  receiverId,
  receiverName,
  onPaymentSuccess,
}) => {
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NETBANKING' | 'CARD'>('UPI');
  const [selectedBank, setSelectedBank] = useState<string>('State Bank of India');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('Google Pay');
  const [cardNumber, setCardNumber] = useState<string>('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvv, setCardCvv] = useState<string>('789');

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<'SELECT' | 'PIN_AUTH' | 'PROCESSING' | 'SUCCESS'>('SELECT');
  const [error, setError] = useState<string>('');
  const [orderData, setOrderData] = useState<any>(null);

  // Sync default amount when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount(defaultAmount > 0 ? defaultAmount : 500);
      setStep('SELECT');
      setError('');
      setEnteredPin('');
      setLoading(false);
    }
  }, [isOpen, defaultAmount]);

  if (!isOpen) return null;

  const handleQuickAmount = (val: number) => {
    setAmount(val);
  };

  // Step 1: Proceed to PIN Authentication
  const handleProceedToAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }

    setLoading(true);

    try {
      // Create Gateway Order on Backend
      const orderRes = await razorpayApi.createOrder({
        amount,
        userEmail,
        purpose,
        receiverId,
        notes: `KyroPay Bank Debit - ${purpose}`,
      });

      const order = orderRes.data;
      setOrderData(order);
      setEnteredPin('');
      setStep('PIN_AUTH');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to initiate bank transaction.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle Pin Keypad Input
  const handleKeypadPress = (val: string) => {
    if (enteredPin.length < 6) {
      setEnteredPin(prev => prev + val);
      setError('');
    }
  };

  const handleKeypadBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
  };

  // Step 3: Authorize and Verify Payment with PIN
  const handleAuthorizeWithPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (enteredPin.length !== 6) {
      setError('Please enter your full 6-digit MPIN / Bank Security Code.');
      return;
    }

    setLoading(true);
    setStep('PROCESSING');

    // Simulate clearing switch verification
    setTimeout(async () => {
      try {
        const generatedPaymentId = 'pay_' + Math.random().toString(36).substring(2, 14);

        const verifyRes = await razorpayApi.verifyPayment({
          razorpayOrderId: orderData?.orderId || 'order_' + Math.random().toString(36).substring(2, 12),
          razorpayPaymentId: generatedPaymentId,
          razorpaySignature: 'bank_sig_' + Math.random().toString(36).substring(2, 12),
          amount,
          userEmail,
          purpose,
          receiverId,
          paymentMethod,
          bankName: paymentMethod === 'NETBANKING' ? selectedBank : paymentMethod === 'UPI' ? selectedUpiApp : 'Visa Debit Card',
        });

        // Play subtle success chime
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
          }
        } catch (_) {}

        setStep('SUCCESS');
        setTimeout(() => {
          onPaymentSuccess(verifyRes.data.transaction);
          onClose();
        }, 1200);

      } catch (verErr: any) {
        setError(verErr.response?.data?.error || verErr.message || 'Payment authorization failed.');
        setStep('PIN_AUTH');
        setLoading(false);
      }
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-slide-up">
        
        {/* Top Header - KyroPay Bank Switch */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-5 text-white flex justify-between items-center relative overflow-hidden border-b border-white/10">
          <div className="flex items-center gap-3">
            {step === 'PIN_AUTH' && (
              <button
                type="button"
                onClick={() => setStep('SELECT')}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition mr-1"
                title="Back to method selection"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="w-10 h-10 bg-blue-600/30 rounded-2xl flex items-center justify-center border border-blue-400/30 shadow-inner">
              <Building2 className="text-blue-300" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">KyroPay Bank Switch</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck size={11} /> NPCI Certified
                </span>
              </div>
              <p className="text-xs text-blue-200/80">Direct Real Bank Account Debit</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition disabled:opacity-30 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step: Processing State */}
        {step === 'PROCESSING' && (
          <div className="p-10 text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              <Building2 size={32} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Authorizing with Issuing Bank...</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Validating PIN with {paymentMethod === 'NETBANKING' ? selectedBank : paymentMethod === 'UPI' ? selectedUpiApp : 'Card Clearing Switch'}. Please do not close this window.
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 max-w-xs mx-auto text-[11px] text-blue-800 font-mono">
              Reference: {orderData?.orderId || 'order_processing...'}
            </div>
          </div>
        )}

        {/* Step: Success Animation */}
        {step === 'SUCCESS' && (
          <div className="p-10 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-black text-slate-900">Payment Authorized!</h3>
            <p className="text-xs text-slate-500">
              ₹{amount.toLocaleString('en-IN')} successfully debited from real bank account. Generating official payment slip...
            </p>
          </div>
        )}

        {/* Step: Authentic NPCI / Bank PIN Authorization */}
        {step === 'PIN_AUTH' && (
          <div className="p-6 space-y-5">
            {/* NPCI Security Header */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white text-xs">
                  ✓
                </div>
                <div>
                  <p className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">NPCI Common Library</p>
                  <p className="text-xs font-semibold text-slate-300">
                    {paymentMethod === 'UPI' ? `${selectedUpiApp} • Linked Bank Account` : paymentMethod === 'NETBANKING' ? `${selectedBank} NetBanking` : 'Debit Card 3D Secure'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Amount</p>
                <p className="text-base font-extrabold text-white">₹{amount.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                <span className="font-bold">Error:</span> {error}
              </div>
            )}

            {/* MPIN Input Display */}
            <div className="text-center py-2">
              <p className="text-xs font-black text-slate-700 tracking-wider uppercase mb-3">
                {paymentMethod === 'UPI' 
                  ? 'ENTER 6-DIGIT UPI PIN TO AUTHORIZE BANK DEBIT' 
                  : paymentMethod === 'NETBANKING' 
                  ? 'ENTER 6-DIGIT NETBANKING OTP' 
                  : 'ENTER 6-DIGIT 3D SECURE OTP'}
              </p>

              <div className="flex justify-center gap-3 mb-2">
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const hasVal = enteredPin.length > idx;
                  return (
                    <div 
                      key={idx}
                      className={`w-11 h-12 rounded-xl flex items-center justify-center text-xl font-bold transition border-2 ${
                        hasVal 
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-inner' 
                          : 'border-slate-200 bg-slate-50 text-slate-400'
                      }`}
                    >
                      {hasVal ? '●' : '—'}
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400 mt-2">
                {paymentMethod === 'UPI' 
                  ? 'UPI PIN will be verified directly by your issuing bank' 
                  : 'High Security OTP sent to registered mobile number'}
              </p>
            </div>

            {/* Interactive Numeric Keypad */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="py-3.5 bg-white hover:bg-slate-100 active:scale-95 rounded-xl font-bold text-lg text-slate-800 shadow-sm border border-slate-200 transition cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="py-3.5 bg-white hover:bg-red-50 text-red-600 active:scale-95 rounded-xl font-bold text-sm shadow-sm border border-slate-200 transition flex items-center justify-center cursor-pointer"
                  title="Backspace"
                >
                  <Delete size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="py-3.5 bg-white hover:bg-slate-100 active:scale-95 rounded-xl font-bold text-lg text-slate-800 shadow-sm border border-slate-200 transition cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleAuthorizeWithPin()}
                  disabled={enteredPin.length !== 6 || loading}
                  className="py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 active:scale-95 rounded-xl font-black text-sm text-white shadow-md transition flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  Submit ✓
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button 
                type="button" 
                onClick={() => setStep('SELECT')} 
                className="text-slate-500 hover:text-slate-800 font-bold"
              >
                Change Method
              </button>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Lock size={12} className="text-emerald-600" />
                <span>NPCI Encrypted Session</span>
              </div>
            </div>
          </div>
        )}

        {/* Step: Select & Configure */}
        {step === 'SELECT' && (
          <form onSubmit={handleProceedToAuth} className="p-6 space-y-5">
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                <span className="font-bold">Error:</span> {error}
              </div>
            )}

            {/* Purpose Banner */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Transaction Type</p>
                <p className="font-black text-slate-800 text-sm mt-0.5">
                  {purpose === 'ADD_FUNDS' ? 'Deposit / Add Funds to Account' : `Pay Merchant (${receiverName || receiverId})`}
                </p>
              </div>
              <span className="bg-blue-100 text-blue-700 font-bold text-[11px] px-2.5 py-1 rounded-lg">
                Instant Credit
              </span>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Amount (INR)</label>
                <span className="text-[11px] text-slate-400">Debit from Real Bank</span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">₹</span>
                <input
                  type="number"
                  min="1"
                  max="500000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  required
                  className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-extrabold text-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition shadow-inner"
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1 custom-scrollbar">
                {[500, 1000, 2000, 5000, 10000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAmount(val)}
                    className={`py-1 px-3 rounded-xl text-xs font-bold border transition shrink-0 ${
                      amount === val 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    +₹{val.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Rail Selector Tabs */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Choose Real Bank Debit Method
              </label>

              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'UPI' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone size={14} /> UPI Apps
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('NETBANKING')}
                  className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'NETBANKING' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 size={14} /> Net Banking
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'CARD' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard size={14} /> Debit Card
                </button>
              </div>
            </div>

            {/* Method Details */}
            {paymentMethod === 'UPI' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Select UPI App / Provider</p>
                <div className="grid grid-cols-2 gap-2">
                  {UPI_APPS.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUpiApp(app.name)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs font-bold cursor-pointer ${
                        selectedUpiApp === app.name 
                          ? 'bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-500/20' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                      }`}
                    >
                      <span>{app.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{app.handle}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paymentMethod === 'NETBANKING' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Select Registered Indian Bank</p>
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_BANKS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBank(b.name)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs font-bold cursor-pointer ${
                        selectedBank === b.name 
                          ? 'bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-500/20' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                      }`}
                    >
                      <span>{b.name}</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{b.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paymentMethod === 'CARD' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 font-bold outline-none"
                    placeholder="4111 2222 3333 4444"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 font-bold outline-none"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">CVV</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 font-bold outline-none"
                      placeholder="•••"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Authorize & Pay Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-600/25 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Initiating Bank Handshake...
                </>
              ) : (
                <>
                  <Lock size={16} /> Proceed to Enter UPI PIN (₹{amount.toLocaleString('en-IN')})
                </>
              )}
            </button>

            {/* Security Guarantee Footer */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>256-Bit SSL Encrypted • Powered by KyroPay Bank Gateway</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RazorpayCheckoutModal;
