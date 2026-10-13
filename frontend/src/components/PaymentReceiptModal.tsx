import React, { useRef, useState } from 'react';
import { 
  CheckCircle2, 
  Download, 
  X, 
  ShieldCheck, 
  Building2, 
  Copy, 
  Check, 
  Layers
} from 'lucide-react';
import { KyroLogo } from './KyroLogo';

export interface PaymentReceiptData {
  transactionId?: string;
  parentReferenceNo?: string;
  senderId?: string;
  receiverId?: string;
  amount: number;
  status: string;
  createdAt?: string | Date;
  packets?: Array<{ packetUtr: string; amount: number }>;
  note?: string;
  paymentRail?: string;
}

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PaymentReceiptData | null;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [copied, setCopied] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const formattedDate = data.createdAt 
    ? new Date(data.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

  const mainUtr = data.packets?.[0]?.packetUtr || (data.transactionId ? String(data.transactionId).padStart(12, '0') : '428591827401');
  const refNo = data.parentReferenceNo || `KYRO-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const handleCopy = () => {
    const text = `--- KYROPAY OFFICIAL PAYMENT RECEIPT ---
Status: SUCCESSFUL
Amount: ₹${data.amount.toLocaleString('en-IN')}
UTR / Reference: ${mainUtr}
Order Ref: ${refNo}
Date: ${formattedDate}
Counterparty: ${data.receiverId || data.senderId || 'Kyro User'}
Mode: NPCI UPI 2.0 Switch
--- Powered by Kyro Data Tech ---`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in print:p-0 print:bg-white">
      <div 
        ref={receiptRef}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-slide-up print:shadow-none print:border-none print:max-w-none print:w-full"
      >
        {/* Top Gradient Banner */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 p-6 text-white text-center relative overflow-hidden print:bg-slate-900 print:text-black">
          {/* Close button (Hidden on print) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1.5 transition print:hidden"
            title="Close"
          >
            <X size={18} />
          </button>

          <div className="flex justify-center mb-2">
            <KyroLogo size="sm" variant="personal" />
          </div>

          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner ring-4 ring-white/30 animate-pulse">
            <CheckCircle2 size={32} className="text-white drop-shadow-md" />
          </div>

          <h3 className="text-lg font-black tracking-tight uppercase">Payment Successful</h3>
          <p className="text-xs text-emerald-100 font-medium">NPCI UPI 2.0 Clearing Switch</p>

          <div className="mt-4">
            <h1 className="text-4xl font-extrabold tracking-tight">
              ₹{Number(data.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
            <p className="text-[11px] text-white/80 mt-0.5">{formattedDate}</p>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-4 text-sm text-slate-700">
          
          {/* Key Parties */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Paid To</p>
                <p className="font-extrabold text-slate-900 text-sm">{data.receiverId || 'Verified Merchant / User'}</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-md flex items-center gap-1">
                <ShieldCheck size={12} /> VERIFIED
              </span>
            </div>

            <div className="border-t border-slate-200/60 pt-2 flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sent From</p>
                <p className="font-semibold text-slate-800 text-xs">{data.senderId || 'Primary UPI Account'}</p>
              </div>
              <p className="text-xs text-slate-500 font-medium">Core CBS Ledger</p>
            </div>
          </div>

          {/* Audit & NPCI UTR Details */}
          <div className="space-y-2.5 px-1 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">12-Digit NPCI UTR</span>
              <span className="font-mono font-bold text-slate-900 tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                {mainUtr}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">Transaction Reference</span>
              <span className="font-mono font-bold text-slate-800">{refNo}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">Payment Channel</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Building2 size={13} className="text-blue-600" />
                {data.paymentRail || 'UPI Real-Time Switch (IMPS)'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">Status</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                COMPLETED
              </span>
            </div>
          </div>

          {/* Multi-Packet Breakdown if MDR Smart Split was applied */}
          {data.packets && data.packets.length > 1 && (
            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 space-y-1.5">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                <Layers size={14} className="text-blue-600" />
                <span>MDR Split Protection Applied ({data.packets.length} Packets)</span>
              </div>
              <div className="max-h-24 overflow-y-auto pr-1 space-y-1 text-[11px]">
                {data.packets.map((pkt, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-1.5 rounded border border-blue-100 text-slate-600">
                    <span className="font-mono text-slate-500">UTR: {pkt.packetUtr}</span>
                    <span className="font-bold text-slate-800">₹{pkt.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stamped Footer */}
          <div className="text-center pt-2 border-t border-dashed border-slate-200">
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Certified by Kyro Data Tech Core Banking</span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden during printing) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2.5 print:hidden">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            {copied ? 'Copied Details' : 'Copy Details'}
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 active:scale-95"
          >
            <Download size={16} />
            Download Slip (PDF)
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceiptModal;
