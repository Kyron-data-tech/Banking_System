import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw
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
  onPaymentSuccess?: (tx: any) => void;
}

export const UpiCollectModal: React.FC<UpiCollectModalProps> = ({
  isOpen,
  onClose,
  userVpa,
  userEmail,
  onPaymentSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'INBOX' | 'CREATE'>('INBOX');
  const [requests, setRequests] = useState<CollectRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Active Collect Request being approved via NPCI Common Library
  const [selectedForApproval, setSelectedForApproval] = useState<CollectRequestItem | null>(null);

  // Create Collect Form
  const [targetPayerVpa, setTargetPayerVpa] = useState<string>('');
  const [createAmount, setCreateAmount] = useState<string>('');
  const [createNote, setCreateNote] = useState<string>('');
  const [validityMinutes, setValidityMinutes] = useState<number>(10);

  const fetchPendingRequests = async () => {
    if (!userVpa) return;
    setLoading(true);
    try {
      const res = await upiApi.getPendingCollect(userVpa);
      setRequests(res.data || []);
    } catch (e) {
      console.error('Failed to fetch pending collect requests', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPendingRequests();
      const interval = setInterval(fetchPendingRequests, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, userVpa]);

  if (!isOpen) return null;

  const handleDecline = async (req: CollectRequestItem) => {
    setActionLoading(req.id);
    try {
      await upiApi.declineCollect({ collectId: req.id, reason: 'Declined by user' });
      setStatusMessage({ text: `Declined collect request from ${req.requesterName || req.requesterVpa}`, type: 'success' });
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (err: any) {
      setStatusMessage({ text: err.response?.data?.error || 'Failed to decline request', type: 'error' });
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
      setStatusMessage({ text: `Approved & Paid ₹${req.amount} to ${req.requesterName || req.requesterVpa}!`, type: 'success' });
      playKyroPaySoundbox(req.amount, 'hi');
      setRequests(prev => prev.filter(r => r.id !== req.id));
      if (onPaymentSuccess && res.data?.transaction) {
        onPaymentSuccess(res.data.transaction);
      }
    } catch (err: any) {
      setStatusMessage({ text: err.response?.data?.error || 'Payment execution failed', type: 'error' });
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
        payerVpa: targetPayerVpa,
        amount: Number(createAmount),
        note: createNote || 'Payment Request',
        validityMinutes
      });
      setStatusMessage({ text: `Dispatched Collect Request for ₹${createAmount} to ${targetPayerVpa}!`, type: 'success' });
      setTargetPayerVpa('');
      setCreateAmount('');
      setCreateNote('');
      setTimeout(() => setActiveTab('INBOX'), 1500);
    } catch (err: any) {
      setStatusMessage({ text: err.response?.data?.error || 'Failed to dispatch collect request', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Bell size={20} className="animate-bounce" />
              </div>
              <div>
                <h3 className="font-black text-base tracking-tight flex items-center gap-2">
                  UPI Collect Requests
                  <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    NPCI P2P Pull
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manage real-time inbound payment approval demands</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <X size={20} />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 pt-3 gap-4">
            <button
              onClick={() => setActiveTab('INBOX')}
              className={`pb-3 text-xs font-extrabold transition flex items-center gap-1.5 border-b-2 ${
                activeTab === 'INBOX'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <ArrowDownLeft size={16} />
              <span>Incoming Demands ({requests.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('CREATE')}
              className={`pb-3 text-xs font-extrabold transition flex items-center gap-1.5 border-b-2 ${
                activeTab === 'CREATE'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <ArrowUpRight size={16} />
              <span>Request Money (Raise Collect)</span>
            </button>
          </div>

          {/* Feedback Message */}
          {statusMessage && (
            <div className={`mx-5 mt-4 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' 
                : 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Content Area */}
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            {activeTab === 'INBOX' ? (
              <>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
                  <span>Pending Merchant & Peer Requests</span>
                  <button onClick={fetchPendingRequests} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline">
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
                  </button>
                </div>

                {requests.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-2 opacity-60" />
                    <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">All Clear!</p>
                    <p className="text-xs">No pending collect requests waiting for your approval.</p>
                  </div>
                ) : (
                  requests.map((req) => (
                    <div 
                      key={req.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 hover:shadow-md transition space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-base shadow-sm">
                            ₹
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {req.requesterName || req.requesterVpa}
                              </span>
                              <span className="text-[9px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.2 rounded-full">
                                Verified
                              </span>
                            </div>
                            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{req.requesterVpa}</p>
                            {req.note && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 italic mt-0.5">
                                "{req.note}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Demanded Amount</span>
                          <p className="text-lg font-black text-slate-900 dark:text-white">
                            ₹{Number(req.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {/* Expiry Pill */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[11px]">
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono">
                          <Clock size={12} className="text-amber-500" />
                          <span>Ref: {req.collectRef}</span>
                        </span>
                        <span className="text-[10px] bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900">
                          Active Consent Window
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleDecline(req)}
                          disabled={actionLoading === req.id}
                          className="py-2.5 px-3 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                        >
                          Decline Request
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedForApproval(req)}
                          disabled={actionLoading === req.id}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} />
                          <span>Approve & Pay</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            ) : (
              /* CREATE COLLECT DEMAND */
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Demand Payment From (Payer UPI ID)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="friend@okkyro or merchant@upi"
                    value={targetPayerVpa}
                    onChange={(e) => setTargetPayerVpa(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 mt-1.5">
                    {['consumer@okkyro', 'merchant@okkyro'].map(vpa => (
                      <button
                        key={vpa}
                        type="button"
                        onClick={() => setTargetPayerVpa(vpa)}
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 hover:text-blue-500"
                      >
                        {vpa}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Amount to Collect (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="0.00"
                    value={createAmount}
                    onChange={(e) => setCreateAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Purpose / Invoice Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dinner bill split, Grocery share"
                    value={createNote}
                    onChange={(e) => setCreateNote(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Request Validity Period
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 15, 60].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setValidityMinutes(mins)}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          validityMinutes === mins 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
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
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Dispatching to NPCI...</span>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>DISPATCH COLLECT DEMAND</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer Security Note */}
          <div className="py-2.5 px-4 bg-slate-50 dark:bg-slate-950 text-center border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 font-mono">
            NPCI UPI 2.0 Pull Protocol • Payer Consent Explicit Authorization Mandated
          </div>

        </div>
      </div>

      {/* When user approves a collect request, use the authentic NPCI Common Library Keypad! */}
      {selectedForApproval && (
        <NpciCommonLibraryModal
          isOpen={!!selectedForApproval}
          onClose={() => setSelectedForApproval(null)}
          onSubmitPin={(pin) => handleApproveWithPin(pin)}
          payeeName={selectedForApproval.requesterName || selectedForApproval.requesterVpa}
          payeeVpa={selectedForApproval.requesterVpa}
          amount={Number(selectedForApproval.amount)}
          userEmail={userEmail}
          isLoading={!!actionLoading}
        />
      )}
    </>
  );
};
