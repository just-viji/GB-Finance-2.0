
import React, { useEffect, useState } from 'react';

export interface ToastProps {
  isVisible: boolean;
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ isVisible, message, type = 'success', onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 300); // Wait for fade-out animation
      return () => clearTimeout(timer);
    }
  }, [isVisible]);
  
  if (!show) return null;

  // Added z-[100] to ensure it is above modals and navigation
  // Changed bottom-5 to bottom-24 (mobile) and sm:bottom-8 (desktop) to clear the navbar
  const baseClasses = "fixed bottom-24 right-5 left-5 sm:left-auto sm:bottom-8 sm:right-8 w-auto sm:max-w-xs p-4 rounded-lg shadow-2xl text-white text-sm font-semibold flex items-center gap-3 z-[100] transform transition-all duration-300";
  const typeClasses = {
    success: "bg-brand-primary",
    error: "bg-brand-accent",
  };

  const icon = {
     success: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
     error: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
  }

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${isVisible ? 'toast-enter-active' : 'toast-exit-active'}`}>
        <div className="flex-shrink-0">
          {icon[type]}
        </div>
        <span className="flex-grow">{message}</span>
        <button 
          onClick={onClose} 
          className="ml-auto p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Close notification"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
    </div>
  );
};

export default Toast;
