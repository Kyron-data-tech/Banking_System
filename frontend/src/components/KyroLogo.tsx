import React from 'react';

interface KyroLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showText?: boolean;
  title?: string;
  subtitle?: string;
  variant?: 'personal' | 'merchant' | 'bank' | 'default';
  animated?: boolean;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-16 h-16',
  '2xl': 'w-20 h-20',
};

const textSizeMap = {
  sm: { title: 'text-base font-extrabold', sub: 'text-[10px]' },
  md: { title: 'text-xl font-black', sub: 'text-xs' },
  lg: { title: 'text-2xl font-black tracking-tight', sub: 'text-xs' },
  xl: { title: 'text-3xl font-black tracking-tight', sub: 'text-sm' },
  '2xl': { title: 'text-4xl font-black tracking-tight', sub: 'text-sm' },
};

export const KyroLogo: React.FC<KyroLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  title,
  subtitle,
  variant = 'default',
  animated = false,
}) => {
  // Determine variant styling & text defaults
  let defaultTitle = 'KyroPay';
  let defaultSub = 'Enterprise Payment Switch';
  let gradFrom = 'from-blue-600';
  let gradVia = 'via-indigo-600';
  let gradTo = 'to-cyan-500';
  let shadowColor = 'shadow-blue-500/25';
  let badgeText = '';

  if (variant === 'personal') {
    defaultTitle = 'KyroPay';
    defaultSub = 'UPI 2.0 & Instant Payments';
    gradFrom = 'from-blue-600';
    gradVia = 'via-blue-700';
    gradTo = 'to-cyan-400';
    shadowColor = 'shadow-blue-500/30';
    badgeText = 'Personal';
  } else if (variant === 'merchant') {
    defaultTitle = 'KyroPay Business';
    defaultSub = 'Merchant POS, Soundbox & Settlements';
    gradFrom = 'from-indigo-600';
    gradVia = 'via-purple-600';
    gradTo = 'to-pink-500';
    shadowColor = 'shadow-purple-500/30';
    badgeText = 'Merchant';
  } else if (variant === 'bank') {
    defaultTitle = 'KyroBank CBS';
    defaultSub = 'Core Banking System & Clearing Switch';
    gradFrom = 'from-slate-900';
    gradVia = 'via-blue-900';
    gradTo = 'to-emerald-500';
    shadowColor = 'shadow-slate-900/30';
    badgeText = 'Bank Admin';
  }

  const finalTitle = title || defaultTitle;
  const finalSub = subtitle || defaultSub;

  return (
    <div className={`inline-flex items-center gap-3.5 select-none ${className}`}>
      {/* Brand Icon Badge */}
      <div
        className={`relative ${sizeMap[size]} shrink-0 rounded-2xl bg-gradient-to-br ${gradFrom} ${gradVia} ${gradTo} p-0.5 shadow-xl ${shadowColor} flex items-center justify-center ${
          animated ? 'transform transition-all duration-300 hover:scale-105 hover:rotate-3' : ''
        }`}
      >
        {/* Inner Dark Glass Container */}
        <div className="w-full h-full bg-slate-950/85 backdrop-blur-sm rounded-[14px] flex items-center justify-center p-2 relative overflow-hidden">
          {/* Subtle Corner Light Beam */}
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-cyan-400/30 rounded-full blur-md" />
          
          {/* Razor-sharp Vector Shield & K Arrow */}
          <svg
            className="w-full h-full drop-shadow-[0_2px_8px_rgba(56,189,248,0.5)]"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={`grad-shield-${variant}`} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
              <linearGradient id={`grad-arrow-${variant}`} x1="30" y1="70" x2="85" y2="15" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#22D3EE" />
              </linearGradient>
            </defs>

            {/* Shield Outline */}
            <path
              d="M50 12 C70 12 85 18 85 36 C85 64 58 84 50 90 C42 84 15 64 15 36 C15 18 30 12 50 12 Z"
              fill="#0F172A"
              stroke={`url(#grad-shield-${variant})`}
              strokeWidth="4"
              strokeLinejoin="round"
            />

            {/* Vertical Pillar of 'K' */}
            <path
              d="M34 30 L34 70"
              stroke="#F8FAFC"
              strokeWidth="7"
              strokeLinecap="round"
            />

            {/* Lower Leg of 'K' */}
            <path
              d="M38 52 L62 72"
              stroke={`url(#grad-shield-${variant})`}
              strokeWidth="6.5"
              strokeLinecap="round"
            />

            {/* Upper Arrow Beam of 'K' (Payment Beam) */}
            <path
              d="M38 50 L70 24"
              stroke={`url(#grad-arrow-${variant})`}
              strokeWidth="6.5"
              strokeLinecap="round"
            />

            {/* Arrow Head */}
            <path
              d="M56 22 L73 22 L73 39"
              fill="none"
              stroke={`url(#grad-arrow-${variant})`}
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Pulse Indicator */}
            <circle cx="73" cy="22" r="3.5" fill="#38BDF8" />
          </svg>
        </div>
      </div>

      {/* Typography Block */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`${textSizeMap[size].title} text-slate-900 tracking-tight flex items-center`}
            >
              {finalTitle.split(' ')[0]}
              {finalTitle.split(' ').length > 1 && (
                <span className="text-blue-600 ml-1">
                  {finalTitle.split(' ').slice(1).join(' ')}
                </span>
              )}
            </span>
            {badgeText && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {badgeText}
              </span>
            )}
          </div>
          {finalSub && (
            <span className={`${textSizeMap[size].sub} font-medium text-slate-500`}>
              {finalSub}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default KyroLogo;
