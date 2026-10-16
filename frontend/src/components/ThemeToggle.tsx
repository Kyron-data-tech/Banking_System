import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 'md' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  const currentIconSize = iconSizes[size];

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Dark/Light Mode"
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300 active:scale-90 cursor-pointer ${
        isDark
          ? 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700 shadow-md shadow-amber-500/10'
          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm'
      } ${className}`}
    >
      {isDark ? (
        <Sun size={currentIconSize} className="animate-spin-slow transition-transform hover:rotate-45" />
      ) : (
        <Moon size={currentIconSize} className="transition-transform hover:-rotate-12" />
      )}
      <span className="sr-only">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  );
};
