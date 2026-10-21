import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw,
  ShieldAlert,
  Users,
  Ban,
  Building2
} from 'lucide-react';
import { upiApi } from '../api';
import { NpciCommonLibraryModal } from './NpciCommonLibraryModal';
import { playKyroPaySoundbox } from '../utils/soundbox';

export interface CollectRequestItem {
  id: string;
  collectRef: string;
  requesterVpa: string;
  requesterName?: string;
  payerVpa: string;
  amount: number;
  note?: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface UpiCollectModalProps {
  isOpen: boolean;
  onClose: () => void;
  userVpa: string;
  userEmail: string;
  initialTab?: 'INBOX' | 'SENT' | 'CREATE';
  onPaymentSuccess?: (tx: any) => void;
  linkedBanks?: any[];
}

export const UpiCollectModal: React.FC<UpiCollectModalProps> = ({
  isOpen,
  onClose,
  userVpa,
  userEmail,
  initialTab = 'INBOX',
  onPaymentSuccess,
  linkedBanks = []
}) => {
  const [activeTab, setActiveTab] = useState<'INBOX' | 'SENT' | 'CREATE'>(initialTab);
  const [inboxRequests, setInboxRequests] = useState<CollectRequestItem[]>([]);
  const [sentRequests, setSentRequests] = useState<CollectRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Active Collect Request being approved via NPCI Common Library
  const [selectedForApproval, setSelectedForApproval] = useState<CollectRequestItem | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>('HDFC Bank •••• 4321');

  // Create Collect Form
  const [targetPayerVpa, setTargetPayerVpa] = useState<string>('');
  const [createAmount, setCreateAmount] = useState<string>('');
  const [createNote, setCreateNote] = useState<string>('');
  const [validityMinutes, setValidityMinutes] = useState<number>(10);
  
  // Real-time VPA Verification
  const [verifyingVpa, setVerifyingVpa] = useState<boolean>(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [vpaError, setVpaError] = useState<string | null>(null);
  const vpaDebounceRef = useRef<any>(null);

  // Directory contacts for 1-click select
  const [directoryContacts, setDirectoryContacts] = useState<any[]>([]);
  const [showContactPicker, setShowContactPicker] = useState<boolean>(false);

  // Live countdown clock ticker
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch directory contacts
  useEffect(() => {
    if (isOpen) {
      upiApi.getDirectoryContacts()
        .then(res => setDirectoryContacts(res.data || []))
        .catch(() => {});
    }
  }, [isOpen]);

  // Set active tab on prop update
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const fetchInboxRequests = async () => {
    if (!userVpa) return;
    try {
      const res = await upiApi.getPendingCollect(userVpa);
      setInboxRequests(res.data || []);
    } catch (e) {
      console.error('Failed to fetch pending collect requests', e);
    }
  };

  const fetchSentRequests = async () => {
    if (!userVpa) return;
    try {
      const res = await upiApi.getSentCollect(userVpa);
      setSentRequests(res.data || []);
    } catch (e) {
      console.error('Failed to fetch sent collect requests', e);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchInboxRequests(), fetchSentRequests()]);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchAll();
      const interval = setInterval(fetchAll, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, userVpa]);

  // Live VPA verification debounce
  useEffect(() => {
    if (vpaDebounceRef.current) clearTimeout(vpaDebounceRef.current);
    const trimmed = targetPayerVpa.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setVerifiedName(null);
      setVpaError(null);
      return;
    }

    setVerifyingVpa(true);
    vpaDebounceRef.current = setTimeout(async () => {
      try {
        const res = await upiApi.verifyVpa(trimmed);
        if (res.data?.verifiedName) {
          setVerifiedName(res.data.verifiedName);
          setVpaError(null);
        } else {
          setVerifiedName(null);
        }
      } catch (err: any) {
        setVerifiedName(null);
        setVpaError('VPA could not be verified on NPCI Switch');
      } finally {
        setVerifyingVpa(false);
      }
    }, 400);

    return () => {
      if (vpaDebounceRef.current) clearTimeout(vpaDebounceRef.current);
    };
  }, [targetPayerVpa]);

  if (!isOpen) return null;

  const handleDecline = async (req: CollectRequestItem, isSpam = false) => {
    setActionLoading(req.id);
    try {
      await upiApi.declineCollect({ 
        collectId: req.id, 
        reason: isSpam ? 'Marked as Spam / Blocked by User' : 'Declined by User' 
      });
      setStatusMessage({ 
        text: isSpam 
          ? `Blocked & declined demand from ${req.requesterName || req.requesterVpa}` 
          : `Declined collect request from ${req.requesterName || req.requesterVpa}`, 
        type: 'success' 
      });
      setInboxRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (err: any) {
      setStatusMessage({ text: err.response?.data?.error || 'Failed to decline request', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSent = async (req: CollectRequestItem) => {
    setActionLoading(req.id);
    try {
      await upiApi.cancelCollect({ collectId: req.id });
      setStatusMessage({ text: `Cancelled collect request for ₹${req.amount}`, type: 'success' });
      setSentRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'CANCELLED' } : r));
    } catch (err: any) {
      setStatusMessage({ text: err.response?.data?.error || 'Failed to cancel request', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveWithPin = async (pin: string) => {
    if (!selectedForApproval) return;
    const req = selectedForApproval;
    setActionLoading(req.id);
    try {
      const res = await upiApi.approveCollect({
        collectId: req.id,
        payerEmail: userEmail,
        mpin: pin
      });
      setSelectedForApproval(null);
      setStatusMessage({ 
        text: `Successfully authorized & paid ₹${req.amount} to ${req.requesterName || req.requesterVpa}!`, 
        type: 'success' 
      });
      playKyroPaySoundbox(req.amount, 'hi');
      setInboxRequests(prev => prev.filter(r => r.id !== req.id));
      if (onPaymentSuccess && res.data?.transaction) {
        onPaymentSuccess(res.data.transaction);
      }
    } catch (err: any) {
      setStatusMessage({ text: err.response?.data?.error || 'Payment authorization failed', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPayerVpa || !createAmount) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      await upiApi.initiateCollect({
        requesterVpa: userVpa,
        requesterName: userEmail.split('@')[0],
        payerVpa: targetPayerVpa.trim(),
        amount: Number(createAmount),
        note: createNote.trim() || 'Payment Demand',
        validityMinutes
      });
      setStatusMessage({ 
        text: `Live UPI Collect demand for ₹${createAmount} dispatched to ${targetPayerVpa}!`, 
        type: 'success' 
      });
      setTargetPayerVpa('');
      setCreateAmount('');
      setCreateNote('');
      setVerifiedName(null);
      await fetchSentRequests();
      setTimeout(() => setActiveTab('SENT'), 1200);
    } catch (err: any) {
      setStatusMessage({ text: err.response?.data?.error || 'Failed to dispatch collect request', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatRemainingTime = (expiresAtStr: string) => {
    const diffMs = new Date(expiresAtStr).getTime() - now;
    if (diffMs <= 0) return 'Expired';
    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* NPCI Tricolor Bar */}
          <div className="h-1.5 w-full flex shrink-0">
            <div className="h-full w-1/3 bg-[#FF9933]"></div>
            <div className="h-full w-1/3 bg-white"></div>
            <div className="h-full w-1/3 bg-[#138808]"></div>
          </div>

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
                <Bell size={20} className={inboxRequests.length > 0 ? 'animate-bounce' : ''} />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base tracking-tight flex items-center gap-2">
                  NPCI UPI 2.0 Collect Requests
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                    LIVE CORE
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">P2P & P2M Pull Demands • Explicit Consent Mandate</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Switcher (Inbox, Sent Outbox, Request Money) */}
          <div className="grid grid-cols-3 border-b border-slate-100 dark:border-slate-800 px-3 pt-2 text-center shrink-0 bg-white dark:bg-slate-900">
            <button
              onClick={() => setActiveTab('INBOX')}
              className={`pb-2.5 text-xs font-black transition flex items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'INBOX'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <ArrowDownLeft size={15} />
              <span>Incoming ({inboxRequests.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('SENT')}
              className={`pb-2.5 text-xs font-black transition flex items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'SENT'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <ArrowUpRight size={15} />
              <span>Sent Demands ({sentRequests.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('CREATE')}
              className={`pb-2.5 text-xs font-black transition flex items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'CREATE'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Send size={14} />
              <span>+ Request Money</span>
            </button>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`mx-4 mt-3 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' 
                : 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
              <span className="flex-1">{statusMessage.text}</span>
              <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
          )}

          {/* TAB 1: INCOMING DEMANDS */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5">
            {activeTab === 'INBOX' && (
              <>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
                  <span>Demands sent to your UPI ID: <strong className="font-mono text-slate-800 dark:text-slate-200">{userVpa}</strong></span>
                  <button onClick={fetchAll} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline">
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
                  </button>
                </div>

                {inboxRequests.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 size={30} className="text-emerald-500" />
                    </div>
                    <p className="font-black text-sm text-slate-700 dark:text-slate-200">No Pending Demands</p>
                    <p className="text-xs max-w-xs mx-auto text-slate-500">
                      You have no pending pull requests waiting for your authorization. Use "+ Request Money" to request funds from peers or merchants.
                    </p>
                  </div>
                ) : (
                  inboxRequests.map((req) => {
                    const remainingStr = formatRemainingTime(req.expiresAt);
                    const isExpiringSoon = remainingStr !== 'Expired' && remainingStr.startsWith('0:');
                    
                    return (
                      <div 
                        key={req.id}
                        className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 hover:shadow-lg transition space-y-3.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-lg shadow-inner shrink-0">
                              ₹
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                  {req.requesterName || req.requesterVpa}
                                </span>
                                <span className="text-[9px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.2 rounded-full border border-blue-200 dark:border-blue-800">
                                  Verified Payee
                                </span>
                              </div>
                              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{req.requesterVpa}</p>
                              {req.note && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium italic mt-1 bg-white/80 dark:bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                                  "{req.note}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Demanded Amount</span>
                            <p className="text-xl font-black text-slate-900 dark:text-white">
                              ₹{Number(req.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        {/* NPCI Real-Time Expiry Countdown & Reference */}
                        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            <Clock size={13} className="text-amber-500" />
                            <span>Ref: {req.collectRef}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500">Expires in:</span>
                            <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-full ${
                              isExpiringSoon 
                                ? 'bg-red-500 text-white animate-pulse' 
                                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            }`}>
                              {remainingStr}
                            </span>
                          </div>
                        </div>

                        {/* NPCI Safety Warning Notice */}
                        <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-2">
                          <ShieldAlert size={14} className="shrink-0 text-red-500 mt-0.5" />
                          <span>
                            <strong>NPCI Warning:</strong> You are about to DEBIT money from your bank account. Entering your UPI PIN will DEDUCT funds, not receive funds.
                          </span>
                        </div>

                        {/* Select Bank Account */}
                        <div className="flex items-center justify-between text-xs px-1">
                          <span className="text-slate-500 font-semibold flex items-center gap-1">
                            <Building2 size={13} /> Debit From:
                          </span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                            {linkedBanks.length > 0 ? `${linkedBanks[0].bankName} ${linkedBanks[0].accountNumber}` : 'HDFC Bank •••• 4321'}
                          </span>
                        </div>

                        {/* Decline & Approve Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleDecline(req, false)}
                            disabled={actionLoading === req.id}
                            className="py-3 px-3 rounded-2xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 font-bold text-xs transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            <Ban size={14} />
                            <span>Decline</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBank(linkedBanks.length > 0 ? `${linkedBanks[0].bankName} ${linkedBanks[0].accountNumber}` : 'HDFC Bank •••• 4321');
                              setSelectedForApproval(req);
                            }}
                            disabled={actionLoading === req.id || remainingStr === 'Expired'}
                            className="py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <CheckCircle2 size={15} />
                            <span>Authorize & Pay ₹{Number(req.amount).toLocaleString('en-IN')}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* TAB 2: SENT DEMANDS (OUTBOX) */}
            {activeTab === 'SENT' && (
              <>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
                  <span>Demands you dispatched to other users:</span>
                  <button onClick={fetchSentRequests} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline">
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
                  </button>
                </div>

                {sentRequests.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Send size={32} className="mx-auto text-slate-400 mb-1" />
                    <p className="font-black text-sm text-slate-700 dark:text-slate-200">No Sent Requests</p>
                    <p className="text-xs max-w-xs mx-auto text-slate-500">
                      You haven't requested payment from anyone yet. Switch to "+ Request Money" to send a demand to a friend or client.
                    </p>
                  </div>
                ) : (
                  sentRequests.map((req) => (
                    <div 
                      key={req.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400">Demanded from:</span>
                          <p className="font-extrabold text-sm text-slate-900 dark:text-white font-mono">{req.payerVpa}</p>
                          {req.note && <p className="text-xs text-slate-500 italic mt-0.5">"{req.note}"</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-black text-base text-slate-900 dark:text-white">
                            ₹{Number(req.amount).toLocaleString('en-IN')}
                          </p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block border ${
                            req.status === 'APPROVED' 
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : req.status === 'PENDING'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 animate-pulse'
                              : req.status === 'DECLINED'
                              ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300'
                          }`}>
                            {req.status === 'PENDING' ? '⏳ Payer Authorization Pending' : req.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700/60 font-mono">
                        <span>Ref: {req.collectRef}</span>
                        {req.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleCancelSent(req)}
                            disabled={actionLoading === req.id}
                            className="text-xs text-red-600 dark:text-red-400 font-bold hover:underline"
                          >
                            Cancel Demand
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* TAB 3: CREATE / REQUEST MONEY */}
            {activeTab === 'CREATE' && (
              <form onSubmit={handleCreateRequest} className="space-y-4">
                
                {/* Payer UPI ID / Contact */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Demand Payment From (Payer VPA)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowContactPicker(!showContactPicker)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Users size={12} /> Pick Contact
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. friend@okkyro or merchant@okkyro"
                      value={targetPayerVpa}
                      onChange={(e) => setTargetPayerVpa(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-inner"
                    />
                    {verifyingVpa && (
                      <div className="absolute right-3.5 top-3.5">
                        <RefreshCw size={16} className="text-blue-500 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Verified Payee Banner */}
                  {verifiedName && (
                    <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-bold animate-fade-in">
                      <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                      <span>NPCI Verified: {verifiedName}</span>
                    </div>
                  )}

                  {vpaError && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{vpaError}</p>
                  )}

                  {/* Quick Directory Contacts Selector */}
                  {showContactPicker && directoryContacts.length > 0 && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 max-h-40 overflow-y-auto">
                      <p className="text-[10px] font-black uppercase text-slate-400">Registered Directory Contacts</p>
                      {directoryContacts.map((c: any) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setTargetPayerVpa(c.upiId || `${c.phoneNumber}@okkyro`);
                            setShowContactPicker(false);
                          }}
                          className="p-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 transition cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[10px]">
                              {c.name?.charAt(0) || 'K'}
                            </div>
                            <span className="font-bold text-slate-800 dark:text-white">{c.name}</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">{c.upiId || c.phoneNumber}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amount to Collect */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Amount to Collect (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-lg font-black text-slate-400">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="0.00"
                      value={createAmount}
                      onChange={(e) => setCreateAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-xl font-black outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                    />
                  </div>

                  {/* Fast Amount Chips */}
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                    {[250, 500, 1000, 2000, 5000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCreateAmount(String(amt))}
                        className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition active:scale-95 shrink-0"
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purpose / Invoice Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Split Reason / Invoice Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dinner bill split, Grocery bill, Store invoice"
                    value={createNote}
                    onChange={(e) => setCreateNote(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                  />
                </div>

                {/* Validity Period */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Consent Expiration Window (NPCI Standard)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 15, 30].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setValidityMinutes(mins)}
                        className={`py-2.5 rounded-xl text-xs font-extrabold border transition ${
                          validityMinutes === mins 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {mins} Minutes
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>Dispatching via NPCI Switch...</span>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>DISPATCH UPI PAYMENT DEMAND</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer Security Note */}
          <div className="py-2.5 px-4 bg-slate-50 dark:bg-slate-950 text-center border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 font-mono shrink-0">
            NPCI UPI 2.0 Pull Protocol • Double-Entry Ledger Settled
          </div>

        </div>
      </div>

      {/* NPCI Common Library 6-Digit MPIN Keypad */}
      {selectedForApproval && (
        <NpciCommonLibraryModal
          isOpen={!!selectedForApproval}
          onClose={() => setSelectedForApproval(null)}
          onSubmitPin={(pin) => handleApproveWithPin(pin)}
          payeeName={selectedForApproval.requesterName || selectedForApproval.requesterVpa}
          payeeVpa={selectedForApproval.requesterVpa}
          amount={Number(selectedForApproval.amount)}
          userEmail={userEmail}
          bankName={selectedBank.split('•')[0].trim()}
          accountNumber={selectedBank.includes('•') ? selectedBank.substring(selectedBank.indexOf('•')) : '•••• 4321'}
          isLoading={!!actionLoading}
        />
      )}
    </>
  );
};
