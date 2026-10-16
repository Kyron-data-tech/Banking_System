import React, { useState } from 'react';
import { Gift, Sparkles, Trophy, Award, CheckCircle2 } from 'lucide-react';

interface ScratchCard {
  id: string;
  title: string;
  merchant: string;
  amount: number;
  isScratched: boolean;
  color: string;
}

export const RewardsView: React.FC<{ onDepositCashback?: (amount: number) => void }> = ({ onDepositCashback }) => {
  const [cards, setCards] = useState<ScratchCard[]>([
    {
      id: 'c1',
      title: 'Merchant Pay Bonus',
      merchant: 'Metro Supermarket Retail',
      amount: 45,
      isScratched: true,
      color: 'from-amber-400 to-orange-500'
    },
    {
      id: 'c2',
      title: 'Scan & Pay Reward',
      merchant: 'Quick Grocery Store',
      amount: 25,
      isScratched: true,
      color: 'from-emerald-400 to-teal-500'
    },
    {
      id: 'c3',
      title: 'Festive Kyro Cash',
      merchant: 'UPI Peer Transfer',
      amount: 75,
      isScratched: false,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'c4',
      title: 'Weekend Surprise',
      merchant: 'KyroPay UPI Rails',
      amount: 50,
      isScratched: false,
      color: 'from-purple-500 to-pink-600'
    }
  ]);

  const [activeModalCard, setActiveModalCard] = useState<ScratchCard | null>(null);
  const [scratchProgress, setScratchProgress] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  const totalWon = cards.filter(c => c.isScratched).reduce((acc, c) => acc + c.amount, 0);

  const handleOpenScratch = (card: ScratchCard) => {
    setActiveModalCard(card);
    setScratchProgress(card.isScratched ? 100 : 0);
    setIsRevealed(card.isScratched);
  };

  const handleScratchAction = () => {
    if (isRevealed) return;
    const nextProgress = Math.min(100, scratchProgress + 35);
    setScratchProgress(nextProgress);
    if (nextProgress >= 100) {
      setIsRevealed(true);
      if (activeModalCard) {
        setCards(prev => prev.map(c => c.id === activeModalCard.id ? { ...c, isScratched: true } : c));
        if (onDepositCashback) {
          onDepositCashback(activeModalCard.amount);
        }
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl transform translate-x-12 -translate-y-12" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-amber-100 flex items-center gap-1">
                <Sparkles size={12} /> Kyro Rewards
              </span>
            </div>
            <p className="text-amber-100 text-xs font-semibold">Total Cashback Earned</p>
            <h2 className="text-4xl font-black tracking-tight mt-0.5">
              ₹{totalWon.toLocaleString('en-IN')}<span className="text-xl text-amber-200">.00</span>
            </h2>
            <p className="text-[11px] text-amber-100 mt-2 flex items-center gap-1">
              <CheckCircle2 size={13} className="text-white" /> Credited directly to your KyroPay account
            </p>
          </div>
          <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner">
            <Trophy size={32} className="text-amber-200 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Scratch Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-2">
            <Gift size={18} className="text-rose-500" />
            Your Scratch Cards & Rewards
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {cards.filter(c => !c.isScratched).length} Unopened
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {cards.map(card => (
            <div
              key={card.id}
              onClick={() => handleOpenScratch(card)}
              className={`relative rounded-3xl p-5 cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md flex flex-col justify-between min-h-[160px] overflow-hidden ${
                card.isScratched
                  ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  : `bg-gradient-to-br ${card.color} text-white`
              }`}
            >
              {!card.isScratched ? (
                <>
                  <div className="flex justify-between items-start">
                    <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <Gift size={18} />
                    </span>
                    <span className="text-[10px] font-extrabold uppercase bg-white/30 px-2 py-0.5 rounded-full">
                      Tap to Scratch
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-sm">{card.title}</h4>
                    <p className="text-[11px] text-white/80 truncate mt-0.5">{card.merchant}</p>
                  </div>
                  <div className="text-center bg-white/20 py-1.5 rounded-xl backdrop-blur-sm text-xs font-bold">
                    🎁 Surprise Inside
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Award size={18} />
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Won
                    </span>
                  </div>
                  <div className="my-2">
                    <p className="text-2xl font-black text-slate-800 dark:text-white">₹{card.amount}</p>
                    <p className="text-xs text-slate-500 truncate">{card.merchant}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Cashback Credited</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Scratch Modal */}
      {activeModalCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center border border-white/20">
            <h4 className="font-extrabold text-slate-800 dark:text-white text-lg mb-1">
              {activeModalCard.title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{activeModalCard.merchant}</p>

            {/* Scratch Arena */}
            <div
              onClick={handleScratchAction}
              className={`relative mx-auto w-56 h-56 rounded-3xl overflow-hidden flex flex-col items-center justify-center select-none cursor-pointer transition shadow-inner ${
                isRevealed ? 'bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300' : 'bg-slate-100'
              }`}
            >
              {/* Prize underneath */}
              <div className="text-center p-4 animate-scale-up">
                <Trophy size={48} className="mx-auto text-amber-500 mb-2" />
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">You Won</p>
                <h3 className="text-4xl font-black text-slate-800 dark:text-white mt-1">
                  ₹{activeModalCard.amount}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Instant KyroPay Cashback</p>
              </div>

              {/* Scratch Mask Overlay */}
              {!isRevealed && (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${activeModalCard.color} flex flex-col items-center justify-center text-white transition-opacity duration-300`}
                  style={{ opacity: 1 - scratchProgress / 100 }}
                >
                  <Gift size={44} className="mb-2 animate-bounce" />
                  <p className="font-black text-sm">TAP TO SCRATCH</p>
                  <p className="text-[10px] text-white/80 mt-1">
                    {scratchProgress > 0 ? `${scratchProgress}% Scratched` : 'Tap multiple times'}
                  </p>
                </div>
              )}
            </div>

            {isRevealed && (
              <p className="text-xs font-bold text-emerald-600 mt-4 flex items-center justify-center gap-1">
                <CheckCircle2 size={16} /> ₹{activeModalCard.amount} added to your KyroPay balance!
              </p>
            )}

            <button
              onClick={() => setActiveModalCard(null)}
              className="mt-6 w-full py-3 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition"
            >
              {isRevealed ? 'Claim & Close' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
