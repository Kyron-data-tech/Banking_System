import React, { useState } from 'react';
import { Volume2, Play, Radio } from 'lucide-react';
import { playKyroPaySoundbox } from '../utils/soundbox';

export const SoundboxTester: React.FC<{ defaultAmount?: number }> = ({ defaultAmount = 100 }) => {
  const [testAmount, setTestAmount] = useState<number>(defaultAmount);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedLang, setSelectedLang] = useState<'hi' | 'en'>('hi');

  const handleTestSound = (amt: number) => {
    setIsPlaying(true);
    playKyroPaySoundbox(amt, selectedLang);
    setTimeout(() => setIsPlaying(false), 2500);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 text-white shadow-2xl border border-blue-500/30 relative overflow-hidden animate-fade-in">
      <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl" />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
            <Volume2 size={24} className={isPlaying ? 'animate-bounce text-emerald-400' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-base">KyroPay Smart Soundbox</h4>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Radio size={10} className="animate-pulse" /> LIVE HARDWARE SYNC
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              Voice confirmation for merchant QR & personal UPI transactions
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/10 rounded-2xl p-4 border border-white/10 mb-4 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-blue-200">Test Voice Amount (₹)</label>
          <div className="flex gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setSelectedLang('hi')}
              className={`px-2 py-0.5 rounded-md font-bold transition ${selectedLang === 'hi' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              Hindi + Eng
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang('en')}
              className={`px-2 py-0.5 rounded-md font-bold transition ${selectedLang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              English Only
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={testAmount}
            onChange={(e) => setTestAmount(Number(e.target.value) || 0)}
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white font-bold text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="button"
            onClick={() => handleTestSound(testAmount)}
            disabled={isPlaying || testAmount <= 0}
            className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer disabled:opacity-50"
          >
            <Play size={14} /> Play Voice Alert
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs relative z-10">
        <span className="text-[11px] text-blue-200 shrink-0 font-medium">Quick Test:</span>
        {[50, 100, 250, 500, 1000].map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => {
              setTestAmount(amt);
              handleTestSound(amt);
            }}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold text-xs border border-white/15 transition shrink-0 active:scale-95"
          >
            ₹{amt}
          </button>
        ))}
      </div>
    </div>
  );
};
