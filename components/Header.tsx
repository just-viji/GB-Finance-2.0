
import React, { useState } from 'react';

interface HeaderProps {
    userEmail?: string;
    userAvatar?: string;
    onAddTransaction: () => void;
    onProfileClick?: () => void;
    theme?: 'light' | 'dark';
    onThemeToggle?: () => void;
}

export const Logo: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <div className="flex items-center justify-center" style={{ width: size, height: size }}>
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#logoGrad)" fillOpacity="0.1"/>
      <rect x="15" y="25" width="70" height="55" rx="4" fill="#0F172A"/>
      <rect x="70" y="42" width="22" height="22" rx="4" fill="#10B981"/>
      <path d="M28 62 L45 45 L58 55 L75 30" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  </div>
);

const Header: React.FC<HeaderProps> = ({ userEmail, userAvatar, onAddTransaction, onProfileClick, theme, onThemeToggle }) => {
  const [imgError, setImgError] = useState(false);
  
  const email = userEmail?.toLowerCase();
  const avatarSrc = !imgError 
    ? (userAvatar || (email ? `https://unavatar.io/${encodeURIComponent(email)}` : undefined))
    : undefined;

  return (
    <header className="sticky top-0 z-[90] w-full pt-safe">
      <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-none select-none">
            GB <span className="text-brand-primary">Finance</span>
          </h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={onThemeToggle}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <button 
            onClick={onAddTransaction}
            className="flex items-center gap-2 bg-brand-dark dark:bg-brand-primary text-white h-9 px-4 rounded-lg font-bold text-[10px] transition-all hover:bg-slate-800 dark:hover:bg-brand-primary-hover active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline uppercase tracking-widest">Add Transaction</span>
            <span className="sm:hidden uppercase tracking-widest">Add</span>
          </button>

          <button 
            onClick={onProfileClick}
            className="flex-shrink-0 focus:outline-none rounded-full ml-1"
          >
            <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              {avatarSrc ? (
                <img 
                  src={avatarSrc} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center font-bold text-xs text-slate-500">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
