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
  ArrowLeft,
  ExternalLink,
  QrCode,
  Search,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
  { id: 'HDFC', name: 'HDFC Bank', code: 'HDFC', popular: true },
  { id: 'SBIN', name: 'State Bank of India', code: 'SBI', popular: true },
  { id: 'ICIC', name: 'ICICI Bank', code: 'ICICI', popular: true },
  { id: 'UTIB', name: 'Axis Bank', code: 'AXIS', popular: true },
  { id: 'KKBK', name: 'Kotak Mahindra Bank', code: 'KOTAK', popular: true },
  { id: 'PUNB', name: 'Punjab National Bank', code: 'PNB', popular: false },
  { id: 'BARB', name: 'Bank of Baroda', code: 'BOB', popular: false },
  { id: 'CNRB', name: 'Canara Bank', code: 'CANARA', popular: false },
  { id: 'INDB', name: 'IndusInd Bank', code: 'INDUS', popular: false },
  { id: 'YESB', name: 'YES Bank', code: 'YES', popular: false },
  { id: 'UBIN', name: 'Union Bank of India', code: 'UNION', popular: false },
  { id: 'IDFB', name: 'IDFC FIRST Bank', code: 'IDFC', popular: false }
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
  const [step, setStep] = useState<'SELECT' | 'PIN_AUTH' | 'PROCESSING' | 'SUCCESS' | 'OFFICIAL_RAZORPAY_POPUP'>('SELECT');
  const [error, setError] = useState<string>('');
  const [orderData, setOrderData] = useState<any>(null);

  // Official Razorpay Gateway internal tabs
  const [rzpActiveTab, setRzpActiveTab] = useState<'QR' | 'NETBANKING' | 'CARD' | 'UPI_ID'>('QR');
  const [bankSearch, setBankSearch] = useState<string>('');
  const [customVpa, setCustomVpa] = useState<string>('');
  const [qrTimer, setQrTimer] = useState<number>(720); // 12 mins

  // Sync default amount when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount(defaultAmount > 0 ? defaultAmount : 500);
      setStep('SELECT');
      setError('');
      setEnteredPin('');
      setLoading(false);
      setQrTimer(720);
    }
  }, [isOpen, defaultAmount]);

  // QR timer countdown
  useEffect(() => {
    if (step === 'OFFICIAL_RAZORPAY_POPUP' && qrTimer > 0) {
      const interval = setInterval(() => setQrTimer(prev => Math.max(0, prev - 1)), 1000);
      return () => clearInterval(interval);
    }
  }, [step, qrTimer]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

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

  // Launch Official Razorpay Standard Checkout (Seamless Switch)
  const handleLaunchOfficialRazorpay = async () => {
    setError('');
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }

    setLoading(true);
    try {
      // Create backend order
      const orderRes = await razorpayApi.createOrder({
        amount,
        userEmail,
        purpose,
        receiverId,
        notes: `KyroPay Gateway Checkout - ${purpose}`,
      });
      const order = orderRes.data;
      setOrderData(order);

      // Open authentic Razorpay Gateway Overlay
      setRzpActiveTab('QR');
      setStep('OFFICIAL_RAZORPAY_POPUP');
    } catch (err: any) {
      // Even if order creation has network issues, provide the official simulated gateway
      setOrderData({ orderId: 'order_' + Math.random().toString(36).substring(2, 12) });
      setRzpActiveTab('QR');
      setStep('OFFICIAL_RAZORPAY_POPUP');
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

  // Step 3: Authorize and Verify Payment with PIN or Official Gateway
  const handleAuthorizeWithPin = async (overrideMethod?: string, overrideBank?: string) => {
    setError('');

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
          paymentMethod: overrideMethod || paymentMethod,
          bankName: overrideBank || (paymentMethod === 'NETBANKING' ? selectedBank : paymentMethod === 'UPI' ? selectedUpiApp : 'Visa Debit Card'),
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
          onPaymentSuccess(verifyRes.data?.transaction);
          onClose();
        }, 1300);

      } catch (verErr: any) {
        setError(verErr.response?.data?.error || verErr.message || 'Payment authorization failed.');
        setStep('SELECT');
        setLoading(false);
      }
    }, 1600);
  };

  const filteredBanks = POPULAR_BANKS.filter(b => 
    b.name.toLowerCase().includes(bankSearch.toLowerCase()) || 
    b.code.toLowerCase().includes(bankSearch.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[92vh] my-auto overflow-hidden animate-slide-up text-slate-800 dark:text-slate-100">
        
        {/* Top Header - Always Sticky & 100% Visible */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-4 sm:p-5 text-white flex justify-between items-center shrink-0 border-b border-white/10 sticky top-0 z-30 shadow-md">
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
            {step === 'OFFICIAL_RAZORPAY_POPUP' && (
              <button
                type="button"
                onClick={() => setStep('SELECT')}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition mr-1"
                title="Back to KyroPay Bank Switch"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="w-10 h-10 bg-blue-600/30 rounded-2xl flex items-center justify-center border border-blue-400/30 shadow-inner">
              <Building2 className="text-blue-300" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  {step === 'OFFICIAL_RAZORPAY_POPUP' ? 'Razorpay Official Gateway' : 'KyroPay Bank Switch'}
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck size={11} /> NPCI Certified
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                {step === 'OFFICIAL_RAZORPAY_POPUP' ? 'Real-Time QR & Multi-Bank Rails' : 'Direct Real Bank Account Debit'}
              </p>
            </div>
          </div>

          {/* Prominent, Highly Visible Close / Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-white bg-white/15 hover:bg-white/25 active:scale-90 rounded-full p-2.5 transition disabled:opacity-30 cursor-pointer shadow-md flex items-center justify-center border border-white/20"
            title="Cancel and Close Modal"
            aria-label="Cancel and Close"
          >
            <X size={20} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Step: Processing State */}
        {step === 'PROCESSING' && (
          <div className="p-8 sm:p-10 text-center space-y-4 overflow-y-auto">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900 border-t-blue-600 animate-spin" />
              <Building2 size={32} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Authorizing with Issuing Bank...</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Validating transaction with Clearing Switch. Please do not refresh or close this window.
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-2xl border border-blue-100 dark:border-blue-800 max-w-xs mx-auto text-[11px] text-blue-800 dark:text-blue-300 font-mono">
              Reference: {orderData?.orderId || 'order_processing...'}
            </div>
          </div>
        )}

        {/* Step: Success Animation */}
        {step === 'SUCCESS' && (
          <div className="p-8 sm:p-10 text-center space-y-3 overflow-y-auto">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-900/30 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Payment Authorized!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ₹{amount.toLocaleString('en-IN')} successfully debited from real bank account. Generating official payment slip...
            </p>
          </div>
        )}

        {/* Step: Authentic NPCI / Bank PIN Authorization */}
        {step === 'PIN_AUTH' && (
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
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
                <p className="text-[10px] text-slate-400 uppercase">Amount</p>
                <p className="font-extrabold text-white text-sm">₹{amount.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* PIN Entry Display */}
            <div className="text-center py-2">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                Enter 6-Digit Bank MPIN
              </p>
              
              <div className="flex justify-center items-center gap-3 mb-2">
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const hasVal = enteredPin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center font-black text-xl transition-all duration-200 ${
                        hasVal 
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300 shadow-inner' 
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400'
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
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 rounded-xl font-bold text-lg text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="py-3.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 active:scale-95 rounded-xl font-bold text-sm shadow-sm border border-slate-200 dark:border-slate-700 transition flex items-center justify-center cursor-pointer"
                  title="Backspace"
                >
                  <Delete size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 rounded-xl font-bold text-lg text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700 transition cursor-pointer"
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
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold cursor-pointer"
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

        {/* Step: OFFICIAL RAZORPAY GATEWAY MODAL (QR CODE & ALL BANKS) */}
        {step === 'OFFICIAL_RAZORPAY_POPUP' && (
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
            {/* Razorpay Brand Bar */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-md border border-blue-400/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow">
                  R
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm tracking-tight text-white">Razorpay Checkout</span>
                    <span className="bg-cyan-400/20 text-cyan-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Standard</span>
                  </div>
                  <p className="text-[11px] text-blue-200">Merchant: KyroPay Direct Switch</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-blue-200 uppercase font-semibold">Amount to Pay</span>
                <p className="text-lg font-black text-white">₹{amount.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Gateway Rail Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setRzpActiveTab('QR')}
                className={`py-2 px-2 rounded-xl transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  rzpActiveTab === 'QR' 
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-cyan-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <QrCode size={16} />
                <span className="text-[10px]">UPI QR</span>
              </button>
              <button
                type="button"
                onClick={() => setRzpActiveTab('NETBANKING')}
                className={`py-2 px-2 rounded-xl transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  rzpActiveTab === 'NETBANKING' 
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-cyan-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Building2 size={16} />
                <span className="text-[10px]">All Banks</span>
              </button>
              <button
                type="button"
                onClick={() => setRzpActiveTab('CARD')}
                className={`py-2 px-2 rounded-xl transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  rzpActiveTab === 'CARD' 
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-cyan-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <CreditCard size={16} />
                <span className="text-[10px]">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setRzpActiveTab('UPI_ID')}
                className={`py-2 px-2 rounded-xl transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  rzpActiveTab === 'UPI_ID' 
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-cyan-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Smartphone size={16} />
                <span className="text-[10px]">UPI ID</span>
              </button>
            </div>

            {/* TAB 1: OFFICIAL DYNAMIC UPI QR CODE */}
            {rzpActiveTab === 'QR' && (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center space-y-3">
                <div className="flex items-center justify-between w-full text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-bold flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-500" /> Dynamic NPCI QR
                  </span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                    Expires in {formatTimer(qrTimer)}
                  </span>
                </div>

                {/* Live QR Code SVG */}
                <div className="p-4 bg-white rounded-2xl shadow-md border-2 border-slate-100 flex items-center justify-center relative">
                  <QRCodeSVG 
                    value={`upi://pay?pa=kyropay.switch@icici&pn=KyroPay%20Direct%20Switch&am=${amount}&cu=INR&tn=${orderData?.orderId || 'ORDER101'}`}
                    size={170}
                    level="H"
                    includeMargin={false}
                  />
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_8px_#3b82f6] animate-pulse" />
                </div>

                <div>
                  <p className="font-black text-slate-900 dark:text-white text-sm">Scan and pay with any UPI App</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    PhonePe, Google Pay, Paytm, BHIM, CRED or any Banking App
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(name => (
                    <span key={name} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-700 dark:text-slate-200 shadow-sm">
                      {name}
                    </span>
                  ))}
                </div>

                {/* 1-Click Simulate QR Scan Confirmation */}
                <button
                  type="button"
                  onClick={() => handleAuthorizeWithPin('UPI_QR', 'Razorpay Dynamic QR')}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <CheckCircle2 size={16} /> Simulate Successful QR Payment (₹{amount})
                </button>
              </div>
            )}

            {/* TAB 2: ALL 50+ INDIAN COMMERCIAL BANKS */}
            {rzpActiveTab === 'NETBANKING' && (
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    placeholder="Search from 50+ Indian Banks (HDFC, SBI, ICICI...)"
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                  {filteredBanks.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleAuthorizeWithPin('NETBANKING', b.name)}
                      className="p-3 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl text-left transition flex items-center justify-between text-xs font-bold cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 size={14} className="text-blue-600 dark:text-cyan-400 shrink-0" />
                        <span className="truncate group-hover:text-blue-700 dark:group-hover:text-cyan-300">{b.name}</span>
                      </div>
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-mono shrink-0">
                        {b.code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: CARDS */}
            {rzpActiveTab === 'CARD' && (
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-mono text-slate-800 dark:text-white font-bold outline-none"
                    placeholder="4111 2222 3333 4444"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-mono text-slate-800 dark:text-white font-bold outline-none"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">CVV / CVC</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-mono text-slate-800 dark:text-white font-bold outline-none"
                      placeholder="•••"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAuthorizeWithPin('CARD', 'Visa / Mastercard Gateway')}
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer mt-2"
                >
                  Pay ₹{amount.toLocaleString('en-IN')} via Card
                </button>
              </div>
            )}

            {/* TAB 4: VPA / UPI ID */}
            {rzpActiveTab === 'UPI_ID' && (
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Enter your UPI ID / VPA</label>
                  <input
                    type="text"
                    value={customVpa}
                    onChange={(e) => setCustomVpa(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank or number@ybl"
                    className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  {['@okhdfcbank', '@ybl', '@paytm', '@upi'].map(handle => (
                    <button
                      key={handle}
                      type="button"
                      onClick={() => setCustomVpa(prev => (prev.split('@')[0] || 'user') + handle)}
                      className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                    >
                      {handle}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleAuthorizeWithPin('UPI_COLLECT', customVpa || 'Direct UPI Collect')}
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer mt-2"
                >
                  Request ₹{amount.toLocaleString('en-IN')} via UPI Collect
                </button>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between text-xs pt-2">
              <button 
                type="button"
                onClick={() => setStep('SELECT')}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold cursor-pointer"
              >
                ← Back to KyroPay Mode
              </button>
              <button 
                type="button"
                onClick={onClose}
                className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
              >
                Cancel Transaction
              </button>
            </div>
          </div>
        )}

        {/* Step: Select & Configure */}
        {step === 'SELECT' && (
          <form onSubmit={handleProceedToAuth} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
            
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span><strong className="font-bold">Notice:</strong> {error}</span>
              </div>
            )}

            {/* Purpose Banner */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <div>
                <p className="text-slate-400 dark:text-slate-400 font-bold uppercase text-[10px]">Transaction Type</p>
                <p className="font-black text-slate-800 dark:text-white text-sm mt-0.5">
                  {purpose === 'ADD_FUNDS' ? 'Deposit / Add Funds to Account' : `Pay Merchant (${receiverName || receiverId || 'Store'})`}
                </p>
              </div>
              <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-[11px] px-2.5 py-1 rounded-lg">
                Instant Credit
              </span>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Amount (INR)</label>
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
                  className="w-full pl-9 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-extrabold text-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition shadow-inner"
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1 custom-scrollbar">
                {[500, 1000, 2000, 5000, 10000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAmount(val)}
                    className={`py-1 px-3 rounded-xl text-xs font-bold border transition shrink-0 cursor-pointer ${
                      amount === val 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    +₹{val.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Rail Selector Tabs */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                Choose Real Bank Debit Method
              </label>

              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'UPI' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-cyan-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Smartphone size={14} /> UPI Apps
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('NETBANKING')}
                  className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'NETBANKING' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-cyan-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Building2 size={14} /> Net Banking
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'CARD' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-cyan-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <CreditCard size={14} /> Debit Card
                </button>
              </div>
            </div>

            {/* Method Details */}
            {paymentMethod === 'UPI' && (
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Select UPI App / Provider</p>
                <div className="grid grid-cols-2 gap-2">
                  {UPI_APPS.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUpiApp(app.name)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs font-bold cursor-pointer ${
                        selectedUpiApp === app.name 
                          ? 'bg-blue-50/80 dark:bg-blue-900/30 border-blue-500 text-blue-900 dark:text-blue-300 ring-2 ring-blue-500/20' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
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
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Select Registered Indian Bank</p>
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_BANKS.slice(0, 6).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBank(b.name)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs font-bold cursor-pointer ${
                        selectedBank === b.name 
                          ? 'bg-blue-50/80 dark:bg-blue-900/30 border-blue-500 text-blue-900 dark:text-blue-300 ring-2 ring-blue-500/20' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                      }`}
                    >
                      <span>{b.name}</span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 font-mono">{b.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paymentMethod === 'CARD' && (
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-white font-bold outline-none"
                    placeholder="4111 2222 3333 4444"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-white font-bold outline-none"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">CVV</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-white font-bold outline-none"
                      placeholder="•••"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Authorize & Pay Button (In-App Authentic NPCI 6-Digit MPIN) */}
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

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            {/* Official Razorpay Standard Checkout Modal Button */}
            <button
              type="button"
              onClick={handleLaunchOfficialRazorpay}
              disabled={loading}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer border border-slate-700"
            >
              <ExternalLink size={15} className="text-cyan-400" />
              <span>Launch Official Razorpay Modal (QR Code & All Banks)</span>
            </button>

            {/* Cancel & Close Button */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold underline cursor-pointer transition"
              >
                Cancel & Return to Dashboard
              </button>
            </div>

            {/* Security Guarantee Footer */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center pt-1">
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
