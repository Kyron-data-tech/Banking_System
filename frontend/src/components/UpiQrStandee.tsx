import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Check, 
  Copy, 
  Download, 
  ShieldCheck, 
  Sparkles, 
  RotateCcw
} from 'lucide-react';

interface UpiQrStandeeProps {
  fullName: string;
  primaryUpiId: string;
  phoneNumber?: string;
  isMerchant?: boolean;
}

export const UpiQrStandee: React.FC<UpiQrStandeeProps> = ({
  fullName,
  primaryUpiId,
  phoneNumber = '',
  isMerchant = false
}) => {
  const [selectedIdType, setSelectedIdType] = useState<'primary' | 'phone' | 'custom'>('primary');
  const [customHandle, setCustomHandle] = useState('');
  const [presetAmount, setPresetAmount] = useState('');
  const [copied, setCopied] = useState(false);

  const effectivePhone = phoneNumber || localStorage.getItem('kyro_user_real_phone') || localStorage.getItem('kyro_sim_phone') || '';
  // Active UPI ID based on user selection
  const phoneUpiId = effectivePhone ? `${effectivePhone.replace(/[^0-9]/g, '')}@okkyro` : primaryUpiId;
  const activeUpiId = 
    selectedIdType === 'primary' 
      ? primaryUpiId 
      : selectedIdType === 'phone' 
        ? phoneUpiId 
        : (customHandle || primaryUpiId);

  // Generate NPCI UPI URI
  const amountParam = presetAmount && Number(presetAmount) > 0 ? `&am=${Number(presetAmount).toFixed(2)}` : '';
  const upiUri = `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(fullName)}&cu=INR${amountParam}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const svg = document.getElementById('upi-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const a = document.createElement('a');
        a.download = `${activeUpiId}-QR.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center animate-fade-in max-w-md mx-auto">
      
      {/* Configuration Bar */}
      <div className="w-full bg-white p-4 rounded-3xl border border-slate-200 shadow-sm mb-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Select Active UPI Handle
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedIdType('primary')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition text-center truncate ${selectedIdType === 'primary' ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Primary ID
            </button>
            <button
              type="button"
              onClick={() => setSelectedIdType('phone')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition text-center truncate ${selectedIdType === 'phone' ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Phone UPI
            </button>
            <button
              type="button"
              onClick={() => setSelectedIdType('custom')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition text-center truncate ${selectedIdType === 'custom' ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Custom
            </button>
          </div>
        </div>

        {selectedIdType === 'custom' && (
          <div className="space-y-1.5 animate-fade-in">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-500 uppercase">Real Bank UPI ID / Custom VPA</label>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">PhonePe / GPay Live</span>
            </div>
            <input
              type="text"
              value={customHandle}
              onChange={(e) => setCustomHandle(e.target.value)}
              placeholder="e.g. yourphone@ybl, yourname@okhdfcbank, or shop@paytm"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-[10px] text-blue-600 dark:text-blue-400">
              💡 <strong>Test with real phone:</strong> Enter your real UPI ID above. Anyone scanning this QR Standee with PhonePe or GPay will send real money directly to your bank!
            </p>
          </div>
        )}

        {/* Set Specific Amount (Request Payment) */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Request Specific Amount (Optional)
            </label>
            {presetAmount && (
              <button
                type="button"
                onClick={() => setPresetAmount('')}
                className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1"
              >
                <RotateCcw size={10} /> Reset
              </button>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
            <input
              type="number"
              min="1"
              value={presetAmount}
              onChange={(e) => setPresetAmount(e.target.value)}
              placeholder="0.00 (Leave empty for any amount)"
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>
          <div className="flex gap-1.5 mt-2">
            {['100', '500', '1999', '5000'].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setPresetAmount(amt)}
                className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600 transition"
              >
                +₹{amt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Official UPI Standee Card */}
      <div className="w-full bg-white rounded-[32px] border-2 border-slate-200 shadow-2xl overflow-hidden relative">
        
        {/* Standee Top Ribbon */}
        <div className={`p-6 text-white text-center relative overflow-hidden ${isMerchant ? 'bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              {isMerchant ? 'Kyro Merchant QR' : 'KyroPay Personal QR'}
            </span>
            <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              <ShieldCheck size={12} /> NPCI Verified
            </div>
          </div>

          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
            <span className="text-2xl font-black text-blue-600">
              {fullName.charAt(0).toUpperCase()}
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight">{fullName}</h2>
          <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full mt-1.5">
            <p className="text-xs font-mono font-medium text-blue-100">{activeUpiId}</p>
          </div>
        </div>

        {/* QR Canvas Area */}
        <div className="p-6 flex flex-col items-center bg-slate-50/50">
          <div className="p-4 bg-white rounded-3xl shadow-md border border-slate-200 flex flex-col items-center">
            <div className="p-2 border-2 border-dashed border-blue-200 rounded-2xl">
              <QRCodeSVG
                id="upi-qr-svg"
                value={upiUri}
                size={210}
                level="H"
                includeMargin={true}
              />
            </div>

            {presetAmount && (
              <div className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1 animate-fade-in">
                <Sparkles size={14} /> Pay Preset: ₹{Number(presetAmount).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          <p className="text-xs font-bold text-slate-700 mt-4 text-center">
            Scan with any UPI App to Pay
          </p>

          {/* Supported UPI Apps Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
            {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay'].map((app) => (
              <span key={app} className="text-[10px] font-extrabold bg-white border border-slate-200 px-2.5 py-0.5 rounded-md text-slate-600 shadow-2xs">
                {app}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-3 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-700 transition flex items-center justify-center gap-1.5 shadow-2xs"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy UPI ID'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Download size={16} /> Download Standee
          </button>
        </div>

      </div>
    </div>
  );
};
