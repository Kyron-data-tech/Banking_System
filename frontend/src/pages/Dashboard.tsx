import { QrScannerModal } from '../components/QrScannerModal';
import type { ScannedUpiPayload } from '../components/QrScannerModal';
import { UpiQrStandee } from '../components/UpiQrStandee';
import { KyroLogo } from '../components/KyroLogo';
import { PaymentReceiptModal } from '../components/PaymentReceiptModal';
import { MerchantSettlementModal } from '../components/MerchantSettlementModal';
import { AccountStatementModal } from '../components/AccountStatementModal';
import { RazorpayCheckoutModal } from '../components/RazorpayCheckoutModal';
import { LinkBankAccountModal } from '../components/LinkBankAccountModal';
import type { LinkedBankAccount } from '../components/LinkBankAccountModal';
import { ContactsManager } from '../components/ContactsManager';
import { RewardsView } from '../components/RewardsView';
import { BankAccountsView } from '../components/BankAccountsView';
import { SoundboxTester } from '../components/SoundboxTester';
import { playKyroPaySoundbox } from '../utils/soundbox';
import { ThemeToggle } from '../components/ThemeToggle';
import { BankEmployeePortal } from '../components/BankEmployeePortal';
import { UserButton, useUser, useClerk } from '@clerk/clerk-react';
import React, { useEffect, useState } from 'react';
import {
  Camera, Users, CreditCard, ShieldCheck, Activity,
  LogOut, Layers, Bot,
  TrendingUp, AlertTriangle, CheckCircle2,
  X, Plus, QrCode,
  Receipt, FileSpreadsheet, Building2, ArrowDownToLine,
  Gift, Volume2, Smartphone, Send, Sparkles, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { upiApi } from '../api';
import { History as HistoryIcon, ChevronDown } from 'lucide-react';

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
          <h3 className="font-bold text-base text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------
// HACKATHON DASHBOARDS: Normal User (Sender) & Merchant (Receiver/Sender)
// (Legacy employee pages replaced by BankEmployeePortal)
// --------------------------------------------------------------------------------

const TransactionItem = ({ tx, onViewReceipt }: { tx: any; onViewReceipt?: (tx: any) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const isOut = tx.type === 'OUT';
  const isSettlement = tx.receiverId?.startsWith('BANK SETTLEMENT:') || tx.receiverId?.startsWith('SETTLEMENT:');
  const isRazorpay = tx.parentReferenceNo?.startsWith('order_') || tx.senderId?.includes('Real Bank') || tx.packets?.some((p: any) => p.packetUtr?.startsWith('pay_'));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 mb-3 overflow-hidden transition hover:shadow-md">
      <div className="p-4 cursor-pointer hover:bg-slate-50/80 transition flex justify-between items-center" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isSettlement 
              ? 'bg-purple-100 text-purple-700' 
              : isOut 
              ? 'bg-orange-100 text-orange-600' 
              : 'bg-emerald-100 text-emerald-600'
          }`}>
            {isSettlement ? <Building2 size={20} /> : <Activity size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-extrabold text-sm text-slate-800">
                {isSettlement ? 'Bank Settlement' : isOut ? 'Paid to' : 'Received from'}
              </p>
              {isRazorpay && (
                <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">
                  ⚡ Real Bank
                </span>
              )}
              {tx.packets && tx.packets.length > 1 && (
                <span className="text-[10px] bg-emerald-50 border border-emerald-300 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-xs">
                  <span>🛡️</span> {tx.packets.length} Packets (0% MDR)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 max-w-[150px] truncate">
              {isOut ? tx.receiverId : tx.senderId}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN') : 'Just now'}
            </p>
          </div>
        </div>
        <div className="text-right flex items-center gap-3">
          <div>
            <p className={`font-black text-sm md:text-base ${
              isSettlement 
                ? 'text-purple-700' 
                : isOut 
                ? 'text-slate-900' 
                : 'text-emerald-600'
            }`}>
              {isOut ? '-' : '+'}₹{Number(tx.totalAmount).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
              {tx.status}
            </p>
          </div>
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {expanded && (
        <div className="bg-slate-50 p-4 border-t border-slate-100 space-y-3">
          {tx.packets && tx.packets.length > 0 && (
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bot size={15} className="text-blue-600"/>
                  <p className="text-xs font-bold text-slate-800">
                    {isSettlement ? 'Settlement UTR Reference' : `NPCI Smart Split Packets (${tx.packets.length})`}
                  </p>
                </div>
                {tx.packets.length > 1 && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                    0% MDR Tax Exempt
                  </span>
                )}
              </div>
              {tx.packets.length > 1 && (
                <div className="text-[11px] text-emerald-800 bg-emerald-50/80 p-2.5 rounded-xl mb-2.5 border border-emerald-200/80 leading-relaxed">
                  💡 <b>NPCI Smart Packet Engine:</b> Total amount of <b>₹{Number(tx.totalAmount).toLocaleString('en-IN')}</b> was automatically decomposed into <b>{tx.packets.length} micro-packets</b> of max ₹1,999 to bypass the 1.1% merchant interchange fee (saving ~₹{Math.round(Number(tx.totalAmount) * 0.011)} in MDR taxes).
                </div>
              )}
              <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar pr-1">
                {tx.packets.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-slate-50 hover:bg-blue-50/40 transition p-2.5 rounded-xl border border-slate-200/80 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center shrink-0">
                        #{i + 1}
                      </span>
                      <span className="font-mono text-slate-600 font-semibold text-[11px]">UTR: {p.packetUtr}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-emerald-700 font-extrabold bg-emerald-100/70 border border-emerald-200 px-1.5 py-0.5 rounded">0% FEE</span>
                      <span className="font-black text-slate-900 text-xs">₹{p.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewReceipt && onViewReceipt(tx);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Receipt size={14} /> View / Download Slip
            </button>
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
        const playOscillator = (freq: number, startTime: number, duration: number) => {
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

const SmartPayForm = ({ 
  defaultVpa = '', 
  defaultAmount = '',
  defaultName = '',
  availableBalance,
  onComplete,
  onOpenScanner,
  onPayViaRazorpay
}: { 
  defaultVpa?: string, 
  defaultAmount?: string,
  defaultName?: string,
  availableBalance?: number,
  onComplete: (tx?: any) => void,
  onOpenScanner?: () => void,
  onPayViaRazorpay?: (amount: number, targetVpa: string, targetName: string) => void
}) => {
    const { user } = useUser();
    const { user: backendUser } = useAuth();
    const [vpa, setVpa] = useState(defaultVpa);
    const [amount, setAmount] = useState(defaultAmount);
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [localToast, setLocalToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
    
    // NEW NPCI STATES
    const [verifying, setVerifying] = useState(false);
    const [verifiedName, setVerifiedName] = useState<string | null>(defaultName || null);
    const [showMpin, setShowMpin] = useState(false);
    const [enteredMpin, setEnteredMpin] = useState("");

    const isInsufficient = availableBalance !== undefined && Number(amount) > availableBalance;

    useEffect(() => {
      if (defaultVpa) {
        setVpa(defaultVpa);
        if (defaultName) {
          setVerifiedName(defaultName);
        } else {
          upiApi.verifyVpa(defaultVpa).then(res => setVerifiedName(res.data.verifiedName)).catch(() => setVerifiedName(null));
        }
      }
      if (defaultAmount) {
        setAmount(defaultAmount);
      }
    }, [defaultVpa, defaultAmount, defaultName]);

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
        if (isInsufficient) {
            setLocalToast({
                msg: `Transaction Blocked: Insufficient Kyro balance (Available: ₹${availableBalance?.toLocaleString('en-IN') || 0}).`,
                type: 'error'
            });
            return;
        }
        setShowMpin(true);
    };

    const executePayment = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const email = backendUser?.email || user?.primaryEmailAddress?.emailAddress || 'demo_user';
            const res = await upiApi.sendOptimized(email, vpa, Number(amount), enteredMpin);
            setShowMpin(false);
            setStatus(Number(amount) > 2000 ? 'SPLIT_SUCCESS' : 'SUCCESS');
            setLocalToast({ msg: `Payment of ₹${amount} successful!`, type: 'success' });
            playSuccessSound();
            onComplete(res.data?.transaction);
            setAmount('');
            setVerifiedName(null);
            setTimeout(() => setLocalToast(null), 4000);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || '';
            if (errorMsg.includes("NPCI-U16") || errorMsg.includes("Risk Threshold")) {
                setStatus('RISK_REJECTED');
                setLocalToast({ msg: 'Payment rejected by NPCI risk engine.', type: 'error' });
            } else if (errorMsg.includes("NPCI-U17") || errorMsg.includes("Insufficient Funds") || errorMsg.includes("Insufficient")) {
                setStatus(null);
                setLocalToast({ msg: errorMsg || 'Payment Failed: Insufficient funds in account.', type: 'error' });
            } else if (errorMsg.includes("INVALID_MPIN") || errorMsg.includes("Incorrect MPIN")) {
                setStatus(null);
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
        
        {/* Scanned QR or Contact Payee Notification Banner */}
        {defaultVpa && (
          <div className="mb-4 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                {defaultAmount ? <QrCode size={20} /> : <Users size={20} />}
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  {defaultAmount ? 'QR Payee Fetched' : 'Verified Contact Payee'}
                </span>
                <p className="text-sm font-black text-slate-900 mt-0.5">{verifiedName || vpa}</p>
                <p className="text-xs font-mono text-slate-500">{vpa}</p>
              </div>
            </div>
            {amount ? (
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase">QR Amount</span>
                <p className="text-base font-black text-slate-900">₹{amount}</p>
              </div>
            ) : (
              <div className="text-right">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase border border-emerald-200">
                  1-Tap Pay
                </span>
              </div>
            )}
          </div>
        )}

        {onOpenScanner && (
          <div 
            onClick={onOpenScanner}
            className="mb-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 p-4 rounded-2xl text-white flex items-center justify-between shadow-lg cursor-pointer transition hover:shadow-xl active:scale-[0.98] border border-white/20"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <Camera size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm tracking-tight">Scan Any UPI QR Code</span>
                  <span className="bg-emerald-400 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase">Instant</span>
                </div>
                <p className="text-xs text-blue-100 mt-0.5">Live Camera Scanner & Upload from Gallery</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <QrCode size={16} />
            </div>
          </div>
        )}

        <form onSubmit={handlePayClick} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">To UPI ID / Number</label>
              <div className="flex items-center gap-1">
                {['consumer@okkyro', 'merchant@okkyro'].map(testVpa => (
                  <button
                    key={testVpa}
                    type="button"
                    onClick={() => { setVpa(testVpa); setVerifiedName(testVpa.split('@')[0]); }}
                    className="text-[10px] bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 font-semibold px-1.5 py-0.5 rounded border border-slate-200 transition"
                  >
                    {testVpa.split('@')[0]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
                <input required value={vpa} onChange={e => {setVpa(e.target.value); setVerifiedName(null);}} placeholder="name@okkyro or mobile@upi" 
  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-medium" />
                {onOpenScanner && (
                  <button type="button" onClick={onOpenScanner} title="Scan QR Code" className="px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition border border-blue-200 flex items-center justify-center">
                    <QrCode size={18} />
                  </button>
                )}
                <button type="button" onClick={handleVerify} disabled={verifying} className="px-4 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-300 transition-colors">{verifying ? '...' : 'Verify'}</button>
            </div>
            {verifiedName && <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1"><CheckCircle2 size={14}/> {verifiedName}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Amount (₹)</label>
              <div className="flex items-center gap-1">
                {[100, 500, 1000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(String(val))}
                    className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-bold px-2 py-0.5 rounded border border-slate-200 transition"
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>
            <input required type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} 
  placeholder="0.00" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold outline-none" />

            {/* Insufficient Balance Error Notice */}
            {isInsufficient && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 animate-fade-in">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
                <div className="text-xs">
                  <span className="font-bold">Insufficient Kyro Balance!</span> Available balance: <strong>₹{availableBalance?.toLocaleString('en-IN') || 0}</strong>. You cannot transfer ₹{amount} from your Kyro balance. Please enter a lower amount or click <strong>Pay via Real Bank Account</strong> below.
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-1">
            {onPayViaRazorpay && (
              <button 
                type="button" 
                onClick={() => onPayViaRazorpay(Number(amount) || 500, vpa || 'merchant@okkyro', verifiedName || vpa || 'Merchant Store')}
                className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border border-white/20"
                title="Open KyroPay UPI Gateway & Real Bank Switch"
              >
                <Sparkles size={18} className="text-yellow-300 animate-pulse" />
                <span>⚡ Pay via KyroPay Instant Gateway (Dynamic QR & UPI Apps)</span>
                <span className="text-[10px] bg-emerald-400 text-slate-900 px-2 py-0.5 rounded-full font-black ml-1 uppercase">0% Fee</span>
              </button>
            )}

            <button 
              type="submit" 
              disabled={loading || Number(amount) <= 0 || !vpa || isInsufficient} 
              className={`w-full py-3 rounded-xl font-bold text-xs flex justify-center items-center gap-2 transition active:scale-95 cursor-pointer ${
                isInsufficient 
                  ? 'bg-red-50 border border-red-200 text-red-600 cursor-not-allowed opacity-80' 
                  : 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 disabled:opacity-50'
              }`}
            >
              {isInsufficient ? '❌ Insufficient Kyro Balance (Blocked)' : 'Pay from Kyro Internal Balance'}
            </button>
          </div>
    
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

const MobileDashboardLayout = ({ title, upiId, children, activeTab, setActiveTab, onOpenScanner }: any) => {
  const { logout, user: backendUser } = useAuth();
  const { user: clerkUser } = useUser();
  const isMerchant = Boolean(title?.toLowerCase().includes('business') || title?.toLowerCase().includes('merchant'));
  
  const handleLogout = () => {
    if (backendUser) logout();
  };

  return (
    <div className="w-full max-w-md md:max-w-5xl lg:max-w-6xl mx-auto bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl h-[100dvh] md:h-[90vh] md:min-h-[720px] md:rounded-[40px] shadow-2xl border border-white/40 dark:border-slate-800 mt-0 md:mt-8 overflow-hidden flex flex-col md:flex-row animate-slide-up relative z-10 transition-colors">
      
      {/* LEFT PANEL: Mobile Header / Desktop Sidebar */}
      <div className="md:w-72 bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col relative z-20 shadow-2xl shrink-0">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white rounded-b-[36px] md:rounded-b-none md:rounded-br-[40px] shadow-lg relative z-10">
          <div className="flex justify-between md:justify-center items-center mb-3 md:mb-5">
            <div className="flex items-center gap-2">
              <KyroLogo size="sm" variant={title?.includes('Business') ? 'merchant' : 'personal'} />
              <h2 className="font-extrabold text-base md:text-lg tracking-tight">{title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="flex md:hidden items-center gap-2">
                {clerkUser && <UserButton />}
                {backendUser && (
                  <button onClick={handleLogout} className="text-white hover:text-blue-200">
                    <LogOut size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-inner mb-2">
              <span className="text-blue-600 font-extrabold text-2xl md:text-3xl">
                {(backendUser?.fullName || clerkUser?.fullName || 'K').charAt(0)}
              </span>
            </div>
            <p className="font-bold text-white text-sm md:text-base truncate max-w-[200px] text-center">
              {backendUser?.fullName || clerkUser?.fullName || 'Kyro User'}
            </p>
            <div className="mt-2 bg-white/20 rounded-xl p-2 border border-white/30 backdrop-blur-md w-full max-w-[220px]">
              <p className="text-[10px] text-blue-100 uppercase font-bold tracking-wider mb-0.5 text-center">Your UPI ID</p>
              <p className="text-xs font-mono font-bold truncate px-1 text-center">{upiId}</p>
            </div>
          </div>
        </div>
        
        {/* DESKTOP NAVIGATION SIDEBAR */}
        <div className="hidden md:flex flex-col gap-1.5 p-3 flex-1 mt-2 overflow-y-auto no-scrollbar pb-6 scrollbar-hide text-xs">
          {/* Quick Action: Scan QR (Prominent) */}
          <button
            type="button"
            onClick={() => onOpenScanner ? onOpenScanner() : setActiveTab('scan')}
            className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-300 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-blue-600/30 hover:scale-[1.02] active:scale-95 text-left font-bold mb-1"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Camera size={18} className="animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-sm block">Scan Any QR</span>
              <span className="text-[10px] text-blue-100 font-normal">Camera & Screenshot</span>
            </div>
          </button>

          <div className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${activeTab === 'pay' ? 'bg-blue-600 text-white font-bold shadow-md' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab('pay')}>
            <Activity size={18} /> <span className="font-medium text-xs">Payments & Transfer</span>
          </div>

          <div className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${activeTab === 'my-qr' ? 'bg-blue-600 text-white font-bold shadow-md' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab('my-qr')}>
            <QrCode size={18} /> <span className="font-medium text-xs">{isMerchant ? 'Store Standee QR' : 'My QR Code'}</span>
          </div>

          <div className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white font-bold shadow-md' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab('history')}>
            <HistoryIcon size={18} /> <span className="font-medium text-xs">Payment History</span>
          </div>

          <div className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${activeTab === 'contact' ? 'bg-blue-600 text-white font-bold shadow-md' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab('contact')}>
            <Users size={18} /> <span className="font-medium text-xs">Verified Contacts</span>
          </div>

          <div className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${activeTab === 'banks' ? 'bg-blue-600 text-white font-bold shadow-md' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab('banks')}>
            <Building2 size={18} /> <span className="font-medium text-xs">Bank Accounts & Balance</span>
          </div>

          <div className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${activeTab === 'rewards' ? 'bg-blue-600 text-white font-bold shadow-md' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab('rewards')}>
            <Gift size={18} className="text-amber-300" /> <span className="font-medium text-xs">Rewards & Cashback</span>
          </div>

          <div className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${activeTab === 'soundbox' ? 'bg-blue-600 text-white font-bold shadow-md' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab('soundbox')}>
            <Volume2 size={18} className="text-emerald-300" /> <span className="font-medium text-xs">Smart Soundbox Voice</span>
          </div>

          {isMerchant ? (
            <div className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${activeTab === 'developer' ? 'bg-blue-600 text-white font-bold shadow-md' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab('developer')}>
              <ShieldCheck size={18} /> <span className="font-medium text-xs">Merchant API Keys</span>
            </div>
          ) : (
            <div className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${activeTab === 'statement' ? 'bg-blue-600 text-white font-bold shadow-md' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab('statement')}>
              <FileSpreadsheet size={18} /> <span className="font-medium text-xs">Account Statement</span>
            </div>
          )}
          
          {/* Live External Gateway: YouPI PG Live Service */}
          <div className="mt-2 pt-2 border-t border-slate-700/60">
            <p className="text-[10px] uppercase font-bold text-slate-400 px-2 mb-1.5 tracking-wider flex items-center justify-between">
              <span>YouPI PG Engine</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold">ONLINE</span>
            </p>
            <div className="flex flex-col gap-1">
              <a 
                href="http://localhost:5000" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[11px] font-bold border border-slate-700"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
                  <span className="truncate">Showcase Store</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono shrink-0">
                  <span>:5000</span>
                  <ExternalLink size={10} />
                </div>
              </a>
              <a 
                href="http://localhost:6001" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[11px] font-bold border border-slate-700"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
                  <span className="truncate">Merchant Hub</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono shrink-0">
                  <span>:6001</span>
                  <ExternalLink size={10} />
                </div>
              </a>
            </div>
          </div>

          <div className="mt-auto pt-4">
             <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-2xl border border-slate-700/60">
               <div className="flex items-center gap-2">
                  {clerkUser && <UserButton />}
                  <span className="text-[11px] text-slate-400 font-bold">Profile</span>
               </div>
               <div className="flex items-center gap-1.5">
                 {backendUser && (
                  <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition p-1">
                    <LogOut size={16} />
                  </button>
                 )}
               </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* MAIN CONTENT AREA */}
      <div className="p-4 pt-4 md:p-8 flex-1 overflow-y-auto no-scrollbar bg-slate-50/60 dark:bg-slate-950/60 relative transition-colors">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </div>
      
      {/* MOBILE BOTTOM NAV WITH CENTER FLOATING SCANNER HERO */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-2 shrink-0 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] relative z-20 transition-colors">
        <div className="flex justify-around items-end">
          {/* TAB 1: PAYMENTS */}
          <div className="flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 py-1 min-w-[50px]" onClick={() => setActiveTab('pay')}>
            <Activity size={20} className={activeTab === 'pay' ? 'text-blue-600' : 'text-slate-400'} />
            <span className={`text-[10px] font-bold ${activeTab === 'pay' ? 'text-blue-600' : 'text-slate-500'}`}>Pay</span>
          </div>

          {/* TAB 2: HISTORY */}
          <div className="flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 py-1 min-w-[50px]" onClick={() => setActiveTab('history')}>
            <HistoryIcon size={20} className={activeTab === 'history' ? 'text-blue-600' : 'text-slate-400'} />
            <span className={`text-[10px] font-bold ${activeTab === 'history' ? 'text-blue-600' : 'text-slate-500'}`}>History</span>
          </div>

          {/* TAB 3 (CENTER HERO): SCAN ANY QR CODE */}
          <div 
            onClick={() => onOpenScanner ? onOpenScanner() : setActiveTab('scan')} 
            className="relative -top-4 flex flex-col items-center group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform group-hover:scale-110 active:scale-95 border-4 border-white dark:border-slate-800 bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-blue-500/50">
              <Camera size={26} className="text-white animate-pulse" />
            </div>
            <span className="text-[10px] font-black mt-0.5 text-blue-600 dark:text-blue-400">
              Scan QR
            </span>
          </div>

          {/* TAB 4: MY QR CODE */}
          <div className="flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 py-1 min-w-[50px]" onClick={() => setActiveTab('my-qr')}>
            <QrCode size={20} className={activeTab === 'my-qr' ? 'text-blue-600' : 'text-slate-400'} />
            <span className={`text-[10px] font-bold ${activeTab === 'my-qr' ? 'text-blue-600' : 'text-slate-500'}`}>My QR</span>
          </div>

          {/* TAB 5: CONTACTS */}
          <div className="flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 py-1 min-w-[50px]" onClick={() => setActiveTab('contact')}>
            <Users size={20} className={activeTab === 'contact' ? 'text-blue-600' : 'text-slate-400'} />
            <span className={`text-[10px] font-bold ${activeTab === 'contact' ? 'text-blue-600' : 'text-slate-500'}`}>Contacts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PhonePeDashboard = ({ verifiedUpiId, initialTab }: { verifiedUpiId: string | null; initialTab?: string }) => {
    const [activeTab, setActiveTab] = useState<string>(() => {
      if (initialTab && initialTab !== 'scan') return initialTab;
      return 'pay';
    });
    const [showScanner, setShowScanner] = useState<boolean>(() => initialTab === 'scan');
    const [scannedPayee, setScannedPayee] = useState<ScannedUpiPayload | null>(null);
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

    const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
    const [showStatementModal, setShowStatementModal] = useState<boolean>(false);
    const [showRazorpayModal, setShowRazorpayModal] = useState<boolean>(false);
    const [razorpayPurpose, setRazorpayPurpose] = useState<'ADD_FUNDS' | 'PAY_MERCHANT'>('ADD_FUNDS');
    const [razorpayTargetVpa, setRazorpayTargetVpa] = useState<string>('');
    const [razorpayTargetName, setRazorpayTargetName] = useState<string>('');
    const [razorpayAmount, setRazorpayAmount] = useState<number>(500);

  const { user } = useUser();
  const { user: backendUser } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(0);

  const [showLinkBankModal, setShowLinkBankModal] = useState<boolean>(false);
  const [linkedBanks, setLinkedBanks] = useState<LinkedBankAccount[]>(() => {
    try {
      const saved = localStorage.getItem('kyro_linked_banks');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'bank_hdfc_default',
        bankName: 'HDFC Bank',
        accountNumber: '•••• 4321',
        rawAccountNumber: '50100412344321',
        ifsc: 'HDFC0001234',
        accountHolder: user?.fullName || backendUser?.fullName || 'Demo Consumer',
        accountType: 'SAVINGS',
        isPrimary: true,
        linkedAt: '2026-10-15T10:00:00Z',
      }
    ];
  });

  const handleAccountLinked = (newAcc: LinkedBankAccount) => {
    setLinkedBanks(prev => {
      const updated = [newAcc, ...prev.map(b => ({ ...b, isPrimary: false }))];
      try {
        localStorage.setItem('kyro_linked_banks', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  useEffect(() => {
        setBalanceVisible(false);
    }, [activeTab]);

    const savedDeposits = Number(localStorage.getItem('kyro_deposited_funds')) || 0;
    const totalIn = history.filter(t => t.type === 'IN' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.totalAmount, 0);
    const totalOut = history.filter(t => t.type === 'OUT' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.totalAmount, 0);
    // Ensure consumer balance never displays 0: Base ₹1,00,000 + deposits + inflows - outflows.
    // If prior test transfers accumulated totalOut >= 100,000, provide auto-replenished liquidity buffer (min ₹84,500)
    const calculatedBal = 100000 + savedDeposits + totalIn - totalOut;
    const currentBalance = calculatedBal > 0 ? calculatedBal : (84500 + totalIn);

    const handleQuickTopUp = (amount = 25000) => {
      const cur = Number(localStorage.getItem('kyro_deposited_funds')) || 0;
      localStorage.setItem('kyro_deposited_funds', String(cur + amount));
      setRefresh(r => r + 1);
    };

    const fetchHistory = () => {
      const email = backendUser?.email || user?.primaryEmailAddress?.emailAddress || 'normal@kyro';
      const upiId = verifiedUpiId || (email.split('@')[0] + '@okkyro');

      const calls: Promise<any>[] = [
        upiApi.getInflows(email).catch(() => ({ data: [] })),
        upiApi.getOutflows(email).catch(() => ({ data: [] }))
      ];

      if (upiId && upiId !== email) {
        calls.push(upiApi.getInflows(upiId).catch(() => ({ data: [] })));
        calls.push(upiApi.getOutflows(upiId).catch(() => ({ data: [] })));
      }

      Promise.all(calls).then((responses) => {
        const ins = [
          ...responses[0].data.map((tx: any) => ({ ...tx, type: 'IN' })),
          ...(responses[2] ? responses[2].data.map((tx: any) => ({ ...tx, type: 'IN' })) : [])
        ];
        const outs = [
          ...responses[1].data.map((tx: any) => ({ ...tx, type: 'OUT' })),
          ...(responses[3] ? responses[3].data.map((tx: any) => ({ ...tx, type: 'OUT' })) : [])
        ];

        const allTxs = [...ins, ...outs];
        const uniqueTxs = Array.from(new Map(allTxs.map(tx => [tx.id, tx])).values());
        const valid = uniqueTxs.filter((tx: any) => tx.status === 'COMPLETED');
        setHistory(valid.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      });
    };

    useEffect(() => {
      fetchHistory();
      const interval = setInterval(fetchHistory, 3000);
      return () => clearInterval(interval);
    }, [refresh, user, backendUser, activeTab, verifiedUpiId]);

  return (
    <MobileDashboardLayout 
      title="KyroPay Personal" 
      upiId={verifiedUpiId || user?.primaryEmailAddress?.emailAddress || backendUser?.email || 'normal@kyro'} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onOpenScanner={() => setShowScanner(true)}
    >
      {activeTab === 'pay' && (
        <div className="animate-fade-in">

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl mb-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400/20 rounded-full blur-xl transform -translate-x-5 translate-y-5" />
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Available Balance</p>
                {balanceVisible ? (
                  <>
                    <h2 className="text-4xl font-extrabold tracking-tight">₹{currentBalance.toLocaleString('en-IN')}<span className="text-lg text-blue-200">.00</span></h2>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-blue-200 flex items-center gap-1">
                        <Activity size={12} /> Live Core Verified
                      </p>
                      <button
                        type="button"
                        onClick={() => handleQuickTopUp(25000)}
                        className="text-[10px] bg-white/20 hover:bg-white/30 text-white font-bold px-2 py-0.5 rounded-lg border border-white/20 transition cursor-pointer"
                        title="Top Up INR 25,000"
                      >
                        + ₹25k Reload
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => setShowBalanceModal(true)} className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-sm border border-white/20 cursor-pointer">
                      <ShieldCheck size={16} /> Check Balance
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickTopUp(25000)}
                      className="bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 backdrop-blur-md border border-emerald-400/30 transition cursor-pointer"
                      title="Instant Top Up INR 25,000"
                    >
                      <Plus size={14} /> +₹25k
                    </button>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                <CreditCard size={24} className="text-white" />
              </div>
            </div>

            {/* Quick Real Bank Deposit Action via Razorpay */}
            <div className="relative z-10 mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
              <span className="text-xs text-blue-100 font-medium">Real Bank Account Debit</span>
              <button
                type="button"
                onClick={() => {
                  setRazorpayPurpose('ADD_FUNDS');
                  setRazorpayAmount(1000);
                  setRazorpayTargetVpa('');
                  setRazorpayTargetName('');
                  setShowRazorpayModal(true);
                }}
                className="bg-white/20 hover:bg-white/30 active:scale-95 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 backdrop-blur-md border border-white/20 shadow-sm transition"
              >
                <Plus size={14} className="text-emerald-300" /> Add Money (Bank)
              </button>
            </div>
          </div>

          {/* REAL UPI QUICK ACTIONS GRID (PhonePe / Google Pay Style) */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 mb-6 border border-slate-200/80 dark:border-slate-700 shadow-sm transition-colors">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-1.5">
              <Send size={12} className="text-blue-600" /> Transfer Money
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              {/* 1. Scan Any QR */}
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition">
                  <Camera size={22} className="animate-pulse" />
                </div>
                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 leading-tight">
                  Scan QR
                </span>
              </button>

              {/* 2. To Mobile / Contacts */}
              <button
                type="button"
                onClick={() => setActiveTab('contact')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-slate-600 group-hover:scale-105 transition">
                  <Smartphone size={22} />
                </div>
                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 leading-tight">
                  To Mobile
                </span>
              </button>

              {/* 3. To Bank A/C */}
              <button
                type="button"
                onClick={() => {
                  setRazorpayPurpose('ADD_FUNDS');
                  setRazorpayAmount(1000);
                  setShowRazorpayModal(true);
                }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-slate-600 group-hover:scale-105 transition">
                  <Building2 size={22} />
                </div>
                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 leading-tight">
                  To Bank
                </span>
              </button>

              {/* 4. My QR Code */}
              <button
                type="button"
                onClick={() => setActiveTab('my-qr')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-slate-700 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-slate-600 group-hover:scale-105 transition">
                  <QrCode size={22} />
                </div>
                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 leading-tight">
                  My QR
                </span>
              </button>
            </div>

            {/* Quick Services Row */}
            <div className="grid grid-cols-4 gap-2 text-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setActiveTab('banks')}
                className="flex flex-col items-center gap-1 p-1 hover:text-blue-600 transition cursor-pointer"
              >
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  💳 Balance
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rewards')}
                className="flex flex-col items-center gap-1 p-1 hover:text-amber-500 transition cursor-pointer"
              >
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  🎁 Rewards
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('soundbox')}
                className="flex flex-col items-center gap-1 p-1 hover:text-emerald-500 transition cursor-pointer"
              >
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  🔊 Soundbox
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowStatementModal(true)}
                className="flex flex-col items-center gap-1 p-1 hover:text-indigo-500 transition cursor-pointer"
              >
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  📄 Statement
                </span>
              </button>
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

          {/* KYROPAY DIRECT REAL BANK SWITCH (PERSONAL) */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-5 mb-6 border border-blue-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                  <Building2 size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-2">
                    KyroPay Direct Bank Switch
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">NPCI / 256-Bit SSL</span>
                  </h4>
                  <p className="text-[11px] text-blue-200">Debit money directly from your real bank account via UPI / NetBanking</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3 relative z-10 overflow-x-auto pb-1">
              <span className="text-[11px] text-blue-200 font-semibold shrink-0">Quick Deposit:</span>
              {[500, 1000, 2000, 5000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setRazorpayPurpose('ADD_FUNDS');
                    setRazorpayAmount(amt);
                    setRazorpayTargetVpa('');
                    setRazorpayTargetName('');
                    setShowRazorpayModal(true);
                  }}
                  className="text-xs bg-white/10 hover:bg-white/20 active:scale-95 text-white font-extrabold px-3 py-1.5 rounded-xl border border-white/20 transition shrink-0 cursor-pointer"
                >
                  + ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setRazorpayPurpose('ADD_FUNDS');
                setRazorpayAmount(1000);
                setRazorpayTargetVpa('');
                setRazorpayTargetName('');
                setShowRazorpayModal(true);
              }}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl text-xs shadow-md flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer relative z-10 border border-blue-400/30"
            >
              <Plus size={16} /> Deposit Funds via Bank Account (UPI / NetBanking)
            </button>
          </div>

          {/* LINKED COMMERCIAL BANK ACCOUNTS (NPCI VERIFIED) */}
          <div className="bg-white rounded-3xl p-5 mb-6 border border-slate-200 shadow-md">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Building2 size={18} />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800">Linked Commercial Bank Accounts</h4>
                  <p className="text-[10px] text-slate-400 font-medium">NPCI Mandate & IMPS Verified Sources</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkBankModal(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer active:scale-95 border border-blue-100"
              >
                <Plus size={14} /> Link Bank
              </button>
            </div>

            <div className="space-y-2.5">
              {linkedBanks.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between hover:border-blue-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shadow-sm">
                      🏛️
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-slate-800">{b.bankName}</span>
                        {b.isPrimary && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded-md">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 font-medium">
                        {b.accountNumber} • {b.ifsc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle2 size={12} />
                    <span>NPCI Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
            <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
               <Activity size={16} className="text-blue-600" /> Send Money Instantly
            </h3>

            <SmartPayForm 
              defaultVpa={scannedPayee?.vpa || ''}
              defaultAmount={scannedPayee?.amount || ''}
              defaultName={scannedPayee?.payeeName || ''}
              availableBalance={currentBalance}
              onOpenScanner={() => setShowScanner(true)}
              onComplete={(createdTx) => {
                setRefresh(r => r + 1);
                setScannedPayee(null);
                if (createdTx) {
                  setActiveReceipt(createdTx);
                  playKyroPaySoundbox(createdTx.totalAmount, 'hi');
                }
              }} 
              onPayViaRazorpay={(amt, targetVpa, targetName) => {
                setRazorpayPurpose('PAY_MERCHANT');
                setRazorpayAmount(amt);
                setRazorpayTargetVpa(targetVpa);
                setRazorpayTargetName(targetName);
                setShowRazorpayModal(true);
              }}
            />
          </div>
        </div>
      )}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">Payment History</h3>
              <p className="text-xs text-slate-500">Track all incoming & outgoing transfers</p>
            </div>
            <button
              onClick={() => setShowStatementModal(true)}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" />
              Download Statement
            </button>
          </div>
          {history.length === 0 && <p className="text-slate-500 text-sm">No transactions yet.</p>}
          {history.map((tx, i) => (
            <TransactionItem 
              key={i} 
              tx={tx} 
              onViewReceipt={(selected) => setActiveReceipt(selected)}
            />
          ))}
        </div>
      )}
      {activeTab === 'contact' && (
        <ContactsManager
          userPhoneNumber={user?.primaryPhoneNumber?.phoneNumber || (backendUser as any)?.phoneNumber || localStorage.getItem('kyro_user_real_phone') || ''}
          onSelectContact={(contact) => {
            setScannedPayee({
              vpa: contact.vpa,
              amount: '',
              payeeName: contact.name,
              raw: contact.vpa
            });
            setActiveTab('pay');
          }}
        />
      )}
      {(activeTab === 'my-qr' || activeTab === 'qr') && (
        <UpiQrStandee
          fullName={user?.fullName || backendUser?.fullName || 'Kyro User'}
          primaryUpiId={verifiedUpiId || (user?.primaryEmailAddress?.emailAddress || backendUser?.email || 'user').split('@')[0] + '@okkyro'}
          phoneNumber={user?.primaryPhoneNumber?.phoneNumber || localStorage.getItem('kyro_user_real_phone') || ''}
          isMerchant={false}
        />
      )}
      {activeTab === 'banks' && (
        <BankAccountsView
          linkedBanks={linkedBanks}
          onOpenLinkBankModal={() => setShowLinkBankModal(true)}
          onSetPrimaryBank={(bankId) => {
            setLinkedBanks(prev => prev.map(b => ({ ...b, isPrimary: b.id === bankId })));
          }}
          availableBalance={currentBalance}
        />
      )}
      {activeTab === 'rewards' && (
        <RewardsView
          onDepositCashback={(amount) => {
            setRefresh(r => r + 1);
            playKyroPaySoundbox(amount, 'hi');
          }}
        />
      )}
      {activeTab === 'soundbox' && (
        <SoundboxTester defaultAmount={100} />
      )}
      {activeTab === 'statement' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100 dark:border-emerald-800">
            <FileSpreadsheet size={32} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">Official Account Statement</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Generate and download your stamped KyroPay transaction passbook & monthly statements.</p>
          </div>
          <button 
            type="button"
            onClick={() => setShowStatementModal(true)} 
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl text-xs shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet size={16} /> Open Statement Generator
          </button>
        </div>
      )}
      <QrScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onShowMyQr={() => setActiveTab('my-qr')}
        onScanSuccess={(payload) => {
          setScannedPayee(payload);
          setActiveTab('pay');
        }}
      />
      <PaymentReceiptModal
        isOpen={!!activeReceipt}
        onClose={() => setActiveReceipt(null)}
        data={activeReceipt ? {
          transactionId: activeReceipt.id,
          parentReferenceNo: activeReceipt.parentReferenceNo,
          senderId: activeReceipt.senderId,
          receiverId: activeReceipt.receiverId,
          amount: activeReceipt.totalAmount,
          status: activeReceipt.status,
          createdAt: activeReceipt.createdAt,
          packets: activeReceipt.packets,
        } : null}
      />
      <AccountStatementModal
        isOpen={showStatementModal}
        onClose={() => setShowStatementModal(false)}
        transactions={history}
        accountName={user?.fullName || backendUser?.fullName || 'Kyro User'}
        accountUpiId={verifiedUpiId || (user?.primaryEmailAddress?.emailAddress || backendUser?.email || 'user').split('@')[0] + '@okkyro'}
        isMerchant={false}
      />
      <RazorpayCheckoutModal
        isOpen={showRazorpayModal}
        onClose={() => setShowRazorpayModal(false)}
        userEmail={backendUser?.email || user?.primaryEmailAddress?.emailAddress || 'normal@kyro'}
        defaultAmount={razorpayAmount}
        purpose={razorpayPurpose}
        receiverId={razorpayTargetVpa}
        receiverName={razorpayTargetName}
        onPaymentSuccess={(createdTx) => {
          setRefresh(r => r + 1);
          if (createdTx) {
            const formatted = { 
              ...createdTx, 
              type: razorpayPurpose === 'PAY_MERCHANT' ? 'OUT' : 'IN' 
            };
            setHistory(prev => [formatted, ...prev.filter(t => t.id !== formatted.id)]);
            setActiveReceipt(createdTx);
            playKyroPaySoundbox(createdTx.totalAmount, 'hi');
          }
        }}
      />
      <LinkBankAccountModal
        isOpen={showLinkBankModal}
        onClose={() => setShowLinkBankModal(false)}
        userName={user?.fullName || backendUser?.fullName || 'Demo Consumer'}
        onAccountLinked={handleAccountLinked}
      />
    </MobileDashboardLayout>
  );
};

const MerchantDashboard = ({ verifiedUpiId, initialTab }: { verifiedUpiId: string | null; initialTab?: string }) => {
    const [activeTab, setActiveTab] = useState<string>(() => {
      if (initialTab && initialTab !== 'scan') return initialTab;
      return 'pay';
    });
    const [showScanner, setShowScanner] = useState<boolean>(() => initialTab === 'scan');
    const [scannedPayee, setScannedPayee] = useState<ScannedUpiPayload | null>(null);
    const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
    const [showSettlementModal, setShowSettlementModal] = useState<boolean>(false);
    const [showStatementModal, setShowStatementModal] = useState<boolean>(false);
    const [showRazorpayModal, setShowRazorpayModal] = useState<boolean>(false);
    const [razorpayPurpose, setRazorpayPurpose] = useState<'ADD_FUNDS' | 'PAY_MERCHANT'>('ADD_FUNDS');
    const [razorpayTargetVpa, setRazorpayTargetVpa] = useState<string>('');
    const [razorpayTargetName, setRazorpayTargetName] = useState<string>('');
    const [razorpayAmount, setRazorpayAmount] = useState<number>(500);

    const { user } = useUser();
    const { user: backendUser } = useAuth();
    
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

    const [showLinkBankModal, setShowLinkBankModal] = useState<boolean>(false);
    const [linkedBanks, setLinkedBanks] = useState<LinkedBankAccount[]>(() => {
      try {
        const saved = localStorage.getItem('kyro_merchant_linked_banks');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return [
        {
          id: 'bank_hdfc_merchant_default',
          bankName: 'HDFC Bank (Current A/c)',
          accountNumber: '•••• 8291',
          rawAccountNumber: '50200082910441',
          ifsc: 'HDFC0001234',
          accountHolder: user?.fullName || backendUser?.fullName || 'Kyro Business Merchant',
          accountType: 'CURRENT',
          isPrimary: true,
          linkedAt: '2026-10-15T10:00:00Z',
        }
      ];
    });

    const handleAccountLinked = (newAcc: LinkedBankAccount) => {
      setLinkedBanks(prev => {
        const updated = [newAcc, ...prev.map(b => ({ ...b, isPrimary: false }))];
        try {
          localStorage.setItem('kyro_merchant_linked_banks', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    };

    const totalCollections = history.filter(t => t.type === 'IN' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.totalAmount, 0);
    const totalSettled = history.filter(t => t.type === 'OUT' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.totalAmount, 0);
    const merchantBaseBalance = 250000; // ₹2,50,000 Working Capital Base Line
    const merchantAvailableBalance = Math.max(50000, merchantBaseBalance + totalCollections - totalSettled);
    const unsettledBalance = Math.max(0, totalCollections - totalSettled);
    const effectiveUnsettled = totalCollections > 0 ? unsettledBalance : 14250;
    const txCount = history.filter(t => t.type === 'IN' && t.status === 'COMPLETED').length;

    const [incomingToast, setIncomingToast] = useState<{amount: number, sender: string} | null>(null);

  useEffect(() => {
        setBalanceVisible(false);
    }, [activeTab]);

    
      useEffect(() => {
      const email = backendUser?.email || user?.primaryEmailAddress?.emailAddress || 'merchant@kyropay.com';
    
    const fetchHistory = () => {
        Promise.all([
          upiApi.getInflows(email).catch(() => ({ data: [] })),
          upiApi.getOutflows(email).catch(() => ({ data: [] }))
        ]).then(([inRes, outRes]) => {
          const ins = inRes.data.map((tx: any) => ({ ...tx, type: 'IN' }));
          const outs = outRes.data.map((tx: any) => ({ ...tx, type: 'OUT' }));
          const allTxs = [...ins, ...outs];
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
      <MobileDashboardLayout 
        title="KyroPay Business Hub" 
        upiId={verifiedUpiId || user?.primaryEmailAddress?.emailAddress || backendUser?.email || 'merchant@kyro'} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onOpenScanner={() => setShowScanner(true)}
      >
      {activeTab === 'pay' && (
        <div className="animate-fade-in">

          <div className="bg-gradient-to-br from-indigo-700 to-purple-800 rounded-3xl p-6 text-white shadow-2xl mb-4 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-indigo-200 text-sm font-medium mb-1">Available Working Balance</p>
                    {balanceVisible ? (
                       <>
                         <h2 className="text-4xl font-extrabold tracking-tight">₹{merchantAvailableBalance.toLocaleString('en-IN')}<span className="text-lg text-indigo-300">.00</span></h2>
                         <p className="text-xs text-indigo-200 mt-1 flex items-center gap-1.5">
                           <span>Collections: ₹{totalCollections.toLocaleString('en-IN')}.00</span>
                           <span>•</span>
                           <span>CBS Credit Line</span>
                         </p>
                       </>
                    ) : (
                       <div className="mt-2">
                         <button onClick={() => setShowBalanceModal(true)} className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-sm border border-white/20 cursor-pointer">
                           <ShieldCheck size={16} /> Check Balance
                         </button>
                       </div>
                    )}
                  </div>
                <div className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <TrendingUp size={12} /> Active
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                  <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider mb-1">Unsettled ({txCount} Txs)</p>
                  <p className="font-extrabold text-base text-white">₹{effectiveUnsettled.toLocaleString('en-IN')}</p>
                </div>
                <div 
                  onClick={() => setShowSettlementModal(true)}
                  className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 cursor-pointer backdrop-blur-sm rounded-2xl p-3 border border-emerald-400/30 transition flex flex-col justify-center"
                >
                  <p className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                    <ArrowDownToLine size={12} /> Settle to Bank
                  </p>
                  <p className="font-black text-xs text-emerald-300">Instant IMPS (T+0)</p>
                </div>
              </div>
            </div>
            </div>

            {/* Quick Settlement & Statement Action Bar */}
            <div className="flex gap-2.5 mb-6">
              <button
                type="button"
                onClick={() => setShowSettlementModal(true)}
                disabled={effectiveUnsettled <= 0}
                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <ArrowDownToLine size={16} /> Settle ₹{effectiveUnsettled.toLocaleString('en-IN')} to Bank
              </button>
              <button
                type="button"
                onClick={() => setShowStatementModal(true)}
                className="py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-2xl shadow-sm transition flex items-center gap-1.5 active:scale-95"
              >
                <FileSpreadsheet size={16} className="text-emerald-600" /> Statement
              </button>
            </div>

            {/* KYROPAY DIRECT REAL BANK SWITCH (MERCHANT) */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-5 mb-6 border border-indigo-500/30 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-2">
                      KyroPay Direct Bank Switch
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">NPCI / 256-Bit SSL</span>
                    </h4>
                    <p className="text-[11px] text-indigo-200">Real Bank UPI, NetBanking & Debit Cards</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-3 relative z-10">
                Simulate a customer paying your store via Google Pay / Cards, or deposit working capital into your merchant balance:
              </p>

              <div className="grid grid-cols-2 gap-2.5 relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    setRazorpayPurpose('PAY_MERCHANT');
                    setRazorpayAmount(500);
                    setRazorpayTargetVpa(verifiedUpiId || user?.primaryEmailAddress?.emailAddress || backendUser?.email || 'merchant@okkyro');
                    setRazorpayTargetName('Business Store Collection');
                    setShowRazorpayModal(true);
                  }}
                  className="p-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-2xl font-bold text-xs text-white shadow-md flex flex-col items-center justify-center gap-1 transition active:scale-95 border border-indigo-400/30 cursor-pointer"
                >
                  <CreditCard size={18} className="text-yellow-300" />
                  <span className="font-black">Test Customer Payment</span>
                  <span className="text-[10px] text-blue-100">Pay via GPay / HDFC / Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRazorpayPurpose('ADD_FUNDS');
                    setRazorpayAmount(2000);
                    setRazorpayTargetVpa('');
                    setRazorpayTargetName('');
                    setShowRazorpayModal(true);
                  }}
                  className="p-3.5 bg-white/10 hover:bg-white/15 rounded-2xl font-bold text-xs text-white shadow-sm flex flex-col items-center justify-center gap-1 transition active:scale-95 border border-white/20 cursor-pointer"
                >
                  <Plus size={18} className="text-emerald-400" />
                  <span className="font-black">Add Working Capital</span>
                  <span className="text-[10px] text-indigo-200">Debit Bank into Kyro</span>
                </button>
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

            <SmartPayForm 
              defaultVpa={scannedPayee?.vpa || ''}
              defaultAmount={scannedPayee?.amount || ''}
              defaultName={scannedPayee?.payeeName || ''}
              availableBalance={merchantAvailableBalance}
              onOpenScanner={() => setShowScanner(true)}
              onComplete={(createdTx) => {
                setRefresh(r => r + 1);
                setScannedPayee(null);
                if (createdTx) {
                  setActiveReceipt(createdTx);
                }
              }} 
              onPayViaRazorpay={(amt, targetVpa, targetName) => {
                setRazorpayPurpose('PAY_MERCHANT');
                setRazorpayAmount(amt);
                setRazorpayTargetVpa(targetVpa);
                setRazorpayTargetName(targetName);
                setShowRazorpayModal(true);
              }}
            />
          </div>
        </div>
      )}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setShowScanner(true)}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Camera size={16} /> Scan QR to Pay Vendor
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className="py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-xs shadow-sm transition flex items-center gap-2 active:scale-95"
            >
              <QrCode size={16} /> Store Standee QR
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">Customer Inflows & Ledger</h3>
              <p className="text-xs text-slate-500">Live feed of collections & bank settlements</p>
            </div>
            <button
              onClick={() => setShowStatementModal(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" />
              Download Statement
            </button>
          </div>
          {history.length === 0 && <p className="text-slate-500 text-sm">No inflows yet.</p>}
          {history.map((tx, i) => (
            <TransactionItem 
              key={i} 
              tx={tx} 
              onViewReceipt={(selected) => setActiveReceipt(selected)}
            />
          ))}
        </div>
      )}
      {activeTab === 'contact' && (
        <ContactsManager
          userPhoneNumber={user?.primaryPhoneNumber?.phoneNumber || (backendUser as any)?.phoneNumber || localStorage.getItem('kyro_user_real_phone') || ''}
          onSelectContact={(contact) => {
            setScannedPayee({
              vpa: contact.vpa,
              amount: '',
              payeeName: contact.name,
              raw: contact.vpa
            });
            setActiveTab('pay');
          }}
        />
      )}
      {activeTab === 'developer' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl animate-fade-in text-left">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <ShieldCheck size={26} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">B2B Merchant API Keys</h3>
                <p className="text-xs text-slate-500">Integrate KyroPay checkout into your website, app, or POS</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-800">What is this for?</p>
              <p>Generate secure API credentials to accept real-time KyroPay UPI & RuPay payments from customers on your external e-commerce store (Shopify, WooCommerce, custom web apps).</p>
              <div className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                <AlertTriangle size={14} className="shrink-0" />
                <span>Never share your secret key or commit it into frontend source code.</span>
              </div>
            </div>

            <button 
              onClick={async () => {
                try {
                    const token = localStorage.getItem('accessToken');
                    const res = await fetch(`${window.location.protocol}//${window.location.hostname}:8080/api/merchant/keys/generate?email=${backendUser?.email || ''}`, {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    const data = await res.json();
                    if (data.apiKey) {
                        alert('Generated KyroPay Merchant Key:\n\n' + data.apiKey + '\n\nStore this key safely in your backend .env file.');
                    } else {
                        alert('Error: ' + JSON.stringify(data));
                    }
                } catch(e) {
                    alert('Error generating key. Ensure backend server is reachable.');
                }
              }} 
              className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 hover:from-slate-800 hover:to-blue-800 text-white font-extrabold py-3.5 rounded-2xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <ShieldCheck size={16} /> Generate KyroPay Merchant API Key
            </button>
          </div>
        )}
        {(activeTab === 'my-qr' || activeTab === 'qr') && (
        <UpiQrStandee
          fullName={user?.fullName || backendUser?.fullName || 'Merchant Business Store'}
          primaryUpiId={verifiedUpiId || (user?.primaryEmailAddress?.emailAddress || backendUser?.email || 'merchant').split('@')[0] + '@okkyro'}
          phoneNumber={user?.primaryPhoneNumber?.phoneNumber || localStorage.getItem('kyro_user_real_phone') || ''}
          isMerchant={true}
        />
      )}
      {activeTab === 'soundbox' && (
        <SoundboxTester defaultAmount={500} />
      )}
      {activeTab === 'banks' && (
        <BankAccountsView
          linkedBanks={linkedBanks}
          onOpenLinkBankModal={() => setShowLinkBankModal(true)}
          onSetPrimaryBank={(bankId) => {
            setLinkedBanks(prev => prev.map(b => ({ ...b, isPrimary: b.id === bankId })));
          }}
          availableBalance={merchantAvailableBalance}
        />
      )}
      {activeTab === 'rewards' && (
        <RewardsView
          onDepositCashback={(amount) => {
            setRefresh(r => r + 1);
            playKyroPaySoundbox(amount, 'hi');
          }}
        />
      )}
      {activeTab === 'statement' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100 dark:border-emerald-800">
            <FileSpreadsheet size={32} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">Merchant Ledger & Statement</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Generate and download official stamped transaction ledgers & settlement passbook.</p>
          </div>
          <button 
            type="button"
            onClick={() => setShowStatementModal(true)} 
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl text-xs shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet size={16} /> Open Statement Generator
          </button>
        </div>
      )}
      <QrScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onShowMyQr={() => setActiveTab('my-qr')}
        onScanSuccess={(payload) => {
          setScannedPayee(payload);
          setActiveTab('pay');
        }}
      />
      <MerchantSettlementModal
        isOpen={showSettlementModal}
        onClose={() => setShowSettlementModal(false)}
        availableBalance={effectiveUnsettled}
        merchantEmail={backendUser?.email || user?.primaryEmailAddress?.emailAddress || 'merchant@kyro'}
        onSettlementSuccess={(settlementTx) => {
          setRefresh(r => r + 1);
          if (settlementTx) {
            setActiveReceipt(settlementTx);
          }
        }}
      />
      <PaymentReceiptModal
        isOpen={!!activeReceipt}
        onClose={() => setActiveReceipt(null)}
        data={activeReceipt ? {
          transactionId: activeReceipt.id,
          parentReferenceNo: activeReceipt.parentReferenceNo,
          senderId: activeReceipt.senderId,
          receiverId: activeReceipt.receiverId,
          amount: activeReceipt.totalAmount,
          status: activeReceipt.status,
          createdAt: activeReceipt.createdAt,
          packets: activeReceipt.packets,
        } : null}
      />
      <AccountStatementModal
        isOpen={showStatementModal}
        onClose={() => setShowStatementModal(false)}
        transactions={history}
        accountName={user?.fullName || backendUser?.fullName || 'Merchant Business Store'}
        accountUpiId={verifiedUpiId || (user?.primaryEmailAddress?.emailAddress || backendUser?.email || 'merchant').split('@')[0] + '@okkyro'}
        isMerchant={true}
      />
      <RazorpayCheckoutModal
        isOpen={showRazorpayModal}
        onClose={() => setShowRazorpayModal(false)}
        userEmail={backendUser?.email || user?.primaryEmailAddress?.emailAddress || 'merchant@kyro'}
        defaultAmount={razorpayAmount}
        purpose={razorpayPurpose}
        receiverId={razorpayTargetVpa}
        receiverName={razorpayTargetName}
        onPaymentSuccess={(createdTx) => {
          setRefresh(r => r + 1);
          if (createdTx) {
            const formatted = { 
              ...createdTx, 
              type: razorpayPurpose === 'PAY_MERCHANT' ? 'OUT' : 'IN' 
            };
            setHistory(prev => [formatted, ...prev.filter(t => t.id !== formatted.id)]);
            setActiveReceipt(createdTx);
          }
        }}
      />
      <LinkBankAccountModal
        isOpen={showLinkBankModal}
        onClose={() => setShowLinkBankModal(false)}
        userName={user?.fullName || backendUser?.fullName || 'Kyro Business Merchant'}
        onAccountLinked={handleAccountLinked}
      />
    </MobileDashboardLayout>
    </>
  );
};

const Dashboard = ({ initialTab }: { initialTab?: string }) => {
  const { signOut } = useClerk();
  const { logout } = useAuth();
  
  const { user: clerkUser } = useUser();
  const { user: backendUser } = useAuth();
  
  // THREE-TIER ROUTING LOGIC (Role strictly determined by login persona & authority)
  const email = clerkUser?.primaryEmailAddress?.emailAddress || backendUser?.email || '';
  const userType = localStorage.getItem('userType');
  const hasBankRole = !!backendUser?.roles && backendUser.roles.some((r: string) => 
    r.startsWith('ROLE_BANK_') || r.startsWith('ROLE_CORP_') || r.includes('ADMIN') || r.includes('OPERATIONS') || r.includes('AUDITOR') || r.includes('COMPLIANCE')
  );
  const isBankEmployee = userType === 'bank_employee' || (!userType && hasBankRole);
  const isMerchant = !isBankEmployee && userType === 'merchant';

  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [verifiedUpiId, setVerifiedUpiId] = useState<string | null>(null);
  const [newUpiId, setNewUpiId] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardError, setOnboardError] = useState<string | null>(null);

  useEffect(() => {
    if (isBankEmployee || isMerchant) {
      setNeedsOnboarding(false);
      return;
    }
    if (email) {
      upiApi.getUpiProfile(email).then(res => {
        if (!res.data.hasUpi) {
          setNeedsOnboarding(true);
        } else {
          setVerifiedUpiId(res.data.upiId);
        }
      }).catch(() => {
         setNeedsOnboarding(true);
      });
    }
  }, [email, isBankEmployee, isMerchant]);


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
  const [toast, setToast] = useState<{msg: string, type: string} | null>(null);

  const showToast = (msg: string, type = 'info') => {
    setToast({ msg, type });
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => setToast(null), 4000);
  };

  let DashboardContent = null;
  if (isMerchant) {
    DashboardContent = <MerchantDashboard verifiedUpiId={verifiedUpiId} initialTab={initialTab} />;
  } else if (!isBankEmployee) {
    DashboardContent = <PhonePeDashboard verifiedUpiId={verifiedUpiId} initialTab={initialTab} />;
  } else {
    DashboardContent = (
      <BankEmployeePortal 
        onSignOut={() => { logout(); signOut(); window.location.href = '/'; }} 
        onSwitchToConsumer={() => { localStorage.setItem('userType', 'user'); window.location.reload(); }}
      />
    );
  }

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {!isBankEmployee && !isMerchant && needsOnboarding && (
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
