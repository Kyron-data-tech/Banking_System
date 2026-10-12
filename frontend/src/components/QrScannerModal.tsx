import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  QrCode, 
  RefreshCw,
  Zap,
  Coffee,
  ShoppingBag
} from 'lucide-react';

export interface ScannedUpiPayload {
  vpa: string;
  payeeName?: string;
  amount?: string;
  note?: string;
  raw: string;
}

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (payload: ScannedUpiPayload) => void;
}

export function parseUpiQrString(raw: string): ScannedUpiPayload | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // 1. Standard NPCI upi://pay URI
  if (trimmed.toLowerCase().startsWith('upi://pay')) {
    try {
      const url = new URL(trimmed);
      const pa = url.searchParams.get('pa') || '';
      const pn = url.searchParams.get('pn') || '';
      const am = url.searchParams.get('am') || '';
      const tn = url.searchParams.get('tn') || '';
      if (pa) {
        return {
          vpa: decodeURIComponent(pa),
          payeeName: pn ? decodeURIComponent(pn) : undefined,
          amount: am || undefined,
          note: tn ? decodeURIComponent(tn) : undefined,
          raw: trimmed
        };
      }
    } catch {
      // Manual fallback parse
      const queryIdx = trimmed.indexOf('?');
      if (queryIdx !== -1) {
        const params = new URLSearchParams(trimmed.slice(queryIdx + 1));
        const pa = params.get('pa');
        if (pa) {
          return {
            vpa: decodeURIComponent(pa),
            payeeName: params.get('pn') ? decodeURIComponent(params.get('pn')!) : undefined,
            amount: params.get('am') || undefined,
            note: params.get('tn') ? decodeURIComponent(params.get('tn')!) : undefined,
            raw: trimmed
          };
        }
      }
    }
  }

  // 2. Direct VPA handle (e.g., user@okkyro, 9876543210@ybl, merchant@icici)
  if (trimmed.includes('@') && !trimmed.includes(' ') && trimmed.length >= 5) {
    return {
      vpa: trimmed,
      payeeName: trimmed.split('@')[0],
      raw: trimmed
    };
  }

  return null;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'demo'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<ScannedUpiPayload | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Success audio chime
  const playChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }, []);

  const handleDetected = useCallback((payload: ScannedUpiPayload) => {
    playChime();
    setScannedResult(payload);
    setTimeout(() => {
      onScanSuccess(payload);
      onClose();
    }, 700);
  }, [playChime, onScanSuccess, onClose]);

  // Camera Scanning Loop
  const tick = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.height = videoRef.current.videoHeight;
          canvas.width = videoRef.current.videoWidth;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            const parsed = parseUpiQrString(code.data);
            if (parsed) {
              handleDetected(parsed);
              return; // Stop scanning once detected
            }
          }
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(tick);
  }, [handleDetected]);

  // Start Camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        animationFrameId.current = requestAnimationFrame(tick);
      }
    } catch (err: any) {
      setCameraError('Camera access unavailable. You can upload a QR image or select from Quick Presets below.');
    }
  }, [tick]);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setScannedResult(null);
      if (activeTab === 'camera') {
        startCamera();
      } else {
        stopCamera();
      }
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab, startCamera, stopCamera]);

  // Handle Image File Upload (e.g. from WhatsApp, Gallery, Screenshot)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessingImage(false);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        setIsProcessingImage(false);

        if (code && code.data) {
          const parsed = parseUpiQrString(code.data);
          if (parsed) {
            handleDetected(parsed);
          } else {
            alert(`QR detected, but not a recognized UPI format: ${code.data}`);
          }
        } else {
          alert('No QR code could be found in the uploaded image. Please ensure the QR is clear and visible.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Demo Presets for Hackathon / Presentation
  const demoQrs = [
    {
      title: 'Vansh Jain (Merchant)',
      handle: 'vanshj7818@okkyro',
      name: 'Vansh Jain',
      presetAmount: '1195.00',
      icon: ShoppingBag,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    },
    {
      title: 'MJ Style (Personal)',
      handle: 'mjstyle65@okkyro',
      name: 'MJ Style',
      presetAmount: '500.00',
      icon: Zap,
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    {
      title: 'Starbucks Coffee',
      handle: 'starbucks@upi',
      name: 'Starbucks Store #402',
      presetAmount: '280.00',
      icon: Coffee,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700'
    },
    {
      title: 'NPCI MDR Split Test (> ₹2,000)',
      handle: 'vanshj7818@okkyro',
      name: 'Merchant Corporate Store',
      presetAmount: '5500.00',
      icon: Sparkles,
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <QrCode size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Scan Any UPI QR</h3>
              <p className="text-xs text-blue-100">Supports PhonePe, GPay, Paytm, BHIM & All UPI Apps</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-2 bg-slate-100 gap-1 border-b border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${activeTab === 'camera' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Camera size={14} /> Live Camera
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${activeTab === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Upload size={14} /> Upload Image
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${activeTab === 'demo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Sparkles size={14} /> Demo QRs
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto no-scrollbar flex-1">
          
          {/* TAB 1: LIVE CAMERA */}
          {activeTab === 'camera' && (
            <div className="flex flex-col items-center">
              {cameraError ? (
                <div className="p-6 text-center bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 w-full mb-4">
                  <AlertCircle size={32} className="mx-auto mb-2 text-amber-600" />
                  <p className="text-sm font-semibold mb-2">Camera Notice</p>
                  <p className="text-xs text-amber-700 mb-4">{cameraError}</p>
                  <div className="flex gap-2 justify-center">
                    <button 
                      onClick={() => setActiveTab('upload')} 
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Upload QR Image
                    </button>
                    <button 
                      onClick={() => setActiveTab('demo')} 
                      className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
                    >
                      Use Demo QRs
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full aspect-square max-w-[280px] rounded-3xl overflow-hidden bg-black shadow-inner flex items-center justify-center border-4 border-slate-800">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover" 
                    muted 
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanning Overlay & Laser */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                    {/* Corner Reticles */}
                    <div className="flex justify-between">
                      <div className="w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                      <div className="w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                    </div>
                    <div className="flex justify-between">
                      <div className="w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                      <div className="w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
                    </div>

                    {/* Animated Scanning Laser */}
                    <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500 text-center mt-4">
                Point your camera at any UPI QR code (PhonePe, GPay, Paytm, BHIM, etc.)
              </p>
            </div>
          )}

          {/* TAB 2: UPLOAD IMAGE */}
          {activeTab === 'upload' && (
            <div className="flex flex-col items-center">
              <label className="w-full border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <Upload size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Upload QR Code Screenshot</p>
                  <p className="text-xs text-slate-500 mt-1">Select any image from WhatsApp, Gallery or Desktop</p>
                </div>
                <span className="text-[11px] font-bold text-blue-600 bg-white px-3 py-1 rounded-full border border-blue-200">
                  Browse Files (PNG, JPG, WEBP)
                </span>
              </label>

              {isProcessingImage && (
                <div className="flex items-center gap-2 mt-4 text-xs font-bold text-blue-600">
                  <RefreshCw className="animate-spin" size={14} /> Decoding QR code...
                </div>
              )}

              <div className="w-full mt-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Or Paste UPI QR String / VPA</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g. upi://pay?pa=vanshj7818@okkyro&pn=Vansh"
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const parsed = parseUpiQrString(manualInput);
                      if (parsed) handleDetected(parsed);
                      else alert('Invalid format. Please enter a valid UPI string or name@handle');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    Parse
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ONE-CLICK DEMO QRs */}
          {activeTab === 'demo' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">
                Click any of these simulated real-world UPI QRs to instantly trigger scanning and pre-populate the payment flow:
              </p>
              {demoQrs.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      const payload: ScannedUpiPayload = {
                        vpa: item.handle,
                        payeeName: item.name,
                        amount: item.presetAmount,
                        raw: `upi://pay?pa=${item.handle}&pn=${encodeURIComponent(item.name)}&am=${item.presetAmount}&cu=INR`
                      };
                      handleDetected(payload);
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer hover:shadow-md transition flex items-center justify-between ${item.color}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500 font-mono">{item.handle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-800 shadow-sm">
                        ₹{item.presetAmount}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">Tap to scan</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Scanned Success Preview Overlay */}
          {scannedResult && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-fade-in text-emerald-800">
              <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-emerald-700">QR Code Verified!</p>
                <p className="font-bold text-sm truncate">{scannedResult.payeeName || scannedResult.vpa}</p>
                <p className="text-xs text-slate-500 truncate">{scannedResult.vpa} {scannedResult.amount ? `• ₹${scannedResult.amount}` : ''}</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
