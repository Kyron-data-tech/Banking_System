import React, { useState } from 'react';
import { 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Radio, 
  Signal, 
  Cpu, 
  Lock
} from 'lucide-react';

interface DeviceBindingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPhone?: string;
  userVpa?: string;
}

export const DeviceBindingModal: React.FC<DeviceBindingModalProps> = ({
  isOpen,
  onClose,
  userPhone = '+91 98765 43210',
  userVpa = 'user@okkyro',
}) => {
  const [selectedSim, setSelectedSim] = useState<'SIM1' | 'SIM2'>('SIM1');
  const [bindingStep, setBindingStep] = useState<'IDLE' | 'SENDING_SMS' | 'NPCI_HANDSHAKE' | 'CRYPTO_KEY' | 'SUCCESS'>('IDLE');

  if (!isOpen) return null;

  const handleStartBinding = () => {
    setBindingStep('SENDING_SMS');
    setTimeout(() => {
      setBindingStep('NPCI_HANDSHAKE');
      setTimeout(() => {
        setBindingStep('CRYPTO_KEY');
        setTimeout(() => {
          setBindingStep('SUCCESS');
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const handleReset = () => {
    setBindingStep('IDLE');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col">
        
        {/* NPCI Tricolor Bar */}
        <div className="h-1.5 w-full flex">
          <div className="h-full w-1/3 bg-[#FF9933]"></div>
          <div className="h-full w-1/3 bg-white"></div>
          <div className="h-full w-1/3 bg-[#138808]"></div>
        </div>

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Smartphone size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm text-white tracking-tight flex items-center gap-1.5">
                NPCI Device & SIM Binding
                <span className="text-[9px] bg-blue-500/20 text-blue-400 font-mono font-bold px-1.5 py-0.2 rounded border border-blue-500/30">UPI 2.0</span>
              </h3>
              <p className="text-[10px] text-slate-400">Hardware Level Cryptographic Device Enrollment</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {bindingStep === 'IDLE' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  Why is Device Binding Required?
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  As mandated by NPCI and RBI, UPI applications must bind your physical SIM card to your device’s hardware cryptographic enclave to prevent clone attacks and unauthorized payments.
                </p>
              </div>

              {/* SIM Selection Cards */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Select Registered UPI SIM
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setSelectedSim('SIM1')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                      selectedSim === 'SIM1' 
                        ? 'bg-blue-950/60 border-blue-500 text-white shadow-lg' 
                        : 'bg-slate-800/40 border-slate-700/80 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Signal size={16} className={selectedSim === 'SIM1' ? 'text-blue-400' : 'text-slate-500'} />
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">SIM 1</span>
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-white">Airtel 5G</p>
                      <p className="text-[10px] font-mono text-slate-400">{userPhone}</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSelectedSim('SIM2')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                      selectedSim === 'SIM2' 
                        ? 'bg-blue-950/60 border-blue-500 text-white shadow-lg' 
                        : 'bg-slate-800/40 border-slate-700/80 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Signal size={16} className={selectedSim === 'SIM2' ? 'text-blue-400' : 'text-slate-500'} />
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">SIM 2</span>
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-white">Jio 5G</p>
                      <p className="text-[10px] font-mono text-slate-400">+91 91234 56789</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hardware Device Summary */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Cpu size={16} className="text-indigo-400" />
                  <div>
                    <span className="font-bold text-white text-[11px]">Hardware Enclave</span>
                    <p className="text-[10px] text-slate-400 font-mono">ECDSA secp256r1 Keypair</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  <Lock size={10} />
                  <span>Hardware Ready</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartBinding}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-black text-xs text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition active:scale-[0.98]"
              >
                <Radio size={16} />
                <span>START ENCRYPTED SMS HANDSHAKE</span>
              </button>
            </div>
          )}

          {/* Binding Animation Steps */}
          {bindingStep !== 'IDLE' && bindingStep !== 'SUCCESS' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mx-auto flex items-center justify-center">
                <Radio size={24} className="text-blue-400 animate-pulse" />
              </div>

              <div>
                <h4 className="font-black text-base text-white">
                  {bindingStep === 'SENDING_SMS' && '1/3 Dispatching Encrypted SMS...'}
                  {bindingStep === 'NPCI_HANDSHAKE' && '2/3 Handshaking with NPCI PSP Switch...'}
                  {bindingStep === 'CRYPTO_KEY' && '3/3 Registering Hardware Crypto Key...'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {bindingStep === 'SENDING_SMS' && `Routing silent binary SMS via ${selectedSim} to +919223008333`}
                  {bindingStep === 'NPCI_HANDSHAKE' && 'Verifying IMSI & Mobile Identity with National Switch'}
                  {bindingStep === 'CRYPTO_KEY' && 'Generating Android KeyStore / Secure Enclave Certificate'}
                </p>
              </div>

              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-500"
                  style={{
                    width: bindingStep === 'SENDING_SMS' ? '33%' : bindingStep === 'NPCI_HANDSHAKE' ? '66%' : '90%'
                  }}
                />
              </div>
            </div>
          )}

          {/* Success Step */}
          {bindingStep === 'SUCCESS' && (
            <div className="py-4 text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h4 className="font-black text-base text-white">Device Bound Successfully!</h4>
                <p className="text-xs text-slate-400 mt-0.5">Your smartphone is authenticated with NPCI Core Banking</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">BOUND SIM:</span>
                  <span className="text-white font-bold">{selectedSim === 'SIM1' ? 'Airtel 5G (SIM 1)' : 'Jio 5G (SIM 2)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">DEVICE TOKEN:</span>
                  <span className="text-emerald-400 truncate max-w-[180px]">NP-DEV-{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PRIMARY VPA:</span>
                  <span className="text-blue-400">{userVpa}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">STATUS:</span>
                  <span className="text-emerald-400 font-bold">🟢 HARDWARE TRUSTED</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  Re-verify
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="py-2.5 px-4 bg-slate-950 text-center border-t border-slate-800 text-[10px] text-slate-500 font-mono">
          NPCI Circular Compliant • Zero Clone Hardware Authentication
        </div>

      </div>
    </div>
  );
};
