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

  const baseClasses = "fixed bottom-5 right-5 w-full max-w-xs p-4 rounded-lg shadow-lg text-white text-sm font-semibold flex items-center gap-3";
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
        {icon[type]}
        <span>{message}</span>
    </div>
  );
};

export default Toast;